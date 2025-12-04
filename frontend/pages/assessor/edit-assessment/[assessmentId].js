import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../../../lib/api';
import { PlusIcon, TrashIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import CompetencySelector from '../../../components/CompetencySelector';
import ConfirmSaveChangesModal from '../../../components/ConfirmSaveChangesModal';
import { motion, AnimatePresence } from 'framer-motion';

const TabButton = ({ isActive, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
    >
      {children}
    </button>
);

const EditAssessment = () => {
  const router = useRouter();
  const { assessmentId } = router.query;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [group, setGroup] = useState('FORMATIVE');
  const [isFinal, setIsFinal] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [isAvailableImmediately, setIsAvailableImmediately] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [duration, setDuration] = useState('');
  const [questions, setQuestions] = useState([]);
  const [originalQuestions, setOriginalQuestions] = useState([]);
  const [moduleCompetencies, setModuleCompetencies] = useState([]);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isConfirmUnlinkedCompetenciesModalOpen, setIsConfirmUnlinkedCompetenciesModalOpen] = useState(false);
  const [questionsWithoutCompetenciesModal, setQuestionsWithoutCompetenciesModal] = useState([]);

  // Helper function for deep comparison of question arrays
  const areQuestionsEqual = (q1, q2) => {
    if (q1.length !== q2.length) return false;

    for (let i = 0; i < q1.length; i++) {
      const { competencyIds: compIds1, options: opts1, ...rest1 } = q1[i];
      const { competencyIds: compIds2, options: opts2, ...rest2 } = q2[i];

      // Compare question properties (excluding competencyIds and options)
      if (JSON.stringify(rest1) !== JSON.stringify(rest2)) return false;

      // Compare options
      if (opts1.length !== opts2.length || opts1.some((opt, idx) => opt !== opts2[idx])) return false;

      // Compare competencyIds (order-independent)
      if (compIds1.length !== compIds2.length || [...compIds1].sort().some((id, idx) => id !== [...compIds2].sort()[idx])) return false;
    }
    return true;
  };

  useEffect(() => {
    if (assessmentId) {
      const fetchAssessment = async () => {
        try {
          const res = await api.get(`/assessor/assessments/${assessmentId}`);
          const assessment = res.data;
          
          setTitle(assessment.title);
          setDescription(assessment.description || '');
          setGroup(assessment.group);
          setIsFinal(assessment.isFinal || false);
          setDeadline(assessment.deadline ? new Date(assessment.deadline).toISOString().slice(0, 16) : '');
          setAvailableFrom(assessment.availableFrom ? new Date(assessment.availableFrom).toISOString().slice(0, 16) : '');
          setIsAvailableImmediately(!assessment.availableFrom);
          setMaxAttempts(assessment.maxAttempts || 1);
          setDuration(assessment.duration || '');

          if (assessment.rubric) {
            const rubricData = typeof assessment.rubric === 'string' ? JSON.parse(assessment.rubric) : assessment.rubric;
            if (Array.isArray(rubricData)) {
              setQuestions(rubricData);
              setOriginalQuestions(rubricData);
            } else if (rubricData && rubricData.questions) {
              setQuestions(rubricData.questions);
              setOriginalQuestions(rubricData.questions);
            }
          }

          if (assessment.module_id) {
            const moduleRes = await api.get(`/modules/${assessment.module_id}`);
            setModuleCompetencies(moduleRes.data.competencies || []);
          }

        } catch (err) {
          setError('Failed to fetch assessment details.');
          toast.error('Failed to fetch assessment details.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchAssessment();
    }
  }, [assessmentId]);
  
  useEffect(() => {
    if (questions.length > 0 && activeQuestionIndex >= questions.length) {
      setActiveQuestionIndex(questions.length - 1);
    }
  }, [questions, activeQuestionIndex]);

  const handleQuestionChange = (index, field, value) => {
    setQuestions(prev => {
      const arr = [...prev];
      const currentQuestion = { ...arr[index] };
      arr[index] = { ...arr[index], [field]: value };
      
      if (field === 'type' && currentQuestion.type === 'MCQ' && value !== 'MCQ') {
          arr[index].options = ['', ''];
          arr[index].correctAnswer = 0;
      }

      return arr;
    });
  };

  const handleAddQuestion = () => {
    const newQuestion = { type: 'MCQ', text: '', options: ['', ''], correctAnswer: 0, marks: 1, markingGuide: '', competencyIds: [] };
    setQuestions(prev => [...prev, newQuestion]);
    setActiveQuestionIndex(questions.length);
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
    if (activeQuestionIndex >= index) {
        setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1));
    }
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    setQuestions(prev => {
      const arr = [...prev];
      const options = [...arr[qIndex].options];
      options[oIndex] = value;
      arr[qIndex] = { ...arr[qIndex], options };
      return arr;
    });
  };

  const handleAddOption = (qIndex) => {
    setQuestions(prev => {
      const arr = [...prev];
      arr[qIndex] = { ...arr[qIndex], options: [...arr[qIndex].options, ''] };
      return arr;
    });
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    setQuestions(prev => {
      const arr = [...prev];
      const newOptions = arr[qIndex].options.filter((_, i) => i !== oIndex);
      let { correctAnswer } = arr[qIndex];
      if (correctAnswer >= newOptions.length) correctAnswer = Math.max(0, newOptions.length - 1);
      arr[qIndex] = { ...arr[qIndex], options: newOptions, correctAnswer };
      return arr;
    });
  };

  const performUpdate = async () => {
    setIsConfirmUnlinkedCompetenciesModalOpen(false);

    const detectedSubmissionTypes = new Set();
    if (questions.length > 0) {
        detectedSubmissionTypes.add('TEXT_SUBMISSION');
    }
    questions.forEach(q => {
        if (q.type === 'TEXT' || q.type === 'SHORT_ANSWER' || q.type === 'LONG_ANSWER') detectedSubmissionTypes.add('TEXT_SUBMISSION');
        if (q.type === 'MEDIA' || q.type === 'FILE_UPLOAD') detectedSubmissionTypes.add('FILE_UPLOAD');
    });

    const updatePayload = {
        title,
        description,
        submissionTypes: Array.from(detectedSubmissionTypes),
        group,
        isFinal,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        availableFrom: isAvailableImmediately ? null : (availableFrom ? new Date(availableFrom).toISOString() : null),
        maxAttempts: Number(maxAttempts),
        duration: duration ? Number(duration) : null,
    };

    // Only include rubric if it has changed
    if (!areQuestionsEqual(questions, originalQuestions)) {
        const rubricData = {
            questions: questions.map(q => ({ type: q.type, text: q.text, options: q.options, marks: q.marks, markingGuide: q.markingGuide, competencyIds: q.competencyIds })),
            answers: questions.map(q => q.correctAnswer),
        };
        updatePayload.rubric = rubricData;
    }
    
    try {
      const response = await api.put(`/assessor/assessments/${assessmentId}`, updatePayload);
      toast.success(`Assessment '${response.data.title}' updated successfully!`);
      setTimeout(() => router.back(), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while updating the assessment.');
      toast.error(err.response?.data?.error || 'An error occurred while updating the assessment.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title) {
      setError('Title is required.');
      toast.error('Title is required.');
      return;
    }

    const questionsWithoutCompetencies = [];
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.text.trim()) {
            setActiveTab('questions');
            setActiveQuestionIndex(i);
            return toast.error(`Please enter the question text for Question ${i + 1}.`);
        }
        if (q.marks <= 0) {
            setActiveTab('questions');
            setActiveQuestionIndex(i);
            return toast.error(`Please enter a valid mark for Question ${i + 1}.`);
        }
        if (!q.competencyIds || q.competencyIds.length === 0) {
            questionsWithoutCompetencies.push(i + 1);
        }
        if (q.type === 'MCQ') {
            if (q.options.length < 2) {
                setActiveTab('questions');
                setActiveQuestionIndex(i);
                return toast.error(`Please add at least two options for Question ${i + 1}.`);
            }
            if (q.options.some(opt => !opt.trim())) {
                setActiveTab('questions');
                setActiveQuestionIndex(i);
                return toast.error(`Please fill in all options for Question ${i + 1}.`);
            }
            const sanitizedOptions = q.options.map(opt => opt.trim());
            const uniqueOptions = new Set(sanitizedOptions);
            if (uniqueOptions.size !== sanitizedOptions.length) {
                setActiveTab('questions');
                setActiveQuestionIndex(i);
                return toast.error(`Please ensure all options are unique for Question ${i + 1}.`);
            }
        }
    }

    if (questionsWithoutCompetencies.length > 0) {
      setQuestionsWithoutCompetenciesModal(questionsWithoutCompetencies);
      setIsConfirmUnlinkedCompetenciesModalOpen(true);
      return;
    }

    await performUpdate();
  };

  if (isLoading) {
    return <p>Loading assessment...</p>;
  }

  const activeQuestion = questions[activeQuestionIndex];

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
      
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
        <div className="flex gap-2 border-b border-border pb-2 mb-6">
            <TabButton isActive={activeTab === 'details'} onClick={() => setActiveTab('details')}>Details & Settings</TabButton>
            <TabButton isActive={activeTab === 'questions'} onClick={() => setActiveTab('questions')}>Questions</TabButton>
        </div>

        <AnimatePresence mode="wait">
        {activeTab === 'details' && (
            <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 bg-card p-6 rounded-xl border border-border">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-2">Assessment Title</label>
                    <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="input" required />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="4" className="input" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Assessment Group</label>
                    <div className="flex gap-2">
                        <button type="button" onClick={() => setGroup('FORMATIVE')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${group === 'FORMATIVE' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>Formative</button>
                        <button type="button" onClick={() => setGroup('SUMMATIVE')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${group === 'SUMMATIVE' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>Summative</button>
                    </div>
                </div>

                <AnimatePresence>
                  {group === 'SUMMATIVE' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -20 }}
                      animate={{ opacity: 1, height: 'auto', y: 0, marginTop: '1.5rem' }}
                      exit={{ opacity: 0, height: 0, y: -20, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <div>
                        <label htmlFor="isFinal" className="block text-sm font-medium text-muted-foreground mb-2">Finality</label>
                        <select id="isFinal" value={isFinal} onChange={(e) => setIsFinal(e.target.value === 'true')} className="input">
                            <option value="false">This is NOT the final summative assessment</option>
                            <option value="true">This IS the final summative assessment</option>
                        </select>
                        <p className="text-xs text-muted-foreground mt-2">-- Should grading this trigger final credential issuance? --<br/>This choice determines when the on-chain credential will be issued for students.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="deadline" className="block text-sm font-medium text-muted-foreground mb-2">Deadline</label>
                        <input type="datetime-local" id="deadline" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="input" required />
                    </div>
                    <div>
                        <label htmlFor="availableFrom" className="block text-sm font-medium text-muted-foreground mb-2">Available From</label>
                        <div className="flex items-center gap-2 mt-2">
                            <input type="checkbox" id="isAvailableImmediately" checked={isAvailableImmediately} onChange={(e) => setIsAvailableImmediately(e.target.checked)} className="form-checkbox h-5 w-5 rounded text-primary focus:ring-primary/50" />
                            <label htmlFor="isAvailableImmediately" className="text-sm text-muted-foreground">Immediately</label>
                        </div>
                        <AnimatePresence>
                        {!isAvailableImmediately && (
                            <motion.input
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                type="datetime-local" id="availableFrom" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} className="input"
                            />
                        )}
                        </AnimatePresence>
                    </div>
                    <div>
                        <label htmlFor="maxAttempts" className="block text-sm font-medium text-muted-foreground mb-2">Max Attempts</label>
                        <input type="number" id="maxAttempts" min="0" value={maxAttempts} onChange={(e) => setMaxAttempts(Number(e.target.value || 0))} className="input" />
                    </div>
                    <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-muted-foreground mb-2">Duration (minutes, 0 for unlimited)</label>
                        <input type="number" id="duration" min="0" value={duration} onChange={(e) => setDuration(Number(e.target.value || 0))} className="input" />
                    </div>
                </div>
            </motion.div>
        )}

        {activeTab === 'questions' && (
            <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-1/3 space-y-2">
                    <AnimatePresence>
                    {questions.map((q, index) => (
                        <motion.div
                            key={index}
                            layout
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <button
                                type="button"
                                onClick={() => setActiveQuestionIndex(index)}
                                className={`w-full text-left p-3 rounded-lg border transition-all ${activeQuestionIndex === index ? 'bg-primary/10 border-primary shadow-sm' : 'bg-card hover:bg-muted/50 border-border'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <p className={`font-semibold ${activeQuestionIndex === index ? 'text-primary' : 'text-foreground'}`}>Question {index + 1}</p>
                                    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{q.type}</span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate mt-1">{q.text || 'New Question'}</p>
                            </button>
                        </motion.div>
                    ))}
                    </AnimatePresence>
                    <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold py-2.5 rounded-lg transition-colors"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Add Question
                    </button>
                </div>

                <div className="w-full lg:w-2/3">
                    <AnimatePresence mode="wait">
                    {activeQuestion && (
                        <motion.div
                            key={activeQuestionIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="bg-card border border-border p-6 rounded-xl shadow-sm space-y-6"
                        >
                            <div className="flex justify-between items-center pb-4 border-b border-border">
                                <h3 className="text-xl font-bold text-foreground">Editing Question {activeQuestionIndex + 1}</h3>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveQuestion(activeQuestionIndex)}
                                    className="text-destructive hover:text-destructive/80 p-1.5 rounded-full hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                                    disabled={questions.length <= 1 && questions[0].text === ''}
                                    title={questions.length <= 1 ? "You cannot delete the only question" : "Delete Question"}
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Question Text</label>
                                <textarea
                                    rows="4"
                                    value={activeQuestion.text}
                                    onChange={(e) => handleQuestionChange(activeQuestionIndex, 'text', e.target.value)}
                                    className="input"
                                    required
                                    placeholder="E.g., What is the primary function of..."
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">Question Type</label>
                                    <select
                                        value={activeQuestion.type}
                                        onChange={(e) => handleQuestionChange(activeQuestionIndex, 'type', e.target.value)}
                                        className="input"
                                    >
                                        <option value="MCQ">Multiple Choice</option>
                                        <option value="TEXT">Text Answer</option>
                                        <option value="MEDIA">Media Upload</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">Marks</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={activeQuestion.marks}
                                        onChange={(e) => handleQuestionChange(activeQuestionIndex, 'marks', Number(e.target.value))}
                                        className="input"
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                            {activeQuestion.type === 'MCQ' && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-3 pt-4 border-t border-border"
                                >
                                    <label className="block text-sm font-medium text-muted-foreground">Answer Options</label>
                                    {activeQuestion.options.map((opt, oIndex) => (
                                        <motion.div
                                            key={oIndex}
                                            layout
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="flex items-center gap-3"
                                        >
                                            <input
                                                type="radio"
                                                name={`correct-answer-${activeQuestionIndex}`}
                                                checked={activeQuestion.correctAnswer === oIndex}
                                                onChange={() => handleQuestionChange(activeQuestionIndex, 'correctAnswer', oIndex)}
                                                className="form-radio h-5 w-5 text-primary focus:ring-primary/50 border-border"
                                            />
                                            <input
                                                type="text"
                                                value={opt}
                                                onChange={(e) => handleOptionChange(activeQuestionIndex, oIndex, e.target.value)}
                                                className="input"
                                                placeholder={`Option ${oIndex + 1}`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveOption(activeQuestionIndex, oIndex)}
                                                className="text-muted-foreground hover:text-destructive p-1 rounded-full hover:bg-destructive/10 disabled:opacity-50"
                                                disabled={activeQuestion.options.length <= 2}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </motion.div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => handleAddOption(activeQuestionIndex)}
                                        className="text-sm font-semibold text-primary hover:underline"
                                    >
                                        + Add Option
                                    </button>
                                </motion.div>
                            )}
                            </AnimatePresence>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Marking Guide (Optional)</label>
                                <textarea
                                    value={activeQuestion.markingGuide}
                                    onChange={(e) => handleQuestionChange(activeQuestionIndex, 'markingGuide', e.target.value)}
                                    rows="2"
                                    className="input"
                                    placeholder="E.g., Award 1 mark for mentioning X, 1 mark for Y..."
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">Competencies Assessed</label>
                                <CompetencySelector
                                    availableCompetencies={moduleCompetencies}
                                    selectedIds={activeQuestion.competencyIds || []}
                                    onChange={(selected) => handleQuestionChange(activeQuestionIndex, 'competencyIds', selected)}
                                />
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </div>
            </motion.div>
        )}
        </AnimatePresence>

        <div className="flex justify-end gap-4 mt-8">
            <button type="button" onClick={() => router.back()} className="px-6 py-2 rounded-lg bg-muted text-muted-foreground font-semibold hover:bg-muted/80 transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-sm transition-colors">Update Assessment</button>
        </div>
      </form>
      <ConfirmSaveChangesModal
        isOpen={isConfirmUnlinkedCompetenciesModalOpen}
        onClose={() => setIsConfirmUnlinkedCompetenciesModalOpen(false)}
        onConfirm={performUpdate}
        title="Questions without Competencies"
        message={`The following questions do not have any competencies linked: ${questionsWithoutCompetenciesModal.join(', ')}. Are you sure you want to proceed?`}
        confirmText="Proceed Anyway"
      />
    </div>
  );
};

export default EditAssessment;
