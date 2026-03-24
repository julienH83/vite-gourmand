const bcrypt = require('bcrypt');
const NotFoundError = require('../errors/NotFoundError');
const ValidationError = require('../errors/ValidationError');
const ConflictError = require('../errors/ConflictError');
const ForbiddenError = require('../errors/ForbiddenError');
const logger = require('../utils/logger');

class UserService {
  constructor(pool, userRepository, emailService) {
    this._pool = pool;
    this._userRepo = userRepository;
    this._emailService = emailService;
  }

  async updateProfile(userId, data) {
    return this._userRepo.updateProfile(userId, data);
  }

  async changePassword(userId, currentPassword, newPassword) {
    const currentHash = await this._userRepo.findPasswordHash(userId);
    if (!currentHash) {
      throw new NotFoundError('Utilisateur non trouvé.');
    }

    const isValid = await bcrypt.compare(currentPassword, currentHash);
    if (!isValid) {
      throw new ValidationError('Mot de passe actuel incorrect.');
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await this._userRepo.updatePassword(userId, newHash);
    return { message: 'Mot de passe mis à jour.' };
  }

  async exportData(userId) {
    const user = await this._userRepo.findById(userId);
    const orders = await this._userRepo.findOrdersForExport(userId);
    const reviews = await this._userRepo.findReviewsForExport(userId);

    // Log RGPD : trace de l'exercice du droit à la portabilité (art.20 RGPD)
    console.log(JSON.stringify({
      rgpd_action: 'EXPORT_DATA',
      user_id: userId,
      timestamp: new Date().toISOString(),
    }));

    return {
      exported_at: new Date().toISOString(),
      user,
      orders,
      reviews,
    };
  }

  async deleteAccount(userId) {
    const client = await this._pool.connect();
    try {
      await client.query('BEGIN');

      const userData = await this._userRepo.findNameAndEmail(userId, client);
      if (!userData) {
        throw new NotFoundError('Utilisateur non trouvé.');
      }

      const activeOrders = await this._userRepo.findActiveOrdersByUserId(userId, client);
      if (activeOrders.length > 0) {
        throw new ValidationError('Vous avez des commandes en cours. Veuillez attendre leur finalisation.');
      }

      await this._userRepo.anonymize(userId, client);

      await client.query('COMMIT');

      // Log RGPD : trace de l'exercice du droit à l'effacement (art.17 RGPD)
      console.log(JSON.stringify({
        rgpd_action: 'ACCOUNT_ANONYMIZED',
        user_id: userId,
        timestamp: new Date().toISOString(),
      }));

      try {
        await this._emailService.sendAccountDeletedEmail(userData);
      } catch (emailErr) {
        logger.error('Failed to send deletion email:', emailErr.message);
      }

      return { message: 'Votre compte a \u00e9t\u00e9 supprim\u00e9 et vos donn\u00e9es anonymis\u00e9es.' };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async listUsers(filters) {
    return this._userRepo.findAll(filters);
  }

  async listClients() {
    return this._userRepo.findClients();
  }

  async createEmployee(data) {
    const existing = await this._userRepo.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Un compte existe déjà avec cet email.');
    }

    // Sécurité : salt rounds 12 (recommandation OWASP 2024)
    const password_hash = await bcrypt.hash(data.password, 12);

    const employee = await this._userRepo.createEmployee({
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      password_hash,
    });

    try {
      await this._emailService.sendEmployeeAccountEmail({ first_name: data.first_name, email: data.email });
    } catch (emailErr) {
      logger.error('Failed to send employee email:', emailErr.message);
    }

    return employee;
  }

  async toggleStatus(userId) {
    const user = await this._userRepo.findRoleAndStatus(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur non trouvé.');
    }

    if (user.role === 'admin') {
      throw new ForbiddenError('Impossible de modifier un compte administrateur.');
    }

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    return this._userRepo.updateStatus(userId, newStatus);
  }
}

module.exports = UserService;
