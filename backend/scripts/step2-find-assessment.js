const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const assessment = await prisma.assessment.findFirst();
  console.log(assessment);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
