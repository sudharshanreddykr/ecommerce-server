import { connectDatabase } from '../config/database';
import User from '../models/User';
import Product from '../models/Product';
import { logger } from '../utils/logger';
import { Op } from 'sequelize';

const sampleNames = [
  'Silver',
  'Golden',
  'Emerald',
  'Ruby',
  'Sapphire',
  'Crystal',
  'Velvet',
  'Urban',
  'Ocean',
  'Sunset',
  'Lunar',
  'Vintage',
  'Nova',
  'Metro',
  'Genesis',
  'Apex',
  'Zenith',
  'Prime',
  'Pioneer',
  'Echo',
];

const sampleNouns = [
  'Widget',
  'Gadget',
  'Item',
  'Tool',
  'Device',
  'Accessory',
  'Kit',
  'Package',
  'System',
  'Set',
  'Module',
  'Engine',
  'Assembly',
  'Unit',
  'Station',
  'Panel',
  'Board',
  'Frame',
  'Lens',
  'Console',
];

const sampleTags = [
  'Pro',
  'Max',
  'Lite',
  'Plus',
  'Ultra',
  'Eco',
  'Smart',
  'Prime',
  'Essential',
  'Advanced',
];

const sampleDescriptions = [
  'High-performance product built for everyday use.',
  'Reliable, efficient, and ready for your next task.',
  'Designed to improve productivity while staying affordable.',
  'Lightweight design with premium materials and lasting value.',
  'Perfect for professionals and hobbyists alike.',
];

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomProductName = () => {
  const adjective = sampleNames[randomInt(0, sampleNames.length - 1)];
  const noun = sampleNouns[randomInt(0, sampleNouns.length - 1)];
  const tag = sampleTags[randomInt(0, sampleTags.length - 1)];
  return `${adjective} ${noun} ${tag}`;
};

const randomEmail = (index: number) => `sample+user${index}@example.com`;

async function runSeed() {
  await connectDatabase();

  const existingSampleUsers = await User.count({
    where: {
      email: {
        [Op.iLike]: 'sample+user%@example.com',
      },
    },
  });

  if (existingSampleUsers > 0) {
    logger.info('Sample users already exist. Skipping sample seeding to avoid duplicates.');
    return;
  }

  const users = [];
  for (let i = 1; i <= 50; i += 1) {
    const firstName = `User${i}`;
    const lastName = `Demo`;
    const email = randomEmail(i);
    const password = `Password${i}!`;

    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: 'user',
      isActive: true,
    });

    users.push(user);
  }

  logger.info(`Created ${users.length} sample users.`);

  const productsToCreate = 2000;
  const createdProducts = [];

  for (let i = 1; i <= productsToCreate; i += 1) {
    const owner = users[i % users.length];
    const name = randomProductName();
    const description = sampleDescriptions[randomInt(0, sampleDescriptions.length - 1)];
    const price = parseFloat((randomInt(5, 500) + Math.random()).toFixed(2));
    const quantity = randomInt(1, 200);
    const sku = `SKU-${Date.now()}-${i}`;

    const product = await Product.create({
      name,
      description,
      price,
      quantity,
      sku,
      userId: owner.id,
    });

    createdProducts.push(product);
  }

  logger.info(`Created ${createdProducts.length} sample products.`);
  logger.info('Sample data insertion complete.');
}

runSeed().catch((error) => {
  logger.error('Sample data seeding failed:', error);
  process.exit(1);
});
