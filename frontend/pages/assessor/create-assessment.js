import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Select from 'react-select';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import ErrorModal from '../../components/ErrorModal';
import toast from 'react-hot-toast';

const CreateAssessment = () => {
  const router = useRouter();
  const { module_id } = router.query;
  const formRef = useRef(null);

  const getInitialState = () => {
    if (typeof window !== 'undefined' && module_id) {
      const savedState = localStorage.getItem(`assessment_form__${module_id}`);
      if (savedState) {
        return JSON.parse(savedState);
      }
    }
    return {
      title: '',
      description: '',
      group: 'FORMATIVE',
      deadline: '',
      availableFrom: '',
      isAvailableImmediately: true,
      maxAttempts: 1,
      duration: '',
      questions: [{ type: 'MCQ', text: '', options: ['', ''], correctAnswer: 0, marks: 1, markingGuide: '' }],
      selectedStudent: null,
      competencyTags: '',
      numericScore: '',
      maxScore: '',
      notes: '',
      isObservation: false,
    };
  };

  const [title, setTitle] = useState(getInitialState().title);
  const [description, setDescription] = useState(getInitialState().description);
  const [group, setGroup] = useState(getInitialState().group);
  const [deadline, setDeadline] = useState(getInitialState().deadline);
  const [availableFrom, setAvailableFrom] = useState(getInitialState().availableFrom);
  const [isAvailableImmediately, setIsAvailableImmediately] = useState(getInitialState().isAvailableImmediately);
  const [maxAttempts, setMaxAttempts] = useState(getInitialState().maxAttempts);
  const [duration, setDuration] = useState(getInitialState().duration);
  const [questions, setQuestions] = useState(getInitialState().questions);
  const [selectedStudent, setSelectedStudent] = useState(getInitialState().selectedStudent);
  const [competencyTags, setCompetencyTags] = useState(getInitialState().competencyTags);
  const [numericScore, setNumericScore] = useState(getInitialState().numericScore);
  const [maxScore, setMaxScore] = useState(getInitialState().maxScore);
  const [notes, setNotes] = useState(getInitialState().notes);
  const [isObservation, setIsObservation] = useState(getInitialState().isObservation);

  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [scoreError, setScoreError] = useState('');

  useEffect(() => {
    const handleWheel = (e) => {
      if (document.activeElement.type === 'number') {
        e.preventDefault();
      }
    };

    const form = formRef.current;
    if (form) {
      form.addEventListener('wheel', handleWheel, { passive: false });

      return () => {
        form.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  useEffect(() => {
    if (module_id) {
      const formState = {
        title,
        description,
        group,
        deadline,
        availableFrom,
        isAvailableImmediately,
        maxAttempts,
        duration,
        questions,
        selectedStudent,
        competencyTags,
        numericScore,
        maxScore,
        notes,
        isObservation,
      };
      localStorage.setItem(`assessment_form__${module_id}`, JSON.stringify(formState));
    }
  }, [title, description, group, deadline, availableFrom, isAvailableImmediately, maxAttempts, duration, questions, selectedStudent, competencyTags, numericScore, maxScore, notes, isObservation, module_id]);

  useEffect(() => {
    if (isObservation) {
      const fetchStudents = async () => {
        if (module_id) {
          try {
            const res = await api.get(`/modules/${module_id}/students`);
            setStudents(res.data.map(enrollment => enrollment.student));
          } catch (err) {
            setError('Failed to fetch enrolled students.');
          }
        }
      };
      fetchStudents();
    }
  }, [isObservation, module_id]);

  useEffect(() => {
    if (numericScore && maxScore && Number(numericScore) > Number(maxScore)) {
      setScoreError('Score cannot exceed max score.');
    } else {
      setScoreError('');
    }
  }, [numericScore, maxScore]);

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

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setGroup('FORMATIVE');
    setDeadline('');
    setAvailableFrom('');
    setIsAvailableImmediately(true);
    setMaxAttempts(1);
    setDuration('');
    setQuestions([{ type: 'MCQ', text: '', options: ['', ''], correctAnswer: 0, marks: 1, markingGuide: '' }]);
    setSelectedStudent(null);
    setCompetencyTags('');
    setNumericScore('');
    setMaxScore('');
    setNotes('');
    setIsObservation(false);
    if (module_id) {
      localStorage.removeItem(`assessment_form__${module_id}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isObservation) {
      if (!module_id) {
        setErrorModalMessage('Module ID could not be determined. Please go back and select a module.');
        setIsErrorModalOpen(true);
        return;
      }

      if (!selectedStudent) {
        setErrorModalMessage('Please select a student.');
        setIsErrorModalOpen(true);
        return;
      }

      if ((numericScore && !maxScore) || (!numericScore && maxScore)) {
        setErrorModalMessage('Please provide both a numeric score and a max score, or leave both empty.');
        setIsErrorModalOpen(true);
        return;
      }

      if (numericScore && maxScore && Number(numericScore) > Number(maxScore)) {
        setErrorModalMessage('The numeric score cannot exceed the maximum score.');
        setIsErrorModalOpen(true);
        return;
      }

      try {
        await api.post('/assessor/record-observation', {
          student_id: selectedStudent.value,
          module_id: module_id,
          competencyTags: competencyTags.split(',').map(tag => tag.trim()),
          numericScore: numericScore ? Number(numericScore) : null,
          maxScore: maxScore ? Number(maxScore) : null,
          notes,
        });
        toast.success('Observation recorded successfully!');
        resetForm();
        setTimeout(() => router.back(), 2000);
      } catch (err) {
        setErrorModalMessage(err.response?.data?.error || 'An error occurred while recording the observation.');
        setIsErrorModalOpen(true);
      }
    } else {
      if (!title || !deadline) {
        setErrorModalMessage('Title and deadline are required.');
        setIsErrorModalOpen(true);
        return;
      }

      const submissionTypes = [...new Set(questions.map(q => q.type))];
      const rubricData = {
        questions: questions.map(q => ({ type: q.type, text: q.text, options: q.options, marks: q.marks, markingGuide: q.markingGuide })),
        answers: questions.map(q => q.correctAnswer),
      };
      const formattedRubric = JSON.stringify(rubricData);

      try {
        const response = await api.post(`/assessor/create-assessment/${module_id}`, {
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
        toast.success(`Assessment '${response.data.title}' created successfully!`);
        resetForm();
        setTimeout(() => router.back(), 2000);
      } catch (err) {
        setErrorModalMessage(err.response?.data?.error || 'An error occurred while creating the assessment.');
        setIsErrorModalOpen(true);
      }
    }
  };

  const totalMarks = questions.reduce((acc, q) => acc + (Number(q.marks) || 0), 0);

  const studentOptions = students.map(student => ({
    value: student.id,
    label: `${student.user.name} (${student.user.email})`
  }));

  const customStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: 'hsl(var(--background))',
      borderColor: 'hsl(var(--border))',
      color: 'hsl(var(--foreground))',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'hsl(var(--background))',
      zIndex: 9999,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? 'hsl(var(--primary))' : 'hsl(var(--background))',
      color: state.isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
      '&:hover': {
        backgroundColor: 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'hsl(var(--foreground))',
    }),
    input: (provided) => ({
      ...provided,
      color: 'hsl(var(--foreground))',
    }),
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          &larr; Back
        </button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{isObservation ? 'Record Observation' : 'Create New Assessment'}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{isObservation ? 'Record a direct observation of a student.' : 'Design and configure a new assessment for your module.'}</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${!isObservation ? 'text-primary' : 'text-muted-foreground'}`}>Assessment</span>
              <button type="button" onClick={() => setIsObservation(!isObservation)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isObservation ? 'bg-primary' : 'bg-muted'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isObservation ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className={`text-sm font-medium ${isObservation ? 'text-primary' : 'text-muted-foreground'}`}>Observation</span>
            </div>
            <button onClick={resetForm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold py-2 px-4 rounded-lg transition-colors">
              Reset Form
            </button>
          </div>
        </div>

        {error && <div className="bg-destructive/20 border-l-4 border-destructive text-destructive-foreground p-4 mb-6 rounded-md">{error}</div>}

        <form ref={formRef} onSubmit={handleSubmit}>
          {isObservation ? (
            <div className="bg-card p-6 rounded-2xl shadow-sm max-w-3xl mx-auto">
              <div className="space-y-4">
                <div>
                  <label htmlFor="student" className="block text-sm font-medium text-muted-foreground mb-1">Student</label>
                  <Select id="student" options={studentOptions} value={selectedStudent} onChange={setSelectedStudent} isClearable isSearchable placeholder="Search or select a student..." styles={customStyles} menuPortalTarget={document.body} />
                </div>
                <div>
                  <label htmlFor="competencyTags" className="block text-sm font-medium text-muted-foreground mb-1">Competency Tags (comma-separated)</label>
                  <input type="text" id="competencyTags" value={competencyTags} onChange={(e) => setCompetencyTags(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="numericScore" className="block text-sm font-medium text-muted-foreground mb-1">Numeric Score</label>
                    <input type="number" id="numericScore" value={numericScore} onChange={(e) => setNumericScore(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
                  </div>
                  <div>
                    <label htmlFor="maxScore" className="block text-sm font-medium text-muted-foreground mb-1">Max Score</label>
                    <input type="number" id="maxScore" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background" />
                  </div>
                </div>
                {scoreError && <div className="text-destructive text-sm mt-2">{scoreError}</div>}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-muted-foreground mb-1">Notes</label>
                  <textarea id="notes" rows="4" value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"></textarea>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Main Assessment Details */}
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

                {/* Questions Section */}
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

              {/* Settings Column */}
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
          )}
          <div className="lg:col-span-3 flex items-center justify-end mt-6">
              <button type="button" onClick={() => router.back()} className="bg-muted hover:bg-muted/80 text-foreground font-bold py-2 px-4 rounded-lg mr-2 transition-colors">Cancel</button>
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded-lg transition-colors" disabled={!!scoreError}>{isObservation ? 'Record Observation' : 'Create Assessment'}</button>
          </div>
        </form>
      </div>
      <ErrorModal 
        isOpen={isErrorModalOpen}
        message={errorModalMessage} 
        onClose={() => setIsErrorModalOpen(false)} 
      />
    </div>
  );
};

export default CreateAssessment;