require('dotenv').config();
const { connectMongo } = require('../config/database');
const OrderAnalytics = require('../models/OrderAnalytics');

async function seed() {
  await connectMongo();

  await OrderAnalytics.deleteMany({});

  const orders = [
    {
      order_id: 'o0000000-0000-0000-0000-000000000001',
      menu_id: 'm0000000-0000-0000-0000-000000000001',
      menu_title: 'Menu Prestige',
      total_price: 877.50,
      menu_price: 975.00,
      delivery_price: 0,
      discount: 97.50,
      nb_persons: 15,
      status: 'terminee',
      created_at: new Date('2025-02-10'),
    },
    {
      order_id: 'o0000000-0000-0000-0000-000000000002',
      menu_id: 'm0000000-0000-0000-0000-000000000003',
      menu_title: 'Menu Végétarien',
      total_price: 304.00,
      menu_price: 304.00,
      delivery_price: 0,
      discount: 0,
      nb_persons: 8,
      status: 'en_attente',
      created_at: new Date('2025-02-25'),
    },
    {
      order_id: 'o0000000-0000-0000-0000-000000000003',
      menu_id: 'm0000000-0000-0000-0000-000000000002',
      menu_title: 'Menu Champêtre',
      total_price: 540.00,
      menu_price: 540.00,
      delivery_price: 0,
      discount: 0,
      nb_persons: 12,
      status: 'acceptee',
      created_at: new Date('2025-02-15'),
    },
    {
      order_id: 'o0000000-0000-0000-0000-000000000004',
      menu_id: 'm0000000-0000-0000-0000-000000000005',
      menu_title: 'Menu Oriental',
      total_price: 576.43,
      menu_price: 630.00,
      delivery_price: 9.43,
      discount: 63.00,
      nb_persons: 15,
      status: 'en_preparation',
      created_at: new Date('2025-03-01'),
    },
  ];

  await OrderAnalytics.insertMany(orders);
  console.log('MongoDB seeded with', orders.length, 'orders');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
