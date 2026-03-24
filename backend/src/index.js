require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { pool, connectMongo } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const OrderAnalytics = require('./models/OrderAnalytics');

// --- Route factories ---
const createAuthRoutes = require('./routes/auth');
const createMenuRoutes = require('./routes/menus');
const createDishRoutes = require('./routes/dishes');
const createOrderRoutes = require('./routes/orders');
const createReviewRoutes = require('./routes/reviews');
const createContactRoutes = require('./routes/contact');
const createHoursRoutes = require('./routes/hours');
const createLegalRoutes = require('./routes/legal');
const createUserRoutes = require('./routes/users');
const createAnalyticsRoutes   = require('./routes/analytics');
const createQuoteRoutes       = require('./routes/quotes');
const createQuoteOptionRoutes  = require('./routes/quoteOptions');
const createSuggestionRoutes   = require('./routes/suggestions');
const createAIRoutes           = require('./routes/ai');

// --- Repositories ---
const LegalRepository = require('./repositories/LegalRepository');
const HoursRepository = require('./repositories/HoursRepository');
const DishRepository = require('./repositories/DishRepository');
const ContactRepository = require('./repositories/ContactRepository');
const UserRepository = require('./repositories/UserRepository');
const ReviewRepository = require('./repositories/ReviewRepository');
const OrderRepository = require('./repositories/OrderRepository');
const MenuRepository = require('./repositories/MenuRepository');
const AnalyticsRepository    = require('./repositories/AnalyticsRepository');
const QuoteRepository        = require('./repositories/QuoteRepository');
const QuoteOptionRepository  = require('./repositories/QuoteOptionRepository');
const SuggestionRepository   = require('./repositories/SuggestionRepository');
const ClientScoreRepository  = require('./repositories/ClientScoreRepository');
const AIRepository           = require('./repositories/AIRepository');

// --- Services ---
const EmailService = require('./services/emailService');
const PricingService = require('./services/PricingService');
const LegalService = require('./services/LegalService');
const HoursService = require('./services/HoursService');
const DishService = require('./services/DishService');
const ContactService = require('./services/ContactService');
const AuthService = require('./services/AuthService');
const UserService = require('./services/UserService');
const ReviewService = require('./services/ReviewService');
const MenuService = require('./services/MenuService');
const OrderService = require('./services/OrderService');
const AnalyticsService    = require('./services/AnalyticsService');
const QuoteService        = require('./services/QuoteService');
const QuoteOptionService  = require('./services/QuoteOptionService');
const SuggestionService   = require('./services/SuggestionService');
const AIService           = require('./services/AIService');

// --- Controllers ---
const LegalController = require('./controllers/LegalController');
const HoursController = require('./controllers/HoursController');
const DishController = require('./controllers/DishController');
const ContactController = require('./controllers/ContactController');
const AuthController = require('./controllers/AuthController');
const UserController = require('./controllers/UserController');
const ReviewController = require('./controllers/ReviewController');
const MenuController = require('./controllers/MenuController');
const OrderController = require('./controllers/OrderController');
const AnalyticsController   = require('./controllers/AnalyticsController');
const QuoteController       = require('./controllers/QuoteController');
const QuoteOptionController  = require('./controllers/QuoteOptionController');
const SuggestionController   = require('./controllers/SuggestionController');
const AIController           = require('./controllers/AIController');

// ============================================================
// Dependency Injection — Composition Root
// ============================================================

// Shared services
const emailService = new EmailService({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM || 'noreply@vitegourmand.fr',
  adminEmail: process.env.ADMIN_EMAIL,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  bankAccountName: process.env.BANK_ACCOUNT_NAME,
  bankIban: process.env.BANK_IBAN,
  bankBic: process.env.BANK_BIC,
  onSiteAddress: process.env.ON_SITE_ADDRESS,
  onSiteHours: process.env.ON_SITE_HOURS,
  onSitePhone: process.env.ON_SITE_PHONE,
});

const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiry: process.env.JWT_EXPIRY || '24h',
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
};

// Repositories
const legalRepository = new LegalRepository(pool);
const hoursRepository = new HoursRepository(pool);
const dishRepository = new DishRepository(pool);
const contactRepository = new ContactRepository(pool);
const userRepository = new UserRepository(pool);
const reviewRepository = new ReviewRepository(pool);
const orderRepository = new OrderRepository(pool);
const menuRepository = new MenuRepository(pool);
const analyticsRepository   = new AnalyticsRepository(OrderAnalytics);
const clientScoreRepository = new ClientScoreRepository(pool);
const quoteRepository       = new QuoteRepository(pool);
const quoteOptionRepository = new QuoteOptionRepository(pool);
const aiRepository          = new AIRepository(pool);

// Services
const pricingService = new PricingService();
const legalService = new LegalService(legalRepository);
const hoursService = new HoursService(hoursRepository);
const dishService = new DishService(dishRepository);
const contactService = new ContactService(contactRepository, emailService);
const authService = new AuthService(userRepository, emailService, jwtConfig);
const userService = new UserService(pool, userRepository, emailService);
const reviewService = new ReviewService(reviewRepository, orderRepository);
const menuService = new MenuService(pool, menuRepository);
const analyticsService = new AnalyticsService(analyticsRepository, clientScoreRepository);
const orderService       = new OrderService(pool, orderRepository, pricingService, emailService, analyticsService);
const quoteOptionService  = new QuoteOptionService(quoteOptionRepository);
const quoteService        = new QuoteService(pool, quoteRepository, emailService);
const suggestionRepository = new SuggestionRepository(pool);
const suggestionService    = new SuggestionService(suggestionRepository);
const aiService            = new AIService(aiRepository, process.env.OPENAI_API_KEY);

// Controllers
const legalController = new LegalController(legalService);
const hoursController = new HoursController(hoursService);
const dishController = new DishController(dishService);
const contactController = new ContactController(contactService);
const authController = new AuthController(authService);
const userController = new UserController(userService);
const reviewController = new ReviewController(reviewService);
const menuController = new MenuController(menuService);
const orderController = new OrderController(orderService);
const analyticsController   = new AnalyticsController(analyticsService);
const quoteController       = new QuoteController(quoteService);
const quoteOptionController = new QuoteOptionController(quoteOptionService);
const suggestionController  = new SuggestionController(suggestionService);
const aiController          = new AIController(aiService);

// ============================================================
// Express app
// ============================================================

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (Render, Vercel, etc.)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "http://localhost:3000"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
// CORS — origins built from env (comma-separated FRONTEND_URLS)
const _corsOrigins = (() => {
  const base = ['http://localhost:5173', 'http://frontend:5173'];
  const extra = (process.env.FRONTEND_URLS || '')
    .split(',')
    .map(u => u.trim())
    .filter(Boolean);
  return [...new Set([...base, ...extra])];
})();
logger.info({ origins: _corsOrigins }, '[CORS] Allowed origins');

app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server calls (no Origin header) or listed origins
    if (!origin || _corsOrigins.includes(origin)) return cb(null, true);
    // Allow all Vercel preview deployments
    if (origin && origin.endsWith('.vercel.app')) return cb(null, true);
    cb(new Error(`CORS: origin "${origin}" not allowed`));
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de tentatives, réessayez dans 15 minutes.' },
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Trop de requêtes IA, réessayez dans quelques minutes.' },
});

app.use(express.json({ limit: '10kb' }));
// Force UTF-8 for all JSON responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Routes
app.use('/api/auth', authLimiter, createAuthRoutes(authController));
app.use('/api/menus', createMenuRoutes(menuController));
app.use('/api/dishes', createDishRoutes(dishController));
app.use('/api/orders', createOrderRoutes(orderController));
app.use('/api/reviews', createReviewRoutes(reviewController));
app.use('/api/contact', createContactRoutes(contactController));
app.use('/api/hours', createHoursRoutes(hoursController));
app.use('/api/legal', createLegalRoutes(legalController));
app.use('/api/users', createUserRoutes(userController));
app.use('/api/analytics',     createAnalyticsRoutes(analyticsController));
app.use('/api/quotes',        createQuoteRoutes(quoteController));
app.use('/api/quote-options',  createQuoteOptionRoutes(quoteOptionController));
app.use('/api/suggestions',    createSuggestionRoutes(suggestionController));
app.use('/api/ai',             aiLimiter, createAIRoutes(aiController));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use(errorHandler);

// Start server
async function start() {
  try {
    const client = await pool.connect();
    logger.info('PostgreSQL connected');
    client.release();

    await connectMongo();

    app.listen(PORT, '0.0.0.0', () => {
      logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'API server started');
    });
  } catch (err) {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  }
}

// Lance le serveur uniquement quand le fichier est exécuté directement.
// Les tests importent `app` sans déclencher les connexions DB.
if (require.main === module) {
  start();
}

module.exports = { app };
