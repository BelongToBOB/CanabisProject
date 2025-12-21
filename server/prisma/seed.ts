import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Clear existing data (in reverse order of dependencies)
  console.log('Clearing existing data...');
  await prisma.salesOrderLineItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.profitShare.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.user.deleteMany();

  // Create initial admin user
  console.log('Creating admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log(`Created admin user: ${adminUser.username}`);

  // Create a staff user for testing
  console.log('Creating staff user...');
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staffUser = await prisma.user.create({
    data: {
      username: 'staff',
      password: staffPassword,
      role: 'STAFF',
    },
  });
  console.log(`Created staff user: ${staffUser.username}`);

  // Create sample batch data
  console.log('Creating sample batches...');
  const batch1 = await prisma.batch.create({
    data: {
      batchIdentifier: 'BATCH-001',
      productName: 'Blue Dream',
      purchaseDate: new Date('2024-01-15'),
      purchasePricePerUnit: 8.50,
      initialQuantity: 100,
      currentQuantity: 100,
    },
  });

  const batch2 = await prisma.batch.create({
    data: {
      batchIdentifier: 'BATCH-002',
      productName: 'OG Kush',
      purchaseDate: new Date('2024-01-20'),
      purchasePricePerUnit: 10.00,
      initialQuantity: 75,
      currentQuantity: 75,
    },
  });

  const batch3 = await prisma.batch.create({
    data: {
      batchIdentifier: 'BATCH-003',
      productName: 'Sour Diesel',
      purchaseDate: new Date('2024-02-01'),
      purchasePricePerUnit: 9.25,
      initialQuantity: 120,
      currentQuantity: 120,
    },
  });

  const batch4 = await prisma.batch.create({
    data: {
      batchIdentifier: 'BATCH-004',
      productName: 'Blue Dream',
      purchaseDate: new Date('2024-02-10'),
      purchasePricePerUnit: 8.75,
      initialQuantity: 80,
      currentQuantity: 80,
    },
  });

  const batch5 = await prisma.batch.create({
    data: {
      batchIdentifier: 'BATCH-005',
      productName: 'Purple Haze',
      purchaseDate: new Date('2024-02-15'),
      purchasePricePerUnit: 11.00,
      initialQuantity: 60,
      currentQuantity: 60,
    },
  });

  console.log(`Created ${5} sample batches`);

  // Create sample sales orders
  console.log('Creating sample sales orders...');
  
  // Sales Order 1 - January
  const order1 = await prisma.salesOrder.create({
    data: {
      orderDate: new Date('2024-01-25T10:30:00'),
      customerName: 'John Doe',
      totalProfit: 0, // Will be calculated
      isLocked: false,
      lineItems: {
        create: [
          {
            batchId: batch1.id,
            quantitySold: 10,
            sellingPricePerUnit: 15.00,
            lineProfit: (15.00 - 8.50) * 10, // $65.00
          },
          {
            batchId: batch2.id,
            quantitySold: 5,
            sellingPricePerUnit: 18.00,
            lineProfit: (18.00 - 10.00) * 5, // $40.00
          },
        ],
      },
    },
  });

  // Update order1 total profit and batch quantities
  const order1TotalProfit = 65.00 + 40.00; // $105.00
  await prisma.salesOrder.update({
    where: { id: order1.id },
    data: { totalProfit: order1TotalProfit },
  });
  await prisma.batch.update({
    where: { id: batch1.id },
    data: { currentQuantity: 90 },
  });
  await prisma.batch.update({
    where: { id: batch2.id },
    data: { currentQuantity: 70 },
  });

  // Sales Order 2 - January
  const order2 = await prisma.salesOrder.create({
    data: {
      orderDate: new Date('2024-01-28T14:15:00'),
      customerName: 'Jane Smith',
      totalProfit: 0,
      isLocked: false,
      lineItems: {
        create: [
          {
            batchId: batch1.id,
            quantitySold: 15,
            sellingPricePerUnit: 14.50,
            lineProfit: (14.50 - 8.50) * 15, // $90.00
          },
        ],
      },
    },
  });

  const order2TotalProfit = 90.00;
  await prisma.salesOrder.update({
    where: { id: order2.id },
    data: { totalProfit: order2TotalProfit },
  });
  await prisma.batch.update({
    where: { id: batch1.id },
    data: { currentQuantity: 75 },
  });

  // Sales Order 3 - February
  const order3 = await prisma.salesOrder.create({
    data: {
      orderDate: new Date('2024-02-05T11:00:00'),
      customerName: 'Bob Johnson',
      totalProfit: 0,
      isLocked: false,
      lineItems: {
        create: [
          {
            batchId: batch3.id,
            quantitySold: 20,
            sellingPricePerUnit: 16.00,
            lineProfit: (16.00 - 9.25) * 20, // $135.00
          },
          {
            batchId: batch2.id,
            quantitySold: 8,
            sellingPricePerUnit: 17.50,
            lineProfit: (17.50 - 10.00) * 8, // $60.00
          },
        ],
      },
    },
  });

  const order3TotalProfit = 135.00 + 60.00; // $195.00
  await prisma.salesOrder.update({
    where: { id: order3.id },
    data: { totalProfit: order3TotalProfit },
  });
  await prisma.batch.update({
    where: { id: batch3.id },
    data: { currentQuantity: 100 },
  });
  await prisma.batch.update({
    where: { id: batch2.id },
    data: { currentQuantity: 62 },
  });

  // Sales Order 4 - February
  const order4 = await prisma.salesOrder.create({
    data: {
      orderDate: new Date('2024-02-12T16:45:00'),
      customerName: null, // Anonymous customer
      totalProfit: 0,
      isLocked: false,
      lineItems: {
        create: [
          {
            batchId: batch4.id,
            quantitySold: 12,
            sellingPricePerUnit: 15.50,
            lineProfit: (15.50 - 8.75) * 12, // $81.00
          },
          {
            batchId: batch5.id,
            quantitySold: 7,
            sellingPricePerUnit: 19.00,
            lineProfit: (19.00 - 11.00) * 7, // $56.00
          },
        ],
      },
    },
  });

  const order4TotalProfit = 81.00 + 56.00; // $137.00
  await prisma.salesOrder.update({
    where: { id: order4.id },
    data: { totalProfit: order4TotalProfit },
  });
  await prisma.batch.update({
    where: { id: batch4.id },
    data: { currentQuantity: 68 },
  });
  await prisma.batch.update({
    where: { id: batch5.id },
    data: { currentQuantity: 53 },
  });

  console.log(`Created ${4} sample sales orders`);

  console.log('\nSeed Summary:');
  console.log('=============');
  console.log(`Users: 2 (admin, staff)`);
  console.log(`Batches: 5`);
  console.log(`Sales Orders: 4`);
  console.log(`\nAdmin credentials: username=admin, password=admin123`);
  console.log(`Staff credentials: username=staff, password=staff123`);
  console.log('\nDatabase seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
