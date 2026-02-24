/**
 * Tests d'intégration — GET /api/health
 * Importe `app` sans démarrer les connexions DB (require.main guard dans index.js).
 */
const request = require('supertest');

// On importe seulement `app`, start() n'est PAS appelé car require.main !== module
const { app } = require('../index');

describe('GET /api/health', () => {
  test('répond 200 avec status "ok"', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
  });

  test('le body contient un timestamp ISO valide', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.timestamp).toBeDefined();
    expect(() => new Date(res.body.timestamp).toISOString()).not.toThrow();
  });

  test('Content-Type est JSON', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
