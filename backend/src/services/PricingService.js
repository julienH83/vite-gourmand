class PricingService {
  calculateOrderPrices({ minPrice, nbPersons, minPersons, deliveryCity, deliveryDistanceKm }) {
    const menuPrice = parseFloat(minPrice) * nbPersons;

    const isBordeaux = deliveryCity.toLowerCase().includes('bordeaux');
    const deliveryPrice = isBordeaux ? 0 : 5 + (0.59 * parseFloat(deliveryDistanceKm));

    // Remise 10% si nb_persons >= min_persons + 5
    const discount = nbPersons >= (minPersons + 5) ? menuPrice * 0.10 : 0;

    const totalPrice = menuPrice + deliveryPrice - discount;
    const depositAmount = Math.round(totalPrice * 0.30 * 100) / 100;

    return {
      menuPrice: parseFloat(menuPrice.toFixed(2)),
      deliveryPrice: parseFloat(deliveryPrice.toFixed(2)),
      discount: parseFloat(discount.toFixed(2)),
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      depositAmount,
    };
  }
}

module.exports = PricingService;
