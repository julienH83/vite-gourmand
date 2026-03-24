const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ConflictError = require('../errors/ConflictError');
const UnauthorizedError = require('../errors/UnauthorizedError');
const ForbiddenError = require('../errors/ForbiddenError');
const ValidationError = require('../errors/ValidationError');
const NotFoundError = require('../errors/NotFoundError');
const logger = require('../utils/logger');

class AuthService {
  constructor(userRepository, emailService, jwtConfig) {
    this._userRepo = userRepository;
    this._emailService = emailService;
    this._jwtConfig = jwtConfig;
  }

  _generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      this._jwtConfig.secret,
      { expiresIn: this._jwtConfig.expiry }
    );
  }

  _generateRefreshToken(userId) {
    return jwt.sign(
      { id: userId },
      this._jwtConfig.refreshSecret,
      { expiresIn: this._jwtConfig.refreshExpiry }
    );
  }

  async register(userData) {
    const { first_name, last_name, phone, email, address, password } = userData;

    const existing = await this._userRepo.findByEmail(email);
    if (existing) {
      throw new ConflictError('Un compte existe d\u00e9j\u00e0 avec cet email.');
    }

    // Sécurité : salt rounds 12 (recommandation OWASP 2024, min 12)
    const password_hash = await bcrypt.hash(password, 12);

    const user = await this._userRepo.create({
      first_name,
      last_name,
      phone,
      email,
      address,
      password_hash,
      role: 'user',
      status: 'active',
      rgpd_consent: true
    });

    const token = this._generateToken(user);
    const refreshToken = this._generateRefreshToken(user.id);

    try {
      await this._emailService.sendWelcomeEmail({ email, first_name });
    } catch (err) {
      logger.error('Failed to send welcome email:', err.message);
    }

    return { user, token, refreshToken };
  }

  async login(email, password) {
    const user = await this._userRepo.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedError('Email ou mot de passe incorrect.');
    }

    if (user.status === 'inactive') {
      throw new ForbiddenError('Ce compte a \u00e9t\u00e9 d\u00e9sactiv\u00e9.');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedError('Email ou mot de passe incorrect.');
    }

    const token = this._generateToken(user);
    const refreshToken = this._generateRefreshToken(user.id);

    const { password_hash, ...userData } = user;
    return { user: userData, token, refreshToken };
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw new ValidationError('Token de rafra\u00eechissement requis.');
    }

    let payload;
    try {
      payload = jwt.verify(refreshToken, this._jwtConfig.refreshSecret);
    } catch (err) {
      throw new UnauthorizedError('Token invalide ou expir\u00e9.');
    }

    const user = await this._userRepo.findByIdBasic(payload.id);
    if (!user || user.status === 'inactive') {
      throw new UnauthorizedError('Token invalide.');
    }

    const token = this._generateToken(user);
    return { token };
  }

  async forgotPassword(email) {
    const user = await this._userRepo.findByEmailFull(email);

    if (!user) {
      return { message: 'Si cet email existe, un lien de r\u00e9initialisation a \u00e9t\u00e9 envoy\u00e9.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);

    await this._userRepo.setResetToken(user.id, resetToken, expires);

    try {
      await this._emailService.sendPasswordResetEmail(user, resetToken);
    } catch (err) {
      logger.error('Failed to send reset email:', err.message);
    }

    return { message: 'Si cet email existe, un lien de r\u00e9initialisation a \u00e9t\u00e9 envoy\u00e9.' };
  }

  async resetPassword(token, password) {
    const user = await this._userRepo.findByResetToken(token);
    if (!user) {
      throw new ValidationError('Token invalide ou expir\u00e9.');
    }

    // Sécurité : salt rounds 12 (recommandation OWASP 2024)
    const password_hash = await bcrypt.hash(password, 12);
    await this._userRepo.updatePassword(user.id, password_hash);

    return { message: 'Mot de passe r\u00e9initialis\u00e9 avec succ\u00e8s.' };
  }

  async getMe(userId) {
    const user = await this._userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('Utilisateur non trouv\u00e9.');
    }

    return user;
  }
}

module.exports = AuthService;
