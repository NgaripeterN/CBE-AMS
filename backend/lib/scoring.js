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
      if (observation.group === 'SUMMATIVE') {
        totalSummativeActualScore += observation.numericScore;
        totalSummativeMaxScore += observation.maxScore;
      } else { // Default to formative if not specified or is FORMATIVE
        totalFormativeActualScore += observation.numericScore;
        totalFormativeMaxScore += observation.maxScore;
      }
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

const autoGrade = (submissionData, rubric) => {
  const questionScores = rubric.questions.map((question, index) => {
    let score = 0;
    if (question.type === 'MCQ') {
      const submittedAnswer = submissionData.answers[index];
      const correctAnswer = rubric.answers[index];
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
  autoGrade,
};