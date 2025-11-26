const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const enrollment = await prisma.enrollment.findFirst({
    include: {
      student: true,
      module: true,
    },
  });
  console.log(enrollment);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
