const prisma = require('./lib/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Seeding database with admin user only...');
  try {
    const adminPassword = await bcrypt.hash('password123', 10);

    // Create Admin User
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        passwordHash: adminPassword,
        role: 'ADMIN',
        name: 'Admin User',
        status: 'PENDING_PASSWORD_CHANGE'
      },
    });
    console.log('Created or found admin user:', adminUser);

    console.log('Database seeded successfully!');
  } catch (e) {
    console.error('Error seeding database:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();