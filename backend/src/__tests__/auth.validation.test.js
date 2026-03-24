/**
 * Tests d'intégration — validation POST /api/auth/register
 * Vérifie que la couche de validation retourne 400 AVANT toute requête DB.
 * Aucune connexion PostgreSQL réelle requise pour ces cas.
 */
const request = require('supertest');
const { app } = require('../index');

describe('POST /api/auth/register — validation', () => {
  test('400 si le body est vide', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  test('400 si email est invalide', async () => {
    const res = await request(app).post('/api/auth/register').send({
      first_name: 'Jean',
      last_name: 'Dupont',
      phone: '0600000000',
      email: 'pas-un-email',
      address: '1 rue test',
      password: 'Password1!valid',
    });
    expect(res.status).toBe(400);
    expect(res.body.errors).toContain('Email invalide.');
  });

  test('400 si le mot de passe ne respecte pas la politique', async () => {
    const res = await request(app).post('/api/auth/register').send({
      first_name: 'Jean',
      last_name: 'Dupont',
      phone: '0600000000',
      email: 'jean@test.fr',
      address: '1 rue test',
      password: 'tropfaible',
    });
    expect(res.status).toBe(400);
    expect(res.body.errors.some(e => e.includes('mot de passe'))).toBe(true);
  });

  test('400 si le prénom est manquant', async () => {
    const res = await request(app).post('/api/auth/register').send({
      last_name: 'Dupont',
      phone: '0600000000',
      email: 'jean@test.fr',
      address: '1 rue test',
      password: 'Password1!valid',
    });
    expect(res.status).toBe(400);
    expect(res.body.errors).toContain('Le prénom est requis.');
  });
});

describe('POST /api/auth/login — validation', () => {
  test('400 si email manquant', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'test' });
    expect(res.status).toBe(400);
  });

  test('400 si password manquant', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'test@test.fr' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toContain('Le mot de passe est requis.');
  });
});
