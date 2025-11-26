
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [oldAssessorEmail, newAssessorEmail] = process.argv.slice(2);

  if (!oldAssessorEmail || !newAssessorEmail) {
    console.error('Please provide the email of the old assessor and the new assessor.');
    process.exit(1);
  }

  const oldAssessor = await prisma.user.findUnique({
    where: { email: oldAssessorEmail },
    include: { AssessorMeta: true },
  });

  if (!oldAssessor || !oldAssessor.AssessorMeta) {
    console.error('Old assessor not found.');
    process.exit(1);
  }

  const newAssessor = await prisma.user.findUnique({
    where: { email: newAssessorEmail },
    include: { AssessorMeta: true },
  });

  if (!newAssessor || !newAssessor.AssessorMeta) {
    console.error('New assessor not found.');
    process.exit(1);
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { assessor_id: oldAssessor.AssessorMeta.id },
  });

  for (const enrollment of enrollments) {
    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { assessor_id: newAssessor.AssessorMeta.id },
    });
  }

  console.log(`Successfully migrated ${enrollments.length} students from ${oldAssessor.name} to ${newAssessor.name}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
