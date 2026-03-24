// Mapping des valeurs frontend vers les valeurs de l'enum DB event_type
const EVENT_TYPE_MAP = {
  mariage:            'mariage',
  anniversaire:       'anniversaire',
  seminaire:          'seminaire',
  cocktail_dinatoire: 'cocktail',
  reunion_entreprise: 'seminaire',
  soiree_gala:        'gala',
  bapteme:            'autre',
  autre:              'autre',
};

class SuggestionService {
  constructor(suggestionRepository) {
    this._repo = suggestionRepository;
  }

  _toDbEventType(frontendValue) {
    return EVENT_TYPE_MAP[frontendValue] || 'autre';
  }

  async getMenuSuggestions(eventType, guestCount) {
    const dbEventType = this._toDbEventType(eventType);
    const menus = await this._repo.findMenuSuggestions(dbEventType, guestCount);

    return menus.map((m, i) => ({
      id:          m.id,
      title:       m.title,
      description: m.description,
      min_price:   m.min_price,
      min_persons: m.min_persons,
      theme:       m.theme,
      diet:        m.diet,
      stock:       m.stock,
      // "Recommandé" si dans les 3 premiers ET choisi au moins une fois
      recommended: i < 3 && parseInt(m.times_chosen) > 0,
    }));
  }

  async getBudgetEstimate(eventType, guestCount) {
    const dbEventType = this._toDbEventType(eventType);
    const row = await this._repo.getBudgetEstimate(dbEventType, guestCount);

    // Minimum 3 devis pour que la statistique soit fiable
    if (!row || !row.median || parseInt(row.sample_count) < 3) {
      return null;
    }

    return {
      q1:           parseFloat(row.q1),
      median:       parseFloat(row.median),
      q3:           parseFloat(row.q3),
      sample_count: parseInt(row.sample_count),
      per_person: {
        q1:     parseFloat((row.q1     / guestCount).toFixed(2)),
        median: parseFloat((row.median / guestCount).toFixed(2)),
        q3:     parseFloat((row.q3     / guestCount).toFixed(2)),
      },
    };
  }
}

module.exports = SuggestionService;
