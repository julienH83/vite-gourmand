// Variables d'environnement minimales pour les tests (pas de vraie DB nécessaire)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_min_32_chars_long__';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_min_32__';
process.env.JWT_EXPIRY = '15m';
process.env.JWT_REFRESH_EXPIRY = '7d';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_PORT = '1025';
process.env.SMTP_FROM = 'test@vitegourmand.fr';
process.env.ADMIN_EMAIL = 'admin@vitegourmand.fr';
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5432';
process.env.POSTGRES_DB = 'vitegourmand_test';
process.env.POSTGRES_USER = 'vitegourmand';
process.env.POSTGRES_PASSWORD = 'test';
process.env.MONGO_HOST = 'localhost';
process.env.MONGO_PORT = '27017';
process.env.MONGO_DB = 'vitegourmand_test';
