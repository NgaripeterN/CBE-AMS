import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../../lib/api';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { ArrowLeftIcon } from '@heroicons/react/24/solid'; // Added import

const EditAssessment = () => {
  const router = useRouter();
  const { assessmentId } = router.query;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [group, setGroup] = useState('FORMATIVE');
  const [deadline, setDeadline] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [isAvailableImmediately, setIsAvailableImmediately] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [duration, setDuration] = useState('');
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (assessmentId) {
      const fetchAssessment = async () => {
        try {
          const res = await api.get(`/assessor/assessments/${assessmentId}`);
          const assessment = res.data;
          setTitle(assessment.title);
          setDescription(assessment.description || '');
          setGroup(assessment.group);
          setDeadline(assessment.deadline ? new Date(assessment.deadline).toISOString().slice(0, 16) : '');
          setAvailableFrom(assessment.availableFrom ? new Date(assessment.availableFrom).toISOString().slice(0, 16) : '');
          setIsAvailableImmediately(!assessment.availableFrom);
          setMaxAttempts(assessment.maxAttempts || 1);
          setDuration(assessment.duration || '');
          if (assessment.rubric) {
            const rubricData = JSON.parse(assessment.rubric);
            setQuestions(rubricData.questions || []);
          }
        } catch (err) {
          setError('Failed to fetch assessment details.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchAssessment();
    }
  }, [assessmentId]);

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([...questions, { type: 'MCQ', text: '', options: ['', ''], correctAnswer: '', marks: 1, markingGuide: '' }]);
  };

  const removeQuestion = (index) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const addOption = (qIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push('');
    setQuestions(newQuestions);
  };

  const removeOption = (qIndex, oIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.splice(oIndex, 1);
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title) {
      setError('Title is required.');
      return;
    }

    const submissionTypes = [...new Set(questions.map(q => q.type))];
    const rubricData = {
      questions: questions.map(q => ({ type: q.type, text: q.text, options: q.options, marks: q.marks, markingGuide: q.markingGuide })),
      answers: questions.map(q => q.correctAnswer),
    };
    const formattedRubric = JSON.stringify(rubricData);

    try {
      const response = await api.put(`/assessor/assessments/${assessmentId}`, {
        title,
        description,
        submissionTypes,
        group,
        rubric: formattedRubric,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        availableFrom: isAvailableImmediately ? new Date().toISOString() : (availableFrom ? new Date(availableFrom).toISOString() : null),
        maxAttempts: Number(maxAttempts),
        duration: duration ? Number(duration) : null,
      });
      setSuccess(`Assessment '${response.data.title}' updated successfully!`);
      setTimeout(() => router.back(), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while updating the assessment.');
    }
  };

  if (isLoading) {
    return <p>Loading assessment...</p>;
  }

  const totalMarks = questions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center mb-6 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="h-5 w-5 mr-2" />
        Back to Assessments
      </button>
      <h1 className="text-3xl font-bold mb-6 text-foreground">Edit Assessment</h1>
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit}>
          {error && <p className="text-destructive-foreground bg-destructive/20 p-3 rounded-md mb-4">{error}</p>}
          {success && <p className="text-green-500 bg-green-500/20 p-3 rounded-md mb-4">{success}</p>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-card p-6 rounded-2xl shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-4">Main Details</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-1">Assessment Title</label>
                    <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" required />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                    <textarea id="description" rows="4" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"></textarea>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Questions</h2>
                </div>
                <div className="space-y-6">
                  {questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-background/50 p-4 border border-border rounded-xl">
                      <div className="flex justify-between items-center mb-4">
                        <p className="font-semibold text-foreground">Question {qIndex + 1}</p>
                        <div className="flex items-center gap-2">
                          <label htmlFor={`marks-${qIndex}`} className="text-sm font-medium text-muted-foreground">Marks</label>
                          <input type="number" id={`marks-${qIndex}`} value={q.marks} onChange={(e) => handleQuestionChange(qIndex, 'marks', e.target.value)} className="w-20 px-2 py-1 border border-border rounded-md bg-background/70 focus:outline-none focus:ring-2 focus:ring-primary" />
                          <button type="button" onClick={() => removeQuestion(qIndex)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <select value={q.type} onChange={(e) => handleQuestionChange(qIndex, 'type', e.target.value)} className="w-full p-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary">
                          <option value="MCQ">Multiple Choice</option>
                          <option value="TEXT">Free Text</option>
                          <option value="MEDIA">Media Upload</option>
                        </select>
                        <textarea value={q.text} onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" rows="2" placeholder="Enter question text"></textarea>
                        {(q.type === 'TEXT' || q.type === 'MEDIA') && (
                          <textarea value={q.markingGuide} onChange={(e) => handleQuestionChange(qIndex, 'markingGuide', e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary" rows="2" placeholder="Marking Guide (optional)"></textarea>
                        )}
                        {q.type === 'MCQ' && (
                          <div className="space-y-3 pt-2">
                            {q.options.map((opt, oIndex) => (
                              <div key={oIndex} className="flex items-center gap-2">
                                <input type="radio" name={`q${qIndex}-correct`} checked={q.correctAnswer === oIndex} onChange={() => handleQuestionChange(qIndex, 'correctAnswer', oIndex)} className="form-radio h-4 w-4 text-primary border-border focus:ring-primary" />
                                <input type="text" value={opt} onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)} className="w-full px-3 py-1.5 border border-border rounded-md bg-background/70 focus:outline-none focus:ring-2 focus:ring-primary" placeholder={`Option ${oIndex + 1}`} />
                                <button type="button" onClick={() => removeOption(qIndex, oIndex)} className="text-muted-foreground hover:text-destructive transition-colors">
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                            <button type="button" onClick={() => addOption(qIndex)} className="text-sm text-primary hover:underline mt-2">+ Add Option</button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addQuestion} className="flex items-center bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold py-2 px-4 rounded-lg transition-colors">
                    <PlusIcon className="h-5 w-5 mr-2" /> Add Question
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-8">
              <div className="bg-card p-6 rounded-2xl shadow-sm">
                <h2 className="text-xl font-semibold text-foreground mb-4">Settings</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">Total Marks</span>
                    <span className="text-lg font-bold text-foreground">{totalMarks}</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Group</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setGroup('FORMATIVE')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${group === 'FORMATIVE' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
                        Formative
                      </button>
                      <button type="button" onClick={() => setGroup('SUMMATIVE')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${group === 'SUMMATIVE' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>
                        Summative
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Available From</label>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="isAvailableImmediately" checked={isAvailableImmediately} onChange={(e) => setIsAvailableImmediately(e.target.checked)} className="form-checkbox h-4 w-4 text-primary border-border focus:ring-primary" />
                      <label htmlFor="isAvailableImmediately" className="text-sm font-medium text-muted-foreground">Available Immediately</label>
                    </div>
                    {!isAvailableImmediately && (
                      <input type="datetime-local" id="availableFrom" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background mt-2" />
                    )}
                  </div>
                  <div>
                    <label htmlFor="deadline" className="block text-sm font-medium text-muted-foreground mb-1">Deadline</label>
                    <input type="datetime-local" id="deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
                  </div>
                  <div>
                    <label htmlFor="maxAttempts" className="block text-sm font-medium text-muted-foreground mb-1">Max Attempts</label>
                    <input type="number" id="maxAttempts" min="1" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
                  </div>
                  <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-muted-foreground mb-1">Duration (in minutes)</label>
                    <input type="number" id="duration" min="0" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end mt-8">
              <button type="button" onClick={() => router.back()} className="bg-muted hover:bg-muted/80 text-foreground font-bold py-2 px-4 rounded-lg mr-2">Cancel</button>
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-lg">Update Assessment</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAssessment;
