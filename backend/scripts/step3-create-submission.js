const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const assessment = await prisma.assessment.findFirst();
  const student = await prisma.student.findFirst();

  const submission = await prisma.submission.create({
    data: {
      assessment_id: assessment.assessment_id,
      student_id: student.id,
      data: { answers: ['This is a test submission.'] },
    },
  });
  console.log(submission);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
