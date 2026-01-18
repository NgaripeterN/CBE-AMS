import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAssessmentById, submitAssessment } from 'lib/api'; // Absolute path
import StudentLayout from 'components/StudentLayout'; // Absolute path
import Loading from 'components/Loading'; // Absolute path

const AssessmentPage = () => {
  const router = useRouter();
  // normalize id to a string (router.query.id can be string | string[] | undefined)
  const rawId = router.query.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submission, setSubmission] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      getAssessmentById(id)
        .then((data) => {
          const processedQuestions = (data.questions || []).map((q, index) => ({
            ...q,
            questionNumber: index + 1,
          }));
          setAssessment({ ...data, questions: processedQuestions });
          setIsLoading(false);
        })
        .catch((err) => {
          setError('Failed to load assessment. Please try again later.');
          console.error(err);
          setIsLoading(false);
        });
    }
  }, [id]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submissionData = {
        assessmentId: id,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId: parseInt(questionId, 10),
          answer,
        })),
      };
      const result = await submitAssessment(submissionData);
      setSubmission(result);
    } catch (err) {
      // proper catch block syntax (fix for previous parsing error)
      setError('Failed to submit assessment. Please try again.');
      console.error(err);
    }
  };

  if (isLoading) return (
    <StudentLayout>
      <Loading />
    </StudentLayout>
  );

  if (error) return (
    <StudentLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="alert alert-danger">{error}</div>
      </div>
    </StudentLayout>
  );

  if (submission) {
    return (
      <StudentLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-4">Assessment Submitted</h1>
          <p>Your assessment has been submitted successfully.</p>
          {submission.score !== undefined && <p>Score: {submission.score}%</p>}
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">{assessment?.title || 'Assessment'}</h1>
        <p className="text-gray-600 mb-6">{assessment?.description}</p>

        <form onSubmit={handleSubmit}>
          {(assessment?.questions || []).map((question) => (
            <div key={question.id ?? question.questionNumber} className="mb-6">
              <label htmlFor={`question-${question.id}`} className="block text-lg font-medium mb-2">
                Question {question.questionNumber}. {question.text} {question.marks && <span className="text-sm font-normal text-gray-500 ml-2">({question.marks} marks)</span>}
              </label>

              {question.type === 'MULTIPLE_CHOICE' ? (
                <div>
                  {(question.options || []).map((option, idx) => {
                    const optionId = option?.id ?? `${question.id}-opt-${idx}`;
                    const optionText = typeof option === 'string' ? option : option?.text;
                    return (
                      <div key={optionId} className="flex items-center mb-2">
                        <input
                          type="radio"
                          id={`option-${optionId}`}
                          name={`question-${question.id}`}
                          value={optionText}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="mr-2"
                        />
                        <label htmlFor={`option-${optionId}`}>{optionText}</label>
                      </div>
                    );
                  })}
                </div>
              ) : question.type === 'SHORT_ANSWER' ? (
                <input
                  type="text"
                  id={`question-${question.id}`}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-full p-2 border rounded"
                />
              ) : question.type === 'ESSAY' ? (
                <textarea
                  id={`question-${question.id}`}
                  rows="5"
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-full p-2 border rounded"
                />
              ) : (
                <p>Unsupported question type</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Submit Assessment
          </button>
        </form>
      </div>
    </StudentLayout>
  );
};

export default AssessmentPage;