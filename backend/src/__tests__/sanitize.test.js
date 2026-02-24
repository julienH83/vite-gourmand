/**
 * Tests unitaires — utils/sanitize.js
 * Aucune connexion DB requise.
 */
const { escapeHtml } = require('../utils/sanitize');

describe('escapeHtml()', () => {
  test('retourne une chaîne vide pour une entrée falsy', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml('')).toBe('');
  });

  test('échappe le caractère &', () => {
    expect(escapeHtml('Vite & Gourmand')).toBe('Vite &amp; Gourmand');
  });

  test('échappe < et >', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  test('échappe les guillemets doubles', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  test('échappe les apostrophes', () => {
    expect(escapeHtml("c'est bon")).toBe('c&#039;est bon');
  });

  test('ne modifie pas une chaîne sans caractères spéciaux', () => {
    expect(escapeHtml('Bonjour monde')).toBe('Bonjour monde');
  });

  test("convertit les nombres en chaine avant d'echapper", () => {
    expect(escapeHtml(42)).toBe('42');
  });
});
