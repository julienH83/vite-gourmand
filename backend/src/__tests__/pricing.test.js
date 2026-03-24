const PricingService = require('../services/PricingService');

const pricing = new PricingService();

describe('PricingService — calculateOrderPrices', () => {
  const base = {
    minPrice: '25.00',
    nbPersons: 10,
    minPersons: 8,
    deliveryCity: 'Bordeaux',
    deliveryDistanceKm: '0',
  };

  // Prix du menu

  test('menuPrice = minPrice × nbPersons', () => {
    const result = pricing.calculateOrderPrices(base);
    expect(result.menuPrice).toBe(250);
  });

  test('menuPrice avec un prix décimal', () => {
    const result = pricing.calculateOrderPrices({ ...base, minPrice: '32.50', nbPersons: 4 });
    expect(result.menuPrice).toBe(130);
  });

  // Livraison

  test('livraison gratuite pour Bordeaux', () => {
    const result = pricing.calculateOrderPrices(base);
    expect(result.deliveryPrice).toBe(0);
  });

  test('livraison gratuite pour "bordeaux" (casse insensible)', () => {
    const result = pricing.calculateOrderPrices({ ...base, deliveryCity: 'BORDEAUX' });
    expect(result.deliveryPrice).toBe(0);
  });

  test('livraison facturée hors Bordeaux : 5 + 0.59/km', () => {
    const result = pricing.calculateOrderPrices({
      ...base,
      deliveryCity: 'Mérignac',
      deliveryDistanceKm: '10',
    });
    expect(result.deliveryPrice).toBe(10.9);
  });

  test('livraison hors Bordeaux à 0 km = 5€ forfait', () => {
    const result = pricing.calculateOrderPrices({
      ...base,
      deliveryCity: 'Pessac',
      deliveryDistanceKm: '0',
    });
    expect(result.deliveryPrice).toBe(5);
  });

  // Remise

  test('pas de remise si nb_persons < min_persons + 5', () => {
    const result = pricing.calculateOrderPrices({ ...base, nbPersons: 12, minPersons: 8 });
    expect(result.discount).toBe(0);
  });

  test('remise 10% si nb_persons = min_persons + 5', () => {
    const result = pricing.calculateOrderPrices({ ...base, nbPersons: 13, minPersons: 8 });
    expect(result.discount).toBe(32.5);
  });

  test('remise 10% si nb_persons > min_persons + 5', () => {
    const result = pricing.calculateOrderPrices({ ...base, nbPersons: 20, minPersons: 8 });
    expect(result.discount).toBe(50);
  });

  // Total

  test('total = menuPrice + deliveryPrice - discount (Bordeaux, sans remise)', () => {
    const result = pricing.calculateOrderPrices(base);
    expect(result.totalPrice).toBe(250);
  });

  test('total avec livraison et remise', () => {
    const result = pricing.calculateOrderPrices({
      ...base,
      nbPersons: 20,
      minPersons: 8,
      deliveryCity: 'Mérignac',
      deliveryDistanceKm: '15',
    });
    // menu: 500, delivery: 5 + 8.85 = 13.85, discount: 50
    expect(result.totalPrice).toBe(463.85);
  });

  // Acompte (30%)

  test('depositAmount = 30% du totalPrice', () => {
    const result = pricing.calculateOrderPrices(base);
    expect(result.depositAmount).toBe(75);
  });

  test('depositAmount avec livraison et remise', () => {
    const result = pricing.calculateOrderPrices({
      ...base,
      nbPersons: 20,
      minPersons: 8,
      deliveryCity: 'Mérignac',
      deliveryDistanceKm: '15',
    });
    // total = 463.85, deposit = Math.round(463.85 * 0.30 * 100) / 100 = 139.16
    expect(result.depositAmount).toBe(139.16);
  });

  // Arrondi

  test('les montants sont arrondis à 2 décimales', () => {
    const result = pricing.calculateOrderPrices({
      ...base,
      deliveryCity: 'Libourne',
      deliveryDistanceKm: '3',
    });
    // delivery = 5 + 1.77 = 6.77
    expect(result.deliveryPrice).toBe(6.77);
    expect(result.totalPrice).toBe(256.77);
  });

  test('depositAmount arrondi correctement (Math.round)', () => {
    const result = pricing.calculateOrderPrices({
      ...base,
      minPrice: '33.33',
      nbPersons: 7,
      minPersons: 8,
      deliveryCity: 'Pessac',
      deliveryDistanceKm: '5',
    });
    // menu = 233.31, delivery = 5 + 2.95 = 7.95, discount = 0
    // total = 241.26, deposit = Math.round(241.26 * 0.30 * 100) / 100 = 72.38
    expect(result.depositAmount).toBe(72.38);
  });
});
