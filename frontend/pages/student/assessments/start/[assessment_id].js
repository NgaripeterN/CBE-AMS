import { useRouter } from 'next/router';
import { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { getAssessmentById, submitAssessment, generateUploadSignature } from '../../../../lib/api';
import { FiFileText, FiUpload, FiCheckCircle } from 'react-icons/fi';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import ErrorModal from '../../../../components/ErrorModal';
import Toast from '../../../../components/Toast';
import { format } from 'date-fns';
import Timer from '../../../../components/Timer';
import { useAuth } from '../../../../contexts/AuthContext';

const AssessmentSubmissionPage = () => {
  const router = useRouter();
  const { assessment_id } = router.query;
  const { user } = useAuth();
  const [assessment, setAssessment] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingProgress, setUploadingProgress] = useState({}); // Changed to object
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState({}); // New state for drag-and-drop
  const [startTime, setStartTime] = useState(null);
  
  // State for Toast notification
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const answersRef = useRef(answers);
  answersRef.current = answers;

  const handleSubmit = useCallback(async (e, forceSubmit = false) => {
    if(e) e.preventDefault();

    if (!forceSubmit) {
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
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitAssessment(assessment_id, { submissionData: { answers: answersRef.current } });
      if (user) {
        localStorage.removeItem(`assessment_answers_${assessment_id}_${user.user_id}`);
        localStorage.removeItem(`assessment_start_time_${assessment_id}_${user.user_id}`);
      }
      
      setToastMessage('Assessment submitted successfully!');
      setToastType('success');
      setShowToast(true);

      // Delay redirect to allow toast to be seen
      setTimeout(() => {
        window.location.href = '/student/submissions';
      }, 2000); // Show toast for 2 seconds

    } catch (err) {
      setError('Submission failed. Please try again.');
      setToastMessage('Submission failed. Please try again.');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [assessment_id, user]);

  useEffect(() => {
    if (assessment_id && user) {
      setIsLoading(true);
      getAssessmentById(assessment_id)
        .then(data => {
          const assessmentData = {
            ...data,
            rubric: typeof data.rubric === 'string' ? JSON.parse(data.rubric) : data.rubric,
          };
          setAssessment(assessmentData);

          const startTimeKey = `assessment_start_time_${assessment_id}_${user.user_id}`;
          const savedStartTime = localStorage.getItem(startTimeKey);
          if (savedStartTime) {
            setStartTime(Number(savedStartTime));
          } else {
            const now = Date.now();
            localStorage.setItem(startTimeKey, now.toString());
            setStartTime(now);
          }

          const answersKey = `assessment_answers_${assessment_id}_${user.user_id}`;
          const savedAnswers = localStorage.getItem(answersKey);
          if (savedAnswers) {
            setAnswers(JSON.parse(savedAnswers));
          } else if (assessmentData.rubric && assessmentData.rubric.questions) {
            const initialAnswers = assessmentData.rubric.questions.map(q => {
              if (q.type === 'FILE' || q.type === 'MEDIA') {
                return null;
              }
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
  }, [assessment_id, user]);


  useEffect(() => {
    if (assessment_id && user && answers.length > 0) {
      const answersKey = `assessment_answers_${assessment_id}_${user.user_id}`;
      localStorage.setItem(answersKey, JSON.stringify(answers));
    }
  }, [answers, assessment_id, user]);

  const handleInputChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleFileChange = async (index, file) => {
    if (!file) return;
    setUploadingProgress(prev => ({ ...prev, [index]: 0 })); // Update for specific index

    try {
      const folder = `submissions/${assessment.module_id}/${assessment_id}`;
      const { timestamp, signature } = await generateUploadSignature(folder);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('api_key', process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY);

      const response = await axios.post(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`, formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadingProgress(prev => ({ ...prev, [index]: percentCompleted })); // Update for specific index
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
      setUploadingProgress(prev => { // Clear progress for specific index
        const newProgress = { ...prev };
        delete newProgress[index];
        return newProgress;
      });
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setIsDragging(prev => ({ ...prev, [index]: true }));
  };

  const handleDragLeave = (e, index) => {
    e.preventDefault();
    setIsDragging(prev => ({ ...prev, [index]: false }));
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    setIsDragging(prev => ({ ...prev, [index]: false }));
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(index, e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };


  const goBack = () => {
    router.back();
  };

  const handleTimeUp = () => {
    if (isSubmitting) return; // Prevent multiple submissions
    handleSubmit(null, true);
  };

  if (isLoading) return <div className="flex justify-center items-center min-h-screen"><p className="text-lg">Loading assessment...</p></div>;
  if (error && !isErrorModalOpen) return <div className="flex justify-center items-center min-h-screen"><p className="text-lg text-red-500">{error}</p></div>;
  if (!assessment) return <div className="flex justify-center items-center min-h-screen"><p className="text-lg">Assessment not found.</p></div>;

  const { title, description, rubric, deadline, maxAttempts, submissions, createdByAssessor: createdBy } = assessment;
  const isEligible = new Date(deadline) > new Date() && submissions.length < maxAttempts;
  const questions = rubric.questions;

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <ErrorModal 
          isOpen={isErrorModalOpen} 
          message={error} 
          onClose={() => {
            setIsErrorModalOpen(false);
            setError(null);
          }} 
        />
        {/* Toast Notification */}
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setShowToast(false)} 
        />
        <div className="container mx-auto px-4 py-8">
            <header className="mb-8 flex justify-between items-center">
                <button
                    onClick={goBack}
                    className="inline-flex items-center mb-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Back
                </button>
                {assessment.duration && assessment.duration > 0 && (
                <Timer
                    duration={assessment.duration}
                    startTime={startTime}
                    onTimeUp={handleTimeUp}
                    isStarted={!!startTime}
                />
                )}
            </header>
            <h1 className="text-4xl font-bold tracking-tight text-gray-800 dark:text-white sm:text-5xl">{title}</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">Created by: {createdBy.user.name}</p>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{description}</p>

            {/* Assessment Submission Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4 border-b pb-4 border-gray-200 dark:border-gray-700">Submit Your Work</h2>
                {isEligible ? (
                <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8 mt-6">
                    {questions && questions.map((q, index) => {
                    return (
                        <div key={index} className="bg-white dark:bg-gray-800 border-2 border-black dark:border-gray-400 rounded-lg p-6 mb-6">
                        <div className="flex items-start flex-col">
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-1">Question {index + 1}</span>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">{q.text}</p>
                        </div>
                        <div className="mt-4 pl-10">
                            {q.type === 'MCQ' && (
                            <div className="space-y-3">
                                {q.options.map((option, i) => (
                                <label key={i} className="flex items-center cursor-pointer">
                                    <input
                                    type="radio"
                                    name={`question-${index}`}
                                    value={i}
                                    checked={answers[index] === i.toString()}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    className="form-radio h-5 w-5 text-blue-600 bg-gray-200 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <span className="ml-3 text-gray-700 dark:text-gray-300">{option}</span>
                                </label>
                                ))}
                            </div>
                            )}
                            {(q.type === 'TEXT' || q.type === 'SHORT_ANSWER') && (
                                <input
                                    type="text"
                                    value={answers[index] || ''}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    className="input w-full p-3 border rounded-md bg-background border-border focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Type your answer here..."
                                />
                            )}
                            {q.type === 'LONG_ANSWER' && (
                                <textarea
                                    value={answers[index] || ''}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    className="min-h-80 input w-full p-3 border rounded-md bg-background border-border focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="Type your detailed answer here..."
                                ></textarea>
                            )}
                            {(q.type === 'FILE' || q.type === 'MEDIA' || q.type === 'FILE_UPLOAD') && (
                                <div
                                  className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-all duration-200 ease-in-out
                                    ${isDragging[index] ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30'}`}
                                  onDragOver={(e) => handleDragOver(e, index)}
                                  onDragLeave={(e) => handleDragLeave(e, index)}
                                  onDrop={(e) => handleDrop(e, index)}
                                >
                                  {answers[index] ? (
                                    <div className="flex items-center space-x-3">
                                      <FiFileText className="w-6 h-6 text-green-500" />
                                      <span className="text-gray-700 dark:text-gray-300 font-medium">{answers[index].fileName}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleInputChange(index, null)} // Clear the answer for this question
                                        className="text-red-500 hover:text-red-700 focus:outline-none"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <FiUpload className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-3" />
                                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF, PDF up to 10MB</p>
                                      <input
                                        type="file"
                                        onChange={(e) => handleFileChange(index, e.target.files[0])}
                                        className="hidden"
                                        id={`file-upload-${index}`}
                                      />
                                      <label htmlFor={`file-upload-${index}`} className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm tracking-wide uppercase cursor-pointer hover:bg-primary/90 transition-colors duration-200">
                                        Select File
                                      </label>
                                    </>
                                  )}
                                  {uploadingProgress !== null && uploadingProgress[index] !== undefined && (
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
                                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadingProgress[index]}%` }}></div>
                                    </div>
                                  )}
                                </div>
                            )}
                        </div>
                        </div>
                    )
                    })}
                    <div className="flex justify-end items-center pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center justify-center bg-green-600 text-white px-8 py-3 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                        >
                        <FiCheckCircle className="w-5 h-5 mr-2" />
                        {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
                        </button>
                    </div>
                </form>
                ) : (
                <div className="text-center py-10">
                    <p className="text-lg text-red-500">
                    You are not eligible to submit this assessment. Either the deadline has passed or you have reached the maximum number of attempts.
                    </p>
                </div>
                )}
            </div>

            <div className="mt-10">
                <h2 className="text-2xl font-semibold mb-4">Previous Submissions</h2>
                {submissions.length > 0 ? (
                    <ul className="space-y-4">
                        {submissions.map(sub => (
                            <li key={sub.submission_id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                                <div className="flex justify-between items-center">
                                <p className="text-gray-700 dark:text-gray-300"><strong>Submitted At:</strong> {new Date(sub.createdAt).toLocaleString()}</p>
                                <p className={`font-semibold ${sub.grade ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                    <strong>Grade:</strong> {sub.grade ? `${sub.grade.score}%` : 'Not Graded Yet'}
                                </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <p className="text-gray-600 dark:text-gray-400">You have no previous submissions for this assessment.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default AssessmentSubmissionPage;
