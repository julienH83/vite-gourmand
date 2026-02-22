const AppError = require('../errors/AppError');
const ValidationError = require('../errors/ValidationError');
const logger = require('../utils/logger');

// Lazy require: openai is optional — app runs in fallback mode without it
let OpenAI;
try {
  OpenAI = require('openai');
} catch {
  OpenAI = null;
}

const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1';
const MODEL = process.env.LLM_MODEL || 'llama-3.3-70b-versatile';
const MAX_TOKENS = 1000;
const TEMPERATURE = 0.3;
const MAX_HISTORY = 10;

class AIService {
  constructor(aiRepository, openaiApiKey) {
    this._repo = aiRepository;
    this._apiKey = openaiApiKey;

    if (openaiApiKey && OpenAI) {
      this._openai = new OpenAI({ apiKey: openaiApiKey, baseURL: LLM_BASE_URL });
      logger.info('AIService: OpenAI client initialized');
    } else {
      this._openai = null;
      if (!openaiApiKey) {
        logger.warn('AIService: OPENAI_API_KEY not set — running in fallback mode');
      }
      if (!OpenAI) {
        logger.warn('AIService: openai package not installed — running in fallback mode');
      }
    }
  }

  async _callLLM(systemPrompt, userMessage, conversationHistory = [], { jsonMode = false } = {}) {
    if (!this._openai) {
      return null;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-MAX_HISTORY),
      { role: 'user', content: userMessage },
    ];

    const params = {
      model: MODEL,
      messages,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
    };

    if (jsonMode) {
      params.response_format = { type: 'json_object' };
    }

    try {
      const response = await this._openai.chat.completions.create(params);
      return response.choices[0].message.content || '';
    } catch (err) {
      logger.error({ err }, 'OpenAI API error');
      throw new AppError('Service IA temporairement indisponible.', 503);
    }
  }

  _parseJSON(text) {
    if (!text) return null;
    try {
      // Try direct parse first (works with response_format: json_object)
      return JSON.parse(text);
    } catch {
      // Fallback: extract JSON from markdown fences or raw object
      try {
        const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
        if (match) {
          return JSON.parse(match[1] || match[0]);
        }
      } catch {
        // ignored
      }
      logger.error({ text: text.slice(0, 200) }, 'AI JSON parsing failed');
      return null;
    }
  }

  // ── Feature 1: Menu Assistant ──

  async suggestMenus({ eventType, guestCount, budget, dietaryNotes }) {
    const filters = { guestCount };
    if (budget && guestCount) {
      filters.maxPricePerPerson = budget / guestCount;
    }

    const menus = await this._repo.getMenusForContext(filters);

    if (menus.length === 0) {
      return {
        suggestions: [],
        advice: 'Aucun menu disponible pour vos critères. Essayez avec un budget plus élevé ou moins de convives.',
      };
    }

    // Fallback without API key
    if (!this._openai) {
      return this._fallbackMenuSuggestions(menus, guestCount);
    }

    const pricingRules = this._repo.getPricingRules();

    const systemPrompt = `Tu es l'assistant culinaire de Vite & Gourmand, traiteur événementiel à Bordeaux.

RÈGLES STRICTES :
- Tu ne peux recommander QUE les menus listés ci-dessous. Ne jamais inventer de menu.
- Chaque suggestion doit inclure le menuId exact tel que fourni.
- Réponds UNIQUEMENT en JSON valide. Aucun texte en dehors du JSON.

MENUS DISPONIBLES :
${JSON.stringify(menus, null, 2)}

RÈGLES TARIFAIRES :
${JSON.stringify(pricingRules)}

FORMAT DE RÉPONSE OBLIGATOIRE (JSON strict) :
{
  "suggestions": [
    {
      "menuId": "uuid-du-menu",
      "title": "Nom du menu",
      "reason": "Pourquoi ce menu convient (1-2 phrases)",
      "estimatedPricePerPerson": 0.00,
      "estimatedTotal": 0.00
    }
  ],
  "advice": "Conseil général pour l'événement (1-2 phrases)"
}`;

    const userMessage = `Type d'événement : ${eventType || 'non précisé'}
Nombre de convives : ${guestCount}
Budget total : ${budget ? budget + ' EUR' : 'non précisé'}
Restrictions alimentaires : ${dietaryNotes || 'aucune'}

Recommande les menus les plus adaptés (maximum 3).`;

    const response = await this._callLLM(systemPrompt, userMessage, [], { jsonMode: true });
    const parsed = this._parseJSON(response);

    if (!parsed || !Array.isArray(parsed.suggestions)) {
      logger.warn('AI suggestMenus: invalid response, using fallback');
      return this._fallbackMenuSuggestions(menus, guestCount);
    }

    // Validate menu IDs — drop any hallucinated entries
    const menuIds = new Set(menus.map(m => m.id));
    parsed.suggestions = parsed.suggestions.filter(s => menuIds.has(s.menuId));

    // If all suggestions were hallucinated, fallback
    if (parsed.suggestions.length === 0) {
      logger.warn('AI suggestMenus: all IDs invalid, using fallback');
      return this._fallbackMenuSuggestions(menus, guestCount);
    }

    return parsed;
  }

  _fallbackMenuSuggestions(menus, guestCount) {
    const suggestions = menus.slice(0, 3).map(m => ({
      menuId: m.id,
      title: m.title,
      reason: `${m.description || m.theme} — à partir de ${m.min_price} EUR/personne`,
      estimatedPricePerPerson: parseFloat(m.min_price),
      estimatedTotal: parseFloat(m.min_price) * (guestCount || 1),
    }));
    return {
      suggestions,
      advice: 'Voici nos menus disponibles pour votre événement.',
    };
  }

  // ── Feature 2: Quote Helper ──

  async suggestForQuote({ eventType, guestCount, dietaryNotes }) {
    const menus = await this._repo.getMenusForContext({ guestCount });
    const options = await this._repo.getQuoteOptionsForContext();

    if (menus.length === 0) {
      return { menuId: null, options: [], reasoning: 'Aucun menu disponible pour ce nombre de convives.' };
    }

    // Fallback without API key
    if (!this._openai) {
      return this._fallbackQuoteSuggestion(menus, options);
    }

    const systemPrompt = `Tu es l'assistant devis de Vite & Gourmand, traiteur événementiel à Bordeaux.

RÈGLES STRICTES :
- Choisis UN SEUL menu parmi la liste fournie.
- Choisis des options pertinentes parmi la liste fournie.
- Utilise les IDs exacts tels que fournis. Ne jamais inventer d'ID.
- Réponds UNIQUEMENT en JSON valide. Aucun texte en dehors du JSON.

MENUS DISPONIBLES :
${JSON.stringify(menus, null, 2)}

OPTIONS DISPONIBLES :
${JSON.stringify(options, null, 2)}

FORMAT DE RÉPONSE OBLIGATOIRE (JSON strict) :
{
  "menuId": "uuid-du-menu",
  "options": [
    { "optionId": "uuid-option", "quantity": 1 }
  ],
  "reasoning": "Explication du choix (2-3 phrases)"
}`;

    const userMessage = `Type d'événement : ${eventType || 'non précisé'}
Nombre de convives : ${guestCount}
Restrictions alimentaires : ${dietaryNotes || 'aucune'}

Suggère le menu et les options les plus adaptés.`;

    const response = await this._callLLM(systemPrompt, userMessage, [], { jsonMode: true });
    const parsed = this._parseJSON(response);

    if (!parsed || !parsed.menuId) {
      logger.warn('AI suggestForQuote: invalid response, using fallback');
      return this._fallbackQuoteSuggestion(menus, options);
    }

    // Validate IDs — fallback to first menu if hallucinated
    const menuIds = new Set(menus.map(m => m.id));
    const optionIds = new Set(options.map(o => o.id));

    if (!menuIds.has(parsed.menuId)) {
      parsed.menuId = menus[0].id;
    }

    if (Array.isArray(parsed.options)) {
      parsed.options = parsed.options.filter(o => optionIds.has(o.optionId));
    } else {
      parsed.options = [];
    }

    return parsed;
  }

  _fallbackQuoteSuggestion(menus, options) {
    return {
      menuId: menus[0].id,
      options: [],
      reasoning: `Nous vous suggérons "${menus[0].title}" à ${menus[0].min_price} EUR/personne.`,
    };
  }

  // ── Feature 3: Chatbot ──

  async chat({ message, conversationHistory = [] }) {
    if (!message || typeof message !== 'string') {
      throw new ValidationError('Le message est requis.');
    }

    const [menus, options, businessInfo] = await Promise.all([
      this._repo.getMenusForContext(),
      this._repo.getQuoteOptionsForContext(),
      this._repo.getBusinessInfo(),
    ]);

    const pricingRules = this._repo.getPricingRules();

    // Fallback without API key
    if (!this._openai) {
      return { reply: 'L\'assistant IA est temporairement indisponible. Contactez-nous via le formulaire de contact ou par téléphone.' };
    }

    const systemPrompt = `Tu es l'assistant virtuel de Vite & Gourmand, traiteur événementiel à Bordeaux.

RÈGLES :
- Réponds TOUJOURS en français, de manière brève et professionnelle (3 phrases maximum).
- Utilise UNIQUEMENT les informations fournies ci-dessous. Ne jamais inventer.
- Si tu ne connais pas la réponse, dirige vers le formulaire de contact ou le téléphone.
- Ne donne jamais de prix inventé. Utilise uniquement les prix des menus fournis.

INFORMATIONS ENTREPRISE :
${JSON.stringify(businessInfo, null, 2)}

MENUS DISPONIBLES :
${menus.map(m => `- ${m.title} : ${m.min_price} EUR/pers (min ${m.min_persons} pers) — ${m.diet}, thème ${m.theme}`).join('\n')}

OPTIONS & PRESTATIONS :
${options.filter(o => parseFloat(o.unit_price) > 0).map(o => `- ${o.label} : ${o.unit_price} EUR/${o.unit}`).join('\n')}

TARIFS & LIVRAISON :
${JSON.stringify(pricingRules)}`;

    const history = conversationHistory
      .slice(-MAX_HISTORY)
      .filter(m => m.role && m.content)
      .map(m => ({ role: m.role, content: String(m.content) }));

    const response = await this._callLLM(systemPrompt, message, history);

    // Safety: ensure reply is always a non-empty string
    const reply = (typeof response === 'string' && response.trim())
      ? response.trim()
      : 'Je n\'ai pas pu traiter votre demande. N\'hésitez pas à nous contacter directement.';

    return { reply };
  }
}

module.exports = AIService;
