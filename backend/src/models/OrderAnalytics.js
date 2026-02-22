const mongoose = require('mongoose');

const orderAnalyticsSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  menu_id: { type: String, required: true },
  menu_title: { type: String, required: true },
  total_price: { type: Number, required: true },
  menu_price: { type: Number, required: true },
  delivery_price: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  nb_persons: { type: Number, required: true },
  status: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

orderAnalyticsSchema.index({ menu_id: 1 });
orderAnalyticsSchema.index({ created_at: 1 });
orderAnalyticsSchema.index({ status: 1 });

module.exports = mongoose.model('OrderAnalytics', orderAnalyticsSchema);
