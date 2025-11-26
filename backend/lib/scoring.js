const prisma = require('./prisma');

const calculateFinalScore = async (student_id, module_id) => {
  const weighting = { formativePct: 60, summativePct: 40 };

  const assessments = await prisma.assessment.findMany({ where: { module_id } });
  const formativeAssessments = assessments.filter((a) => a.group === 'FORMATIVE');
  const summativeAssessments = assessments.filter((a) => a.group === 'SUMMATIVE');

  const submissions = await prisma.submission.findMany({
    where: { student_id, assessment: { module_id } },
    include: { assessment: true } // Include assessment to get rubric
  });
  const observations = await prisma.observation.findMany({ where: { student_id, module_id } });

  let totalFormativeActualScore = 0;
  let totalFormativeMaxScore = 0;

  let totalSummativeActualScore = 0;
  let totalSummativeMaxScore = 0;


  // Process formative submissions
  submissions.filter((s) => formativeAssessments.some((a) => a.assessment_id === s.assessment_id))
    .forEach(submission => {
      if (submission.grade && submission.assessment.rubric) {
        try {
          const gradeObj = typeof submission.grade === 'string' ? JSON.parse(submission.grade) : submission.grade;
          const rubricObj = typeof submission.assessment.rubric === 'string' ? JSON.parse(submission.assessment.rubric) : submission.assessment.rubric;

          let submissionScore = 0;
          if (gradeObj && Array.isArray(gradeObj.questionScores)) {
            submissionScore = gradeObj.questionScores.reduce((sum, qs) => sum + (Number(qs.score) || 0), 0);
          }
          const assessmentMaxScore = rubricObj.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
          
          if (assessmentMaxScore > 0) {
            totalFormativeActualScore += submissionScore;
            totalFormativeMaxScore += assessmentMaxScore;
          }
        } catch (e) {
          console.error(`Error parsing grade or rubric for submission ${submission.submission_id}:`, e);
        }
      }
    });

  // Process observations
  observations.forEach(observation => {
    if (observation.numericScore !== null && observation.maxScore !== null && observation.maxScore > 0) {
      totalFormativeActualScore += observation.numericScore;
      totalFormativeMaxScore += observation.maxScore;
    }
  });

  const formativeAverage = totalFormativeMaxScore > 0 ? (totalFormativeActualScore / totalFormativeMaxScore) * 100 : 0;

  // Process summative submissions
  submissions.filter((s) => summativeAssessments.some((a) => a.assessment_id === s.assessment_id))
    .forEach(submission => {
        if (submission.grade && submission.assessment.rubric) {
            try {
                const gradeObj = typeof submission.grade === 'string' ? JSON.parse(submission.grade) : submission.grade;
                const rubricObj = typeof submission.assessment.rubric === 'string' ? JSON.parse(submission.assessment.rubric) : submission.assessment.rubric;

                let submissionScore = 0;
                if (gradeObj && Array.isArray(gradeObj.questionScores)) {
                    submissionScore = gradeObj.questionScores.reduce((sum, qs) => sum + (Number(qs.score) || 0), 0);
                }
                const assessmentMaxScore = rubricObj.questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

                if (assessmentMaxScore > 0) {
                    totalSummativeActualScore += submissionScore;
                    totalSummativeMaxScore += assessmentMaxScore;
                }
            } catch (e) {
                console.error(`Error parsing grade or rubric for summative submission ${submission.submission_id}:`, e);
            }
        }
    });

  const summativeAverage = totalSummativeMaxScore > 0 ? (totalSummativeActualScore / totalSummativeMaxScore) * 100 : 0;


  const finalModuleScore = (formativeAverage * weighting.formativePct / 100) + (summativeAverage * weighting.summativePct / 100);

  return finalModuleScore;
};

// This helper is no longer used in calculateFinalScore in its previous form
// but is kept for potential other uses or a clearer separation of concerns if needed.
const calculateAverage = (items, scoreField = 'totalScore') => {
  if (items.length === 0) {
    return 0;
  }
  const total = items.reduce((acc, item) => {
    let score = 0;
    if (item.grade) {
      const gradeObj = typeof item.grade === 'string' ? JSON.parse(item.grade) : item.grade;
      if (gradeObj && gradeObj.scores) {
        score = Object.values(gradeObj.scores).reduce((sum, value) => sum + (Number(value) || 0), 0);
      }
    } else if (item[scoreField] !== undefined && item[scoreField] !== null) {
      score = Number(item[scoreField]);
    }
    return acc + (score || 0);
  }, 0);

  // This average calculation assumes items are comparable or represent final percentages.
  // For weighted averages based on total scores, a different aggregation is used in calculateFinalScore.
  return total / items.length;
};


const getDescriptor = (score) => {
  if (score >= 80) return 'EE';
  if (score >= 50) return 'ME';
  if (score >= 40) return 'AE';
  return 'BE';
};

const issueCredential = async (student_id, module_id, type, score, descriptor) => {
  const student = await prisma.student.findUnique({ where: { id: student_id }, include: { user: true } });
  const module = await prisma.module.findUnique({ where: { module_id } });

  const payload = {
    issuer: {
      name: 'CBE-AMS',
      id: 'did:example:123',
    },
    recipient: {
      saltedHashedStudentId: student.user.regNumber, // Using regNumber for PoC
    },
    credentialSubject: {
      module_id: module.module_id,
      moduleCode: module.moduleCode,
      moduleTitle: module.title,
      course_id: module.course_id,
      moduleVersion: module.version,
    },
    result: {
      descriptor,
      score,
    },
    issuedOn: new Date().toISOString(),
    metadata: {
      schemaVersion: '1.0.0',
      canonicalizationVersion: '1.0.0',
      chainId: 'Sepolia',
      contractAddress: '0xabc', // Placeholder
    },
  };

  await prisma.microCredential.create({
    data: {
      student_id,
      module_id,
      descriptor,
      score,
      type,
      payloadJson: payload,
      status: 'ISSUED',
      txHash: '0x123abc', // Placeholder
      issuedAt: new Date(),
    },
  });
};

const autoGrade = (submissionData, rubric) => {
  const rubricObject = JSON.parse(rubric);
  const questionScores = rubricObject.questions.map((question, index) => {
    let score = 0;
    if (question.type === 'MCQ') {
      const submittedAnswer = submissionData.answers[index];
      const correctAnswer = rubricObject.answers[index];
      if (correctAnswer !== null && correctAnswer !== undefined && submittedAnswer === correctAnswer.toString()) {
        score = question.marks;
      }
    }
    return {
      questionIndex: index,
      score,
    };
  });

  return {
    questionScores,
  };
};

module.exports = {
  calculateFinalScore,
  getDescriptor,
  issueCredential,
  autoGrade,
};