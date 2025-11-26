import { useRouter } from 'next/router';
import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { getAssessmentById, submitAssessment, generateUploadSignature } from '../../../lib/api';
import { FiFileText, FiUpload, FiCheckCircle, FiCalendar, FiClock, FiHash, FiAlertCircle } from 'react-icons/fi';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import ErrorModal from '../../../components/ErrorModal';
import Toast from '../../../components/Toast';
import { format } from 'date-fns';
import Link from 'next/link';

const AssessmentSubmissionPage = () => {
  const router = useRouter();
  const { assessment_id } = router.query;
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingProgress, setUploadingProgress] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isAttempting, setIsAttempting] = useState(false);

  // State for Toast notification
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const answersRef = useRef(answers);
  answersRef.current = answers;

  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();

    const unansweredQuestions = answersRef.current.reduce((acc, answer, index) => {
      if (answer === '' || answer === null) {
        acc.push(index + 1);
      }
      return acc;
    }, []);

    if (unansweredQuestions.length > 0) {
      setError(`Please answer all questions before submitting. You have ${unansweredQuestions.length} unanswered questions: ${unansweredQuestions.join(', ')}`);
      setIsErrorModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitAssessment(assessment_id, { submissionData: { answers: answersRef.current } });
      localStorage.removeItem(`assessment_answers_${assessment_id}`);
      localStorage.removeItem(`assessment_start_time_${assessment_id}`);
      
      setToastMessage('Assessment submitted successfully!');
      setToastType('success');
      setShowToast(true);

      setTimeout(() => {
        router.push('/student/submissions');
      }, 2000);

    } catch (err) {
      setError('Submission failed. Please try again.');
      setToastMessage('Submission failed. Please try again.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [assessment_id, router]);

  useEffect(() => {
    if (assessment_id) {
      setIsLoading(true);
      getAssessmentById(assessment_id)
        .then(data => {
          const assessmentData = {
            ...data,
            rubric: typeof data.rubric === 'string' ? JSON.parse(data.rubric) : data.rubric,
          };
          setAssessment(assessmentData);

          const savedAnswers = localStorage.getItem(`assessment_answers_${assessment_id}`);
          if (savedAnswers) {
            setAnswers(JSON.parse(savedAnswers));
          } else if (assessmentData.rubric && assessmentData.rubric.questions) {
            const initialAnswers = assessmentData.rubric.questions.map(q => {
              if (q.type === 'FILE' || q.type === 'MEDIA') return null;
              return '';
            });
            setAnswers(initialAnswers);
          }
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Error fetching assessment:", err);
          setError('Failed to load assessment. Please try again later.');
          setIsLoading(false);
        });
    }
  }, [assessment_id]);

  useEffect(() => {
    if (assessment_id && answers.length > 0) {
      localStorage.setItem(`assessment_answers_${assessment_id}`, JSON.stringify(answers));
    }
  }, [answers, assessment_id]);

  const handleInputChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleFileChange = async (index, file) => {
    if (!file) return;
    setUploadingProgress(0);

    try {
      const folder = `submissions/${assessment.module_id}/${assessment_id}`;
      const { timestamp, signature } = await generateUploadSignature(folder);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY);

      const response = await axios.post(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadingProgress(percentCompleted);
        },
      });

      const data = response.data;
      
      if (data.secure_url) {
        const fileMetadata = {
          url: data.secure_url,
          fileName: file.name,
          fileType: file.type,
          size: file.size,
          public_id: data.public_id,
        };
        handleInputChange(index, fileMetadata);
      } else {
        throw new Error('Upload to Cloudinary failed.');
      }

        } catch (err) {
      console.error('File upload failed:', err);
      setError('File upload failed. Please try again.');
    } finally {
      setUploadingProgress(null);
    }
  };

  const goBack = () => {
    router.back();
  };

  if (isLoading) return <div className="flex justify-center items-center min-h-screen bg-background"><p className="text-lg text-foreground">Loading assessment...</p></div>;
  if (error && !isErrorModalOpen) return <div className="flex justify-center items-center min-h-screen bg-background"><p className="text-lg text-destructive">{error}</p></div>;
  if (!assessment) return <div className="flex justify-center items-center min-h-screen bg-background"><p className="text-lg text-foreground">Assessment not found.</p></div>;

  const { title, description, rubric, deadline, maxAttempts, submissions, createdBy } = assessment;
  const isEligible = new Date(deadline) > new Date() && submissions.length < maxAttempts;
  const questions = rubric.questions;

  const renderQuestions = () => (
    <form onSubmit={handleSubmit} className="space-y-8 mt-6">
      {questions && questions.map((q, index) => (
        <div key={index} className="bg-card border border-border rounded-lg p-6 mb-6 transition-shadow duration-300 hover:shadow-lg">
          <div className="flex items-start mb-4">
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mr-4">{index + 1}</div>
            <p className="text-lg font-semibold text-foreground">{q.text}</p>
          </div>
          <div className="pl-12">
            {q.type === 'MCQ' && (
              <div className="space-y-3">
                {q.options.map((option, i) => (
                  <label key={i} className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={i}
                      checked={answers[index] === i.toString()}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      className="form-radio h-5 w-5 text-primary bg-gray-200 border-gray-300 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="ml-3 text-muted-foreground group-hover:text-foreground">{option}</span>
                  </label>
                ))}
              </div>
            )}
            {q.type === 'TEXT' && (
              <textarea
                rows="5"
                value={answers[index] || ''}
                onChange={(e) => handleInputChange(index, e.target.value)}
                className="w-full p-3 border rounded-md bg-background border-border focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Type your answer here..."
              ></textarea>
            )}
            {(q.type === 'FILE' || q.type === 'MEDIA') && (
              <div className="flex items-center space-x-4">
                <label className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm tracking-wide uppercase border border-transparent cursor-pointer hover:bg-primary/90">
                  <FiUpload className="w-6 h-6 mr-2" />
                  <span className="text-base leading-normal">Select a file</span>
                  <input type="file" onChange={(e) => handleFileChange(index, e.target.files[0])} className="hidden" />
                </label>
                {answers[index] && (
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">{answers[index].fileName}</span>
                    <button type="button" onClick={() => handleInputChange(index, '')} className="text-destructive hover:text-destructive/80 focus:outline-none">Remove</button>
                  </div>
                )}
                {uploadingProgress !== null && (
                  <div className="w-full bg-muted rounded-full h-2.5">
                    <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadingProgress}%` }}></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
      <div className="flex justify-end items-center pt-6 mt-8 border-t border-border">
        <button type="submit" disabled={isSubmitting} className="flex items-center justify-center bg-green-600 text-white px-8 py-3 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300">
          <FiCheckCircle className="w-5 h-5 mr-2" />
          {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ErrorModal isOpen={isErrorModalOpen} message={error} onClose={() => { setIsErrorModalOpen(false); setError(null); }} />
      <Toast message={toastMessage} type={toastType} show={showToast} onClose={() => setShowToast(false)} />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-10">
          <button onClick={goBack} className="inline-flex items-center mb-6 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Module
          </button>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">{title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">Created by: {createdBy.user.name}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Assessment Details */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-card p-6 rounded-2xl shadow-lg border border-border">
              <h3 className="text-xl font-semibold mb-4 text-foreground">Assessment Details</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <FiCalendar className="w-5 h-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Deadline</p>
                    <p className="text-muted-foreground">{format(new Date(deadline), 'PPpp')}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <FiHash className="w-5 h-5 mr-3 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Max Attempts</p>
                    <p className="text-muted-foreground">{maxAttempts}</p>
                  </div>
                </div>
                {assessment.duration && (
                  <div className="flex items-center">
                    <FiClock className="w-5 h-5 mr-3 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">Time Limit</p>
                      <p className="text-muted-foreground">{assessment.duration} minutes</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {description && (
                <div className="bg-card p-6 rounded-2xl shadow-lg border border-border">
                    <h3 className="text-xl font-semibold mb-4 text-foreground">Description</h3>
                    <p className="text-muted-foreground">{description}</p>
                </div>
            )}
          </div>

          {/* Right Column: Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-card p-8 rounded-2xl shadow-lg border border-border">
              {isEligible ? (
                assessment.duration ? (
                  <div className="text-center">
                    <FiClock className="mx-auto h-12 w-12 text-primary mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Timed Assessment</h2>
                    <p className="text-muted-foreground mb-6">This is a timed assessment. You will have {assessment.duration} minutes to complete it once you begin.</p>
                    <Link href={`/student/assessments/start/${assessment_id}`} legacyBehavior>
                      <a className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        Start Timed Assessment
                      </a>
                    </Link>
                  </div>
                ) : (
                  isAttempting ? renderQuestions() : (
                    <div className="text-center">
                      <FiFileText className="mx-auto h-12 w-12 text-primary mb-4" />
                      <h2 className="text-2xl font-bold mb-2">Ready to Begin?</h2>
                      <p className="text-muted-foreground mb-6">You can start this assessment now. Your progress will be saved as you go.</p>
                      <button onClick={() => setIsAttempting(true)} className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        Start Assessment
                      </button>
                    </div>
                  )
                )
              ) : (
                <div className="text-center">
                    <FiAlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Not Eligible</h2>
                    <p className="text-muted-foreground">You are not eligible to submit this assessment. The deadline may have passed or you have reached the maximum number of attempts.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Previous Submissions */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold mb-6 text-foreground">Previous Submissions</h2>
          {submissions.length > 0 ? (
            <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
                <ul className="divide-y divide-border">
                    {submissions.map((sub, index) => (
                        <li key={sub.submission_id} className="p-6 hover:bg-muted/50 transition-colors duration-200">
                            <div className="flex flex-wrap items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-lg font-semibold text-foreground">
                                        Attempt #{submissions.length - index}
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Submitted At: {new Date(sub.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <div className="mt-4 sm:mt-0 sm:ml-6">
                                    <p className={`text-lg font-bold ${sub.grade ? 'text-green-500' : 'text-yellow-500'}`}>
                                        {sub.grade ? `${sub.grade.score}%` : 'Pending Grade'}
                                    </p>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
          ) : (
            <div className="text-center py-16 bg-card rounded-2xl shadow-lg border border-border">
              <FiFileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">No Submissions Yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">You have not made any submissions for this assessment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentSubmissionPage;
