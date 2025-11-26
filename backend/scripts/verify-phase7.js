const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Verifying credential creation...');
  const credential = await prisma.microCredential.findFirst({
    orderBy: {
        issuedAt: 'desc'
    }
  });
  console.log('Found credential:', credential);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });