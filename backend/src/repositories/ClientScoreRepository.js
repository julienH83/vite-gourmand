class ClientScoreRepository {
  constructor(pool) {
    this._pool = pool;
  }

  /**
   * Retourne le classement des clients actifs ayant au moins un devis,
   * triés par score décroissant.
   *
   * Formule du score :
   *   +3  par devis accepté / acompte payé / converti
   *   -1  par devis refusé
   *   +0.5 par tranche de 100 € dépensés (devis acceptés)
   */
  async findClientScores() {
    const result = await this._pool.query(
      `SELECT
         u.id,
         u.first_name,
         u.last_name,
         u.email,
         COUNT(q.id)                                                                      AS total_quotes,
         COUNT(q.id) FILTER (WHERE q.status IN ('accepted','acompte_paye','converti_en_commande')) AS accepted_quotes,
         COUNT(q.id) FILTER (WHERE q.status = 'refuse')                                  AS refused_quotes,
         COUNT(q.id) FILTER (WHERE q.status = 'expire')                                  AS expired_quotes,
         COALESCE(SUM(q.total) FILTER (WHERE q.status IN ('accepted','acompte_paye','converti_en_commande')), 0) AS total_spent,
         MAX(q.created_at)                                                                AS last_activity,
         ROUND(
           COALESCE(COUNT(q.id) FILTER (WHERE q.status IN ('accepted','acompte_paye','converti_en_commande')) * 3.0, 0)
           + COALESCE(COUNT(q.id) FILTER (WHERE q.status = 'refuse') * -1.0, 0)
           + COALESCE(SUM(q.total) FILTER (WHERE q.status IN ('accepted','acompte_paye','converti_en_commande')) / 100.0 * 0.5, 0)
         , 1) AS score
       FROM users u
       LEFT JOIN quotes q ON q.user_id = u.id
       WHERE u.role = 'user'
         AND u.status = 'active'
       GROUP BY u.id, u.first_name, u.last_name, u.email
       HAVING COUNT(q.id) > 0
       ORDER BY score DESC
       LIMIT 50`
    );
    return result.rows;
  }
}

module.exports = ClientScoreRepository;
