class UserController {
  constructor(userService) {
    this._userService = userService;
    this.updateProfile = this.updateProfile.bind(this);
    this.exportData = this.exportData.bind(this);
    this.deleteAccount = this.deleteAccount.bind(this);
    this.listUsers = this.listUsers.bind(this);
    this.listClients = this.listClients.bind(this);
    this.createEmployee = this.createEmployee.bind(this);
    this.toggleStatus = this.toggleStatus.bind(this);
    this.changePassword = this.changePassword.bind(this);
  }

  async updateProfile(req, res, next) {
    try {
      const result = await this._userService.updateProfile(req.user.id, req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async exportData(req, res, next) {
    try {
      const result = await this._userService.exportData(req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async deleteAccount(req, res, next) {
    try {
      const result = await this._userService.deleteAccount(req.user.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async listUsers(req, res, next) {
    try {
      const result = await this._userService.listUsers(req.query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async listClients(req, res, next) {
    try {
      const result = await this._userService.listClients();
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async createEmployee(req, res, next) {
    try {
      const result = await this._userService.createEmployee(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async toggleStatus(req, res, next) {
    try {
      const result = await this._userService.toggleStatus(req.params.id);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { current_password, new_password } = req.body;
      const result = await this._userService.changePassword(req.user.id, current_password, new_password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserController;
