import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api, { getSubmissionMediaUrl } from '../../lib/api';
import { DocumentTextIcon, LinkIcon, PaperClipIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import ErrorModal from '../../components/ErrorModal';

const GradeSubmissions = () => {
  const router = useRouter();
  const { module_id } = router.query;

  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'graded'

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (module_id) {
        try {
          const res = await api.get(`/assessor/modules/${module_id}/submissions`);
          setSubmissions(res.data);
        } catch (err) {
          setError('Failed to fetch submissions.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchSubmissions();
  }, [module_id]);

  const handleGradeSubmit = async (submissionId, grade) => {
    try {
      await api.post(`/assessor/grade-submission/${submissionId}`, { grade });
      const res = await api.get(`/assessor/modules/${module_id}/submissions`);
      setSubmissions(res.data);
      setSelectedSubmission(null); // Close modal after grading
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setError(err.response.data.error);
      } else {
        setError(err.response?.data?.error || 'Failed to grade submission.');
      }
    }
  };

  const pendingSubmissions = submissions.filter(s => !s.gradedAt);
  const gradedSubmissions = submissions.filter(s => s.gradedAt);

  const displayedSubmissions = activeTab === 'pending' ? pendingSubmissions : gradedSubmissions;

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
      >
        &larr; Back
      </button>
      <h1 className="text-3xl font-bold mb-6 text-foreground">Grade Submissions</h1>
      {isLoading && <p>Loading submissions...</p>}
      <ErrorModal isOpen={!!error} message={error} onClose={() => setError('')} />

      <div className="flex border-b border-border mb-4">
        <button
          className={`flex-1 py-2 text-center font-medium ${activeTab === 'pending' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Review ({pendingSubmissions.length})
        </button>
        <button
          className={`flex-1 py-2 text-center font-medium ${activeTab === 'graded' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('graded')}
        >
          Graded ({gradedSubmissions.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedSubmissions.map(sub => (
          <SubmissionCard key={sub.submission_id} submission={sub} onSelect={() => setSelectedSubmission(sub)} />
        ))}
      </div>

      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setSelectedSubmission(null)} 
              className="absolute top-4 right-4 text-white bg-red-500 hover:bg-red-600 rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold"
            >
              &times;
            </button>
            <div className="p-6">
              <SubmissionGrader 
                submission={selectedSubmission} 
                onGrade={handleGradeSubmit} 
                onError={setError}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SubmissionCard = ({ submission, onSelect }) => {
  const totalMarks = submission.assessment.rubric.questions.reduce((acc, q) => acc + Number(q.marks), 0);
  const totalScore = submission.grade?.questionScores.reduce((acc, score) => acc + (Number(score.score) || 0), 0);

  return (
    <button onClick={onSelect} className="bg-card p-6 rounded-lg shadow-md text-left w-full hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-lg text-foreground">{submission.student.user.name}</p>
          <p className="text-sm text-muted-foreground">{submission.assessment.title}</p>
        </div>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${submission.gradedAt ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          {submission.gradedAt ? 'Graded' : 'Pending'}
        </span>
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground">Submitted: {new Date(submission.createdAt).toLocaleString()}</p>
        {submission.gradedAt && (
          <p className="text-sm font-semibold text-foreground mt-2">Score: {totalScore} / {totalMarks}</p>
        )}
      </div>
    </button>
  );
};

const MediaFileViewer = ({ submissionId, questionIndex, answer }) => {
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGetUrl = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { url } = await getSubmissionMediaUrl(submissionId, questionIndex);
      setDownloadUrl(url);
    } catch (err) {
      setError('Failed to get download link.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMedia = () => {
    if (!downloadUrl) return null;
    const fileType = answer.fileType;
    if (fileType.startsWith('image/')) return <img src={downloadUrl} alt={answer.fileName} className="max-w-full h-auto rounded-lg" />;
    if (fileType.startsWith('video/')) return <video controls src={downloadUrl} className="max-w-full h-auto rounded-lg" />;
    if (fileType === 'application/pdf') return <iframe src={downloadUrl} className="w-full h-96" title={answer.fileName}></iframe>;
    return <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Download/View Media</a>;
  };

  return (
    <div>
      <p><strong>File:</strong> {answer.fileName}</p>
      {!downloadUrl && (
        <button onClick={handleGetUrl} disabled={isLoading} className="bg-secondary text-secondary-foreground px-3 py-1 rounded hover:bg-secondary/90 text-sm">
          {isLoading ? 'Generating Link...' : 'View Media'}
        </button>
      )}
      {error && <p className="text-destructive-foreground text-sm">{error}</p>}
      <div className="mt-2">{renderMedia()}</div>
    </div>
  );
};

const SubmissionGrader = ({ submission, onGrade, onError }) => {
  const [questionScores, setQuestionScores] = useState([]);
  const [notes, setNotes] = useState('');
  const [scoreErrors, setScoreErrors] = useState([]);

  useEffect(() => {
    const initialScores = submission.assessment.rubric.questions.map((q, i) => {
      if (submission.grade && submission.grade.questionScores) {
        const gradedScore = submission.grade.questionScores.find(s => s.questionIndex === i);
        if (gradedScore) return gradedScore.score;
      }
      if (q.type === 'MCQ') {
        const studentAnswer = submission.data.answers[i];
        const isCorrect = parseInt(studentAnswer) === submission.assessment.rubric.answers[i];
        return isCorrect ? q.marks : 0;
      }
      return '';
    });
    setQuestionScores(initialScores);
    setScoreErrors(new Array(submission.assessment.rubric.questions.length).fill(''));
    setNotes(submission.grade?.notes || '');
  }, [submission]);

  const handleScoreChange = (index, value) => {
    const newScores = [...questionScores];
    newScores[index] = value;
    setQuestionScores(newScores);

    const newErrors = [...scoreErrors];
    const maxMarks = Number(submission.assessment.rubric.questions[index].marks);
    const score = Number(value);

    if (value !== '' && (isNaN(score) || score < 0)) {
      newErrors[index] = 'Invalid score';
    } else if (score > maxMarks) {
      newErrors[index] = `Score cannot be > ${maxMarks}`;
    } else {
      newErrors[index] = '';
    }
    setScoreErrors(newErrors);
  };

  const totalScore = questionScores.reduce((acc, score) => acc + (Number(score) || 0), 0);
  const totalMarks = submission.assessment.rubric.questions.reduce((acc, q) => acc + Number(q.marks), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const hasErrors = scoreErrors.some(e => e !== '');
    if (hasErrors) {
      onError('Please correct the scores in red.');
      return;
    }
    const grade = {
      notes,
      questionScores: submission.assessment.rubric.questions.map((q, i) => ({ questionIndex: i, score: Number(questionScores[i]) || 0 })),
    };
    onGrade(submission.submission_id, grade);
  };

  const hasErrors = scoreErrors.some(e => e !== '');

  return (
    <div className="bg-card p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-4 pb-4 border-b border-border">
        <div>
          <h3 className="text-xl font-bold text-foreground">{submission.student.user.name}</h3>
          <p className="text-muted-foreground">{submission.assessment.title}</p>
          <p className="text-sm text-muted-foreground mt-1">Submitted: {new Date(submission.createdAt).toLocaleString()}</p>
        </div>
        {submission.gradedAt && (
          <div className="text-right">
            <p className="font-semibold text-green-500 flex items-center"><CheckCircleIcon className="h-5 w-5 mr-1"/> Graded</p>
            <p className="text-sm text-muted-foreground">{new Date(submission.gradedAt).toLocaleString()}</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {submission.assessment.rubric.questions.map((q, index) => (
          <div key={index} className="border border-border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-foreground">Question {index + 1}</h4>
              <span className="text-sm text-muted-foreground">Max Marks: {q.marks}</span>
            </div>
            <div className="prose prose-sm max-w-none p-3 bg-muted/50 rounded-md text-foreground my-2">{q.text}</div>
            {q.markingGuide && <div className="prose prose-sm max-w-none p-3 bg-blue-100/50 rounded-md text-blue-800 mb-2"><strong>Marking Guide:</strong> {q.markingGuide}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <h5 className="font-semibold text-foreground mb-2">Student's Answer</h5>
                {submission.data.answers[index] ? (
                  typeof submission.data.answers[index] === 'object' ? (
                    <MediaFileViewer submissionId={submission.submission_id} questionIndex={index} answer={submission.data.answers[index]} />
                  ) : (
                    <div className="prose prose-sm max-w-none p-3 bg-muted/50 rounded-md text-foreground">{submission.data.answers[index]}</div>
                  )
                ) : (
                  <p className="text-muted-foreground italic">No answer provided.</p>
                )}
              </div>
              <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-4">
                <label htmlFor={`score-${index}`} className="block text-sm font-medium text-muted-foreground mb-1">Score</label>
                <input 
                  type="number" 
                  id={`score-${index}`} 
                  value={questionScores[index]} 
                  onChange={(e) => handleScoreChange(index, e.target.value)} 
                  onWheel={(e) => e.target.blur()}
                  min="0"
                  max={q.marks}
                  className="w-24 px-2 py-1 border rounded bg-background border-border text-center" 
                  disabled={q.type === 'MCQ' || !!submission.gradedAt}
                />
                {scoreErrors[index] && <p className="text-red-500 text-xs mt-1">{scoreErrors[index]}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 pt-4 border-t border-border">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <h4 className="text-lg font-semibold">Total Score</h4>
            <p className="text-2xl font-bold text-primary">{totalScore} / {totalMarks}</p>
          </div>
          <textarea 
            placeholder="Overall Notes (optional)" 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
            className="w-full px-3 py-2 border rounded bg-background border-border mt-4"
            disabled={!!submission.gradedAt}
          />
        </div>
        {!submission.gradedAt && 
          <div className="mt-4 text-right">
            <button type="submit" disabled={hasErrors} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 font-semibold text-lg disabled:bg-gray-400">Submit Grade</button>
          </div>
        }
      </form>
    </div>
  );
};

export default GradeSubmissions;