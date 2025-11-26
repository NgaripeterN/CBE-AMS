const { PrismaClient } = require('@prisma/client');
const { calculateFinalScore, getDescriptor, issueCredential } = require('../lib/scoring');
const prisma = new PrismaClient();

const isPassing = (descriptor, minDescriptor) => {
  const descriptorRanks = { BE: 0, AE: 1, ME: 2, EE: 3 };
  return descriptorRanks[descriptor] >= descriptorRanks[minDescriptor];
};

async function main() {
  console.log('Starting credential issuance process...');

  console.log('1. Finding the latest submission...');
  const submission = await prisma.submission.findFirst({
    orderBy: {
        createdAt: 'desc'
    },
    include: {
      assessment: {
        include: {
          module: {
            include: {
              course: true,
            },
          },
        },
      },
      student: true,
    },
  });
  console.log('   Found submission:', submission.submission_id);

  const grade = {
    questionScores: [{ questionIndex: 0, score: 85 }],
    notes: 'Well done!',
  };

  console.log('2. Calculating grade...');
  const rubric = JSON.parse(submission.assessment.rubric);
  let totalScore = 0;
  let totalMarks = 0;

  rubric.questions.forEach((question, index) => {
    totalMarks += question.marks;
    const score = grade.questionScores.find(qs => qs.questionIndex === index)?.score || 0;
    totalScore += score;
  });

  const finalPercentage = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;

  const finalGrade = {
    notes: grade.notes,
    questionScores: grade.questionScores,
    totalScore: finalPercentage,
  };
  console.log('   Grade calculated:', finalGrade);

  console.log('3. Updating submission with grade...');
  const updatedSubmission = await prisma.submission.update({
    where: { submission_id: submission.submission_id },
    data: {
      grade: finalGrade,
      gradedAt: new Date(),
    },
    include: {
      assessment: {
        include: {
          module: {
            include: {
              course: true,
            },
          },
        },
      },
      student: true,
    },
  });
  console.log('   Submission updated.');

  console.log('4. Calculating final module score...');
  const finalScore = await calculateFinalScore(updatedSubmission.student.id, updatedSubmission.assessment.module_id);
  const descriptor = getDescriptor(finalScore);
  console.log(`   Final score: ${finalScore}, Descriptor: ${descriptor}`);

  const course = updatedSubmission.assessment.module.course;
  const minDescriptor = course.minDescriptor || 'ME';

  console.log('5. Issuing credential...');
  if (isPassing(descriptor, minDescriptor)) {
    await issueCredential(updatedSubmission.student.id, updatedSubmission.assessment.module_id, 'MICRO_CREDENTIAL', finalScore, descriptor);
    console.log('   Issued Micro-Credential.');
  } else {
    await issueCredential(updatedSubmission.student.id, updatedSubmission.assessment.module_id, 'STATEMENT_OF_ATTAINMENT', finalScore, descriptor);
    console.log('   Issued Statement of Attainment.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });