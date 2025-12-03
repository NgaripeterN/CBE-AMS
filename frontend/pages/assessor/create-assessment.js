// pages/assessor/create-assessment.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Select from 'react-select';
import api from '../../lib/api';
import { PlusIcon, TrashIcon, BookOpenIcon, ArrowLeftIcon, CogIcon, DocumentTextIcon, UserIcon } from '@heroicons/react/24/outline';
import ErrorModal from '../../components/ErrorModal';
import ConfirmSaveChangesModal from '../../components/ConfirmSaveChangesModal';
import toast from 'react-hot-toast';
import CompetencySelector from '../../components/CompetencySelector';
import { motion, AnimatePresence } from 'framer-motion';
import { customStyles } from '../../styles/react-select-styles';

const StepButton = ({ onClick, title, subtitle, icon: Icon }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.98 }}
    className="w-full text-left p-6 bg-card rounded-xl shadow-lg border border-border hover:border-primary transition-all"
  >
    <div className="flex items-center gap-4">
      <div className="bg-primary/10 p-3 rounded-lg">
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        <p className="text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
  </motion.button>
);

const TabButton = ({ isActive, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
    >
      {children}
    </button>
);

const AssessmentForm = ({ onSubmit, activeTab, setActiveTab, activeQuestionIndex, setActiveQuestionIndex, questions, setQuestions, ...props }) => {
    
    useEffect(() => {
        if (questions.length === 0) {
            setQuestions([{ type: 'MCQ', text: '', options: ['', ''], correctAnswer: 0, marks: 1, markingGuide: '', competencyIds: [] }]);
            setActiveQuestionIndex(0);
        }
        if (activeQuestionIndex >= questions.length && questions.length > 0) {
            setActiveQuestionIndex(questions.length - 1);
        }
    }, [questions, activeQuestionIndex, setQuestions, setActiveQuestionIndex]);

    const handleQuestionChange = (index, field, value) => {
        setQuestions(prev => {
          const arr = [...prev];
          arr[index] = { ...arr[index], [field]: value };
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

    const activeQuestion = questions[activeQuestionIndex];

    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
            <div className="flex gap-2 border-b border-border pb-2 mb-6">
                <TabButton isActive={activeTab === 'details'} onClick={() => setActiveTab('details')}>Details & Settings</TabButton>
                <TabButton isActive={activeTab === 'questions'} onClick={() => setActiveTab('questions')}>Questions</TabButton>
            </div>

            {activeTab === 'details' && (
                <motion.div key="details" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 bg-card p-6 rounded-xl border border-border">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-2">Assessment Title</label>
                        <input type="text" id="title" value={props.title} onChange={(e) => props.setTitle(e.target.value)} className="input" required />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-2">Description</label>
                        <textarea id="description" value={props.description} onChange={(e) => props.setDescription(e.target.value)} rows="4" className="input" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Assessment Group</label>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => props.setGroup('FORMATIVE')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${props.group === 'FORMATIVE' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>Formative</button>
                            <button type="button" onClick={() => props.setGroup('SUMMATIVE')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${props.group === 'SUMMATIVE' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}>Summative</button>
                        </div>
                    </div>
                    {props.group === 'SUMMATIVE' && (
                        <div className="pt-4 border-t border-dashed border-border">
                             <label htmlFor="isFinal" className="block text-sm font-medium text-muted-foreground mb-2">Finality</label>
                            <select
                                id="isFinal"
                                value={props.isFinal}
                                onChange={(e) => props.setIsFinal(e.target.value)}
                                className="input"
                                required
                            >
                                <option value="" disabled>-- Should grading this trigger final credential issuance? --</option>
                                <option value="true">Yes, this is the final assessment</option>
                                <option value="false">No, this is an interim summative assessment</option>
                            </select>
                            <p className="text-xs text-muted-foreground mt-1">This choice determines when the on-chain credential will be issued for students.</p>
                        </div>
                    )}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="deadline" className="block text-sm font-medium text-muted-foreground mb-2">Deadline</label>
                            <input type="datetime-local" id="deadline" value={props.deadline} onChange={(e) => props.setDeadline(e.target.value)} className="input" required />
                        </div>
                        <div>
                            <label htmlFor="availableFrom" className="block text-sm font-medium text-muted-foreground mb-2">Available From</label>
                            <div className="flex items-center gap-2 mt-2">
                                <input type="checkbox" id="isAvailableImmediately" checked={props.isAvailableImmediately} onChange={(e) => props.setIsAvailableImmediately(e.target.checked)} className="form-checkbox h-5 w-5 text-primary focus:ring-primary/50" />
                                <label htmlFor="isAvailableImmediately" className="text-sm text-muted-foreground">Immediately</label>
                            </div>
                            <AnimatePresence>
                            {!props.isAvailableImmediately && (
                                <motion.input
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: '0.5rem' }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    type="datetime-local" id="availableFrom" value={props.availableFrom} onChange={(e) => props.setAvailableFrom(e.target.value)} className="input"
                                />
                            )}
                            </AnimatePresence>
                        </div>
                        <div>
                            <label htmlFor="maxAttempts" className="block text-sm font-medium text-muted-foreground mb-2">Max Attempts</label>
                            <input type="number" id="maxAttempts" min="0" value={props.maxAttempts} onChange={(e) => props.setMaxAttempts(Number(e.target.value || 0))} className="input" />
                        </div>
                        <div>
                            <label htmlFor="duration" className="block text-sm font-medium text-muted-foreground mb-2">Duration (minutes, 0 for unlimited)</label>
                            <input type="number" id="duration" min="0" value={props.duration} onChange={(e) => props.setDuration(Number(e.target.value || 0))} className="input" />
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'questions' && (
                <motion.div key="questions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column: Question Navigator */}
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

                    {/* Right Column: Question Editor */}
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
                                        className="text-destructive hover:text-destructive/80 p-1.5 rounded-full hover:bg-destructive/10 disabled:opacity-50"
                                        disabled={questions.length <= 1}
                                        title={questions.length <= 1 ? "You cannot delete the only question" : "Delete Question"}
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Question Text */}
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
                                
                                {/* Question Type & Marks */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-2">Question Type</label>
                                        <select
                                            value={activeQuestion.type}
                                            onChange={(e) => handleQuestionChange(activeQuestionIndex, 'type', e.target.value)}
                                            className="input"
                                        >
                                            <option value="MCQ">Multiple Choice</option>
                                            <option value="SHORT_ANSWER">Short Answer</option>
                                            <option value="LONG_ANSWER">Long Answer / Essay</option>
                                            <option value="FILE_UPLOAD">File Upload</option>
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

                                {/* Answer Configuration */}
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

                                {/* Marking Guide */}
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
                                
                                {/* Competencies */}
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">Competencies Assessed (Optional)</label>
                                    <CompetencySelector
                                        availableCompetencies={props.moduleCompetencies}
                                        selectedIds={activeQuestion.competencyIds}
                                        onChange={(selected) => handleQuestionChange(activeQuestionIndex, 'competencyIds', selected)}
                                    />
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}

            <div className="flex justify-end gap-4 mt-8">
                 {activeTab === 'details' ? (
                    <>
                        <button type="button" onClick={() => props.setStep('initial')} className="px-6 py-2 rounded-lg bg-muted text-muted-foreground font-semibold hover:bg-muted/80 transition-colors">Cancel</button>
                        <button type="button" onClick={() => setActiveTab('questions')} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-sm transition-colors">Next</button>
                    </>
                ) : (
                    <>
                        <button type="button" onClick={() => props.setStep('initial')} className="px-6 py-2 rounded-lg bg-muted text-muted-foreground font-semibold hover:bg-muted/80 transition-colors">Back</button>
                        <button type="submit" className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-sm transition-colors">Create Assessment</button>
                    </>
                )}
            </div>
        </form>
    );
};

const ObservationForm = ({ onSubmit, ...props }) => {
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
            <div className="p-4 bg-card border border-border rounded-lg mt-4">
                <h2 className="text-lg font-semibold text-foreground mb-3">Observation Details</h2>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="student" className="block text-sm font-medium text-muted-foreground mb-1">Student(s)</label>
                        <Select
                            id="student"
                            options={props.students.map(s => ({ value: s.id, label: `${s.user.name}`.trim() || s.user.email }))}
                            value={props.selectedStudents}
                            onChange={props.setSelectedStudents}
                            isClearable
                            isSearchable
                            isMulti
                            placeholder="Search or select students..."
                            styles={customStyles}
                            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                        />
                    </div>
                    <div>
                        <label htmlFor="observationGroup">Observation Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => props.setObservationGroup('FORMATIVE')} className={`px-4 py-2 rounded-lg ${props.observationGroup === 'FORMATIVE' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>Formative</button>
                            <button type="button" onClick={() => props.setObservationGroup('SUMMATIVE')} className={`px-4 py-2 rounded-lg ${props.observationGroup === 'SUMMATIVE' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>Summative</button>
                        </div>
                    </div>
                    {props.observationGroup === 'SUMMATIVE' && (
                        <div className="pt-4 border-t border-dashed border-border">
                             <label htmlFor="isFinal" className="block text-sm font-medium text-muted-foreground mb-2">Finality</label>
                            <select
                                id="isFinal"
                                value={props.isFinal}
                                onChange={(e) => props.setIsFinal(e.target.value)}
                                className="input"
                                required
                            >
                                <option value="" disabled>-- Should grading this trigger final credential issuance? --</option>
                                <option value="true">Yes, this is the final assessment</option>
                                <option value="false">No, this is an interim summative assessment</option>
                            </select>
                            <p className="text-xs text-muted-foreground mt-1">This choice determines when the on-chain credential will be issued for students.</p>
                        </div>
                    )}
                    <div>
                        <label>Competencies Demonstrated</label>
                        <CompetencySelector availableCompetencies={props.moduleCompetencies} selectedIds={props.observationCompetencyIds} onChange={props.setObservationCompetencyIds} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="numericScore">Numeric Score</label>
                            <input type="number" id="numericScore" value={props.numericScore} onChange={(e) => props.setNumericScore(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
                        </div>
                        <div>
                            <label htmlFor="maxScore">Max Score</label>
                            <input type="number" id="maxScore" value={props.maxScore} onChange={(e) => props.setMaxScore(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="notes">Notes</label>
                        <textarea id="notes" rows="4" value={props.notes} onChange={(e) => props.setNotes(e.target.value)} className="w-full px-4 py-2 border rounded-lg"></textarea>
                    </div>
                </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => props.setStep('initial')} className="px-6 py-2 rounded-lg bg-muted text-muted-foreground font-semibold hover:bg-muted/80 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">Record Observation</button>
            </div>
        </form>
    );
};

const CreateAssessment = () => {
    const router = useRouter();
    const { module_id } = router.query;
    const [step, setStep] = useState('initial'); // 'initial', 'assessment', 'observation'
    const [activeTab, setActiveTab] = useState('details');
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

    // Assessment state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [group, setGroup] = useState('FORMATIVE');
    const [deadline, setDeadline] = useState('');
    const [availableFrom, setAvailableFrom] = useState('');
    const [isAvailableImmediately, setIsAvailableImmediately] = useState(true);
    const [maxAttempts, setMaxAttempts] = useState(1);
    const [duration, setDuration] = useState('');
    const [questions, setQuestions] = useState([{ type: 'MCQ', text: '', options: ['', ''], correctAnswer: 0, marks: 1, markingGuide: '', competencyIds: [] }]);
    const [isFinal, setIsFinal] = useState(''); // Default to empty string for validation

    // Observation state
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [observationCompetencyIds, setObservationCompetencyIds] = useState([]);
    const [numericScore, setNumericScore] = useState('');
    const [maxScore, setMaxScore] = useState('');
    const [notes, setNotes] = useState('');
    const [observationGroup, setObservationGroup] = useState('FORMATIVE');
    const [isFinalObservation, setIsFinalObservation] = useState('');
    
    // Shared state
    const [moduleTitle, setModuleTitle] = useState('');
    const [students, setStudents] = useState([]);
    const [moduleCompetencies, setModuleCompetencies] = useState([]);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
    const [errorModalMessage, setErrorModalMessage] = useState('');
    const [isConfirmUnlinkedCompetenciesModalOpen, setIsConfirmUnlinkedCompetenciesModalOpen] = useState(false);
    const [questionsWithoutCompetenciesModal, setQuestionsWithoutCompetenciesModal] = useState([]);


    useEffect(() => {
        const fetchModuleData = async () => {
          if (module_id) {
            try {
              const res = await api.get(`/modules/${module_id}`);
              setModuleTitle(res.data.title);
              setModuleCompetencies(res.data.competencies || []);
              
              const studentRes = await api.get(`/modules/${module_id}/students`);
              setStudents(studentRes.data.map(e => e.student) || []);

            } catch (err) {
              setErrorModalMessage('Failed to fetch module data.');
              setIsErrorModalOpen(true);
            }
          }
        };
        fetchModuleData();
      }, [module_id]);

    // NEW FUNCTION: Encapsulate the actual submission logic
    const performSubmission = async () => {
        setIsConfirmUnlinkedCompetenciesModalOpen(false); // Close modal if open

        const detectedSubmissionTypes = new Set(['TEXT_SUBMISSION']); // Default for rubric-based
        questions.forEach(q => {
            if (q.type === 'FILE_UPLOAD') detectedSubmissionTypes.add('FILE_UPLOAD');
        });

        const rubricData = {
            questions: questions,
            answers: questions.map(q => q.correctAnswer),
        };

        const payload = {
            title, description, group, deadline,
            availableFrom: isAvailableImmediately ? null : availableFrom,
            maxAttempts, duration: duration || 0, rubric: rubricData, module_id,
            submissionTypes: Array.from(detectedSubmissionTypes),
            isFinal: group === 'SUMMATIVE' ? (isFinal === 'true') : false,
        };
        try {
            await api.post(`/assessor/create-assessment/${module_id}`, payload);
            toast.success('Assessment created successfully!');
            router.back();
        } catch (err) {
            setErrorModalMessage(err.response?.data?.error || 'An error occurred while creating the assessment.');
            setIsErrorModalOpen(true);
        }
    };

    const handleAssessmentSubmit = async () => {
        if (step !== 'assessment') return;
        if (!title.trim()) {
            return toast.error('Please enter an assessment title.');
        }
        if (group === 'SUMMATIVE' && isFinal === '') {
            setActiveTab('details');
            return toast.error('Please specify if this is the final summative assessment.');
        }
        if (!questions || questions.length === 0) {
            return toast.error('Please add at least one question.');
        }
        if (deadline && new Date(deadline) < new Date()) {
            setActiveTab('details');
            return toast.error('The deadline cannot be in the past.');
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
            // MODIFIED: Collect questions without competencies instead of returning error
            if (q.competencyIds.length === 0) {
                questionsWithoutCompetencies.push(i + 1); // Store question number
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

        await performSubmission();
    };

    
    const handleObservationSubmit = async () => {
        if (!selectedStudents || selectedStudents.length === 0) {
            return toast.error('Please select at least one student for the observation.');
        }

        if (observationGroup === 'SUMMATIVE' && isFinalObservation === '') {
            return toast.error('Please specify if this is the final summative observation.');
        }

        // Extract just the student IDs from the selectedStudents array
        const studentIds = selectedStudents.map(student => student.value);

        try {
            await api.post('/assessor/record-observation', {
                studentIds: studentIds, // Send array of student IDs
                module_id: module_id,
                competencyIds: observationCompetencyIds,
                numericScore: numericScore === '' ? null : Number(numericScore),
                maxScore: maxScore === '' ? null : Number(maxScore),
                notes,
                group: observationGroup,
                isFinal: observationGroup === 'SUMMATIVE' ? (isFinalObservation === 'true') : false,
            });
            toast.success(`Observation recorded successfully for ${selectedStudents.length} student(s)!`);
            router.back();
        } catch (err) {
            setErrorModalMessage(err.response?.data?.error || 'An error occurred while recording observations.');
            setIsErrorModalOpen(true);
        }
    };

    const renderContent = () => {
        if (step === 'assessment') {
            return (
                <AssessmentForm
                    title={title} setTitle={setTitle}
                    description={description} setDescription={setDescription}
                    group={group} setGroup={setGroup}
                    deadline={deadline} setDeadline={setDeadline}
                    availableFrom={availableFrom} setAvailableFrom={setAvailableFrom}
                    isAvailableImmediately={isAvailableImmediately} setIsAvailableImmediately={setIsAvailableImmediately}
                    maxAttempts={maxAttempts} setMaxAttempts={setMaxAttempts}
                    duration={duration} setDuration={setDuration}
                    questions={questions} setQuestions={setQuestions}
                    moduleCompetencies={moduleCompetencies}
                    isFinal={isFinal} setIsFinal={setIsFinal}
                    onSubmit={handleAssessmentSubmit}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    activeQuestionIndex={activeQuestionIndex}
                    setActiveQuestionIndex={setActiveQuestionIndex}
                    setStep={setStep}
                />
            );
        }

        if (step === 'observation') {
            return (
                <ObservationForm 
                    students={students}
                    selectedStudents={selectedStudents} setSelectedStudents={setSelectedStudents}
                    observationGroup={observationGroup} setObservationGroup={setObservationGroup}
                    moduleCompetencies={moduleCompetencies}
                    observationCompetencyIds={observationCompetencyIds} setObservationCompetencyIds={setObservationCompetencyIds}
                    numericScore={numericScore} setNumericScore={setNumericScore}
                    maxScore={maxScore} setMaxScore={setMaxScore}
                    notes={notes} setNotes={setNotes}
                    isFinal={isFinalObservation}
                    setIsFinal={setIsFinalObservation}
                    onSubmit={handleObservationSubmit}
                    setStep={setStep}
                />
            );
        }

        return ( // Initial Step
            <div className="space-y-6">
                 <StepButton onClick={() => setStep('assessment')} title="Create a Structured Assessment" subtitle="Build a question-based test with a rubric." icon={DocumentTextIcon} />
                 <StepButton onClick={() => setStep('observation')} title="Record a Direct Observation" subtitle="Log a single, direct observation of a student's performance." icon={UserIcon} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
                <header className="mb-8">
                    <button onClick={() => (step === 'initial' ? router.back() : setStep('initial'))} className="mb-4 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-muted-foreground bg-muted hover:bg-muted/80 transition-colors">
                        <ArrowLeftIcon className="h-4 w-4 mr-2"/>
                        Back
                    </button>
                    <h1 className="text-3xl font-bold text-foreground">Create New Assessment</h1>
                    <p className="text-muted-foreground mt-1">For module: <span className="font-semibold text-primary-foreground">{moduleTitle}</span></p>
                </header>
                
                <AnimatePresence mode="wait">
                    <motion.div key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>

                <ErrorModal isOpen={isErrorModalOpen} message={errorModalMessage} onClose={() => setIsErrorModalOpen(false)} />
                <ConfirmSaveChangesModal
                    isOpen={isConfirmUnlinkedCompetenciesModalOpen && step === 'assessment'}
                    onClose={() => setIsConfirmUnlinkedCompetenciesModalOpen(false)}
                    onConfirm={performSubmission}
                    title="Questions without Competencies"
                    message={`The following questions do not have any competencies linked: ${questionsWithoutCompetenciesModal.join(', ')}. Are you sure you want to proceed?`}
                    confirmText="Proceed Anyway"
                />

            </div>
        </div>
    )
}

export default CreateAssessment;