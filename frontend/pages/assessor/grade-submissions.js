import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Select from 'react-select';
import api, { getSubmissionMediaUrl } from '../../lib/api';
import { DocumentTextIcon, LinkIcon, CheckCircleIcon, BookOpenIcon, EyeIcon, ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import ErrorModal from '../../components/ErrorModal';
import ConfirmSaveChangesModal from '../../components/ConfirmSaveChangesModal';
import CompetencySelector from '../../components/CompetencySelector';
import { customStyles } from '../../styles/react-select-styles';
import toast from 'react-hot-toast';
import Image from 'next/image';

const GradeSubmissions = () => {
  const router = useRouter();
  const { module_id } = router.query;
  const [submissions, setSubmissions] = useState([]);
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [isEditingObservation, setIsEditingObservation] = useState(false);

  const fetchSubmissions = async () => {
    try {
      const res = await api.get(`/assessor/modules/${module_id}/submissions`);
      setSubmissions(res.data);
    } catch (err) {
      setError('Failed to fetch submissions.');
      setErrorModalMessage(err.response?.data?.error || 'Failed to fetch submissions. Please try again.');
      setIsErrorModalOpen(true);
    }
  };

  const fetchObservations = async () => {
    try {
      const res = await api.get(`/assessor/modules/${module_id}/observations`);
      setObservations(res.data);
    } catch (err) {
      setError('Failed to fetch observations.');
      setErrorModalMessage(err.response?.data?.error || 'Failed to fetch observations. Please try again.');
      setIsErrorModalOpen(true);
    }
  };

  useEffect(() => {
    if (module_id) {
      const fetchAllData = async () => {
        setLoading(true);
        try {
          const [submissionsRes, observationsRes] = await Promise.all([
            api.get(`/assessor/modules/${module_id}/submissions`),
            api.get(`/assessor/modules/${module_id}/observations`)
          ]);
          setSubmissions(submissionsRes.data);
          setObservations(observationsRes.data);
          setError(null);
        } catch (err) {
          setError('Failed to fetch data.');
          setErrorModalMessage(err.response?.data?.error || 'Failed to fetch data. Please try again.');
          setIsErrorModalOpen(true);
        } finally {
          setLoading(false);
        }
      };
      fetchAllData();
    }
  }, [module_id]);

  useEffect(() => {
    setSelectedItem(null);
    setIsEditingObservation(false);
  }, [activeTab]);

  const handleGrade = async (submissionId, gradeData, shouldFinalizeCredential) => {
    try {
      await api.post(`/assessor/grade-submission/${submissionId}`, { grade: gradeData, shouldFinalizeCredential });
      setSelectedItem(null);
      await fetchSubmissions(); // Re-fetch to ensure all data is consistent
      setActiveTab('graded');
    } catch (err) {
      setErrorModalMessage(err.response?.data?.error || 'An error occurred while submitting the grade.');
      setIsErrorModalOpen(true);
    }
  };

  const handleUpdateObservation = async (observationId, data) => {
    try {
      await api.put(`/assessor/observations/${observationId}`, data);
      setIsEditingObservation(false);
      await fetchObservations();
      toast.success('Observation updated successfully!');
    } catch (err) {
      setErrorModalMessage(err.response?.data?.error || 'An error occurred while updating the observation.');
      setIsErrorModalOpen(true);
    }
  };

  const handleGraderError = (message) => {
    setErrorModalMessage(message);
    setIsErrorModalOpen(true);
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error) return <div className="text-center py-10 text-destructive">{error}</div>;

  // Ensure uniqueStudents contains only unique student objects
  const allStudents = [...submissions.map(s => s.student), ...observations.flatMap(o => o.students.map(s => s.student))];
  const uniqueStudents = [...new Map(allStudents.map(item => [item['id'], item])).values()];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="flex items-center mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 mr-4"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold">Submissions & Observations</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/3">
            <div className="border-b border-border">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`${
                    activeTab === 'pending'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setActiveTab('graded')}
                  className={`${
                    activeTab === 'graded'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Graded
                </button>
                <button
                  onClick={() => setActiveTab('observations')}
                  className={`${
                    activeTab === 'observations'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Observations
                </button>
              </nav>
            </div>

            <div className="mt-4">
              {activeTab === 'pending' && (
                <>
                  {submissions.filter(s => !s.gradedAt).length === 0 ? (
                    <p className="text-muted-foreground">No pending submissions for this module.</p>
                  ) : (
                    <div className="space-y-4">
                      {submissions.filter(s => !s.gradedAt).map(submission => (
                        <SubmissionCard key={submission.submission_id} submission={submission} onSelect={setSelectedItem} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'graded' && (
                <>
                  {submissions.filter(s => s.gradedAt).length === 0 ? (
                    <p className="text-muted-foreground">No submissions graded yet for this module.</p>
                  ) : (
                    <div className="space-y-4">
                      {submissions.filter(s => s.gradedAt).map(submission => (
                        <SubmissionCard key={submission.submission_id} submission={submission} onSelect={setSelectedItem} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'observations' && (
                <>
                  {observations.length === 0 ? (
                    <p className="text-muted-foreground">No observations recorded for this module.</p>
                  ) : (
                    <div className="space-y-4">
                      {observations.map(observation => (
                        <ObservationCard key={observation.id} observation={observation} onSelect={setSelectedItem} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>


          <div className="lg:w-2/3">
            {selectedItem ? (
              activeTab === 'observations' ? (
                isEditingObservation ? (
                  <ObservationEditor
                    observation={selectedItem}
                    onSave={handleUpdateObservation}
                    onCancel={() => setIsEditingObservation(false)}
                    students={uniqueStudents}
                  />
                ) : (
                  <ObservationViewer observation={selectedItem} onEdit={() => setIsEditingObservation(true)} />
                )
              ) : (
                <SubmissionGrader submission={selectedItem} onGrade={handleGrade} onError={handleGraderError} />
              )
            ) : (
              <div className="bg-card p-6 rounded-lg shadow-md flex items-center justify-center h-full">
                <p className="text-muted-foreground text-lg">Select an item to view.</p>
              </div>
            )}
          </div>
        </div>
        <ErrorModal
          isOpen={isErrorModalOpen}
          message={errorModalMessage}
          onClose={() => setIsErrorModalOpen(false)}
        />
      </div>
    </div>
  );
};

const SubmissionCard = ({ submission, onSelect }) => {
  const isGraded = !!submission.gradedAt;
  return (
    <div
      className={`bg-card p-4 rounded-lg shadow-sm border ${isGraded ? 'border-green-300 dark:border-green-700' : 'border-border'} cursor-pointer hover:shadow-md transition-shadow`}
      onClick={() => onSelect(submission)}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">{submission.assessment.title}</h3>
        {isGraded && <CheckCircleIcon className="h-6 w-6 text-green-500" />}
      </div>
      <p className="text-muted-foreground text-sm">Student: {submission.student.user.name}</p>
      <p className="text-muted-foreground text-sm">Submitted: {new Date(submission.createdAt).toLocaleString()}</p>
      {isGraded && (
        <p className="text-sm text-green-600 dark:text-green-400 mt-1">Graded: {new Date(submission.gradedAt).toLocaleString()}</p>
      )}
    </div>
  );
};

const ObservationCard = ({ observation, onSelect }) => (
  <div
    className="bg-card p-4 rounded-lg shadow-sm border border-border cursor-pointer hover:shadow-md transition-shadow"
    onClick={() => onSelect(observation)}
  >
    <div className="flex justify-between items-center">
      <h3 className="font-semibold text-lg flex items-center"><EyeIcon className="h-5 w-5 mr-2" />Observation</h3>
      <span className="text-sm text-muted-foreground">{new Date(observation.recordedAt).toLocaleDateString()}</span>
    </div>
    <p className="text-muted-foreground text-sm">Student: {observation.students?.map(s => s.student.user.name).join(', ') ?? 'N/A'}</p>
    <p className="text-muted-foreground text-sm truncate">Notes: {observation.notes || 'N/A'}</p>
  </div>
);

const ObservationViewer = ({ observation, onEdit }) => {
  if (!observation) {
    return (
      <div className="bg-card p-6 rounded-lg shadow-md flex items-center justify-center h-full">
        <p className="text-muted-foreground text-lg">Please select a valid observation to view.</p>
      </div>
    );
  }

  // Deduplicate competencies before rendering to handle group observations correctly
  const uniqueCompetencies = observation.studentCompetencyEvidence
    ? Array.from(
        new Map(
          observation.studentCompetencyEvidence
            .filter(sce => sce.competency) // Ensure competency object exists
            .map(sce => [sce.competency.id, sce.competency])
        ).values()
      )
    : [];

  return (
    <div className="bg-card p-6 rounded-lg shadow-md">
      {observation.group !== 'SUMMATIVE' && (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={onEdit}
            className="bg-secondary text-secondary-foreground font-bold py-2 px-4 rounded-md hover:bg-secondary/90"
          >
            Edit Observation
          </button>
        </div>
      )}
      <h2 className="text-2xl font-bold mb-4 flex items-center"><EyeIcon className="h-6 w-6 mr-2" />Observation Details</h2>
      <div className="space-y-4">
        <p><span className="font-semibold">Student(s):</span> {observation.students?.map(s => s.student.user.name).join(', ') ?? 'N/A'}</p>
        <p><span className="font-semibold">Recorded by:</span> {observation.assessor ? observation.assessor.user.name : 'N/A'}</p>
        <p><span className="font-semibold">Date:</span> {new Date(observation.recordedAt).toLocaleString()}</p>
        <p><span className="font-semibold">Score:</span> {observation.numericScore !== null ? `${observation.numericScore} / ${observation.maxScore}` : 'N/A'}</p>
        <div>
          <h3 className="font-semibold">Notes:</h3>
          <p className="bg-muted/50 p-3 rounded-md mt-1">{observation.notes || 'No notes provided.'}</p>
        </div>
        {uniqueCompetencies.length > 0 && (
          <div>
            <h3 className="font-semibold">Competencies Demonstrated:</h3>
            <ul className="list-disc list-inside bg-muted/50 p-3 rounded-md mt-1">
              {uniqueCompetencies.map(comp => (
                <li key={comp.id}>{comp.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const ObservationEditor = ({ observation, onSave, onCancel, students }) => {
  const [numericScore, setNumericScore] = useState(observation.numericScore || '');
  const [notes, setNotes] = useState(observation.notes || '');
  // Safely initialize selectedStudents from observation.students
  const [selectedStudents, setSelectedStudents] = useState(
    (observation.students || []).map(s => ({ value: s.studentId, label: s.student.user.name }))
  );
  // Initialize selectedCompetencyIds from studentCompetencyEvidence, ensuring uniqueness
  const [selectedCompetencyIds, setSelectedCompetencyIds] = useState(
    [...new Set(observation.studentCompetencyEvidence?.map(sce => sce.competencyId) || [])]
  );
  const [observationGroup, setObservationGroup] = useState(observation.group || 'FORMATIVE');
  const [isFinalObservation, setIsFinalObservation] = useState(observation.isFinal ? 'true' : 'false');


  const handleSave = () => {
    if (!selectedStudents || selectedStudents.length === 0) {
      toast.error('Please select at least one student for the observation.');
      return;
    }
    if (observationGroup === 'SUMMATIVE' && isFinalObservation === '') {
      toast.error('Please specify if this is the final summative observation.');
      return;
    }

    onSave(observation.id, {
      numericScore: numericScore ? parseInt(numericScore, 10) : null,
      notes,
      studentIds: selectedStudents.map(s => s.value), // Send array of student IDs
      competencyIds: selectedCompetencyIds, // Send array of competency IDs
      group: observationGroup,
      isFinal: observationGroup === 'SUMMATIVE' ? (isFinalObservation === 'true') : false,
    });
  };

  return (
    <div className="bg-card p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Edit Observation</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="students" className="block text-sm font-medium text-foreground">Student(s)</label>
          <Select
            id="students"
            options={students.map(s => ({ value: s.id, label: s.user.name }))}
            value={selectedStudents}
            onChange={setSelectedStudents}
            isMulti
            isClearable
            isSearchable
            placeholder="Select students..."
            styles={customStyles}
            menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
          />
        </div>
        <div>
          <label htmlFor="observationGroup" className="block text-sm font-medium text-foreground">Observation Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setObservationGroup('FORMATIVE')} className={`px-4 py-2 rounded-lg ${observationGroup === 'FORMATIVE' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>Formative</button>
            <button type="button" onClick={() => setObservationGroup('SUMMATIVE')} className={`px-4 py-2 rounded-lg ${observationGroup === 'SUMMATIVE' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>Summative</button>
          </div>
        </div>
        {observationGroup === 'SUMMATIVE' && (
          <div className="pt-4 border-t border-dashed border-border">
            <label htmlFor="isFinalObservation" className="block text-sm font-medium text-muted-foreground mb-2">Finality</label>
            <select
              id="isFinalObservation"
              value={isFinalObservation}
              onChange={(e) => setIsFinalObservation(e.target.value)}
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
          <label htmlFor="numericScore" className="block text-sm font-medium text-foreground">Score</label>
          <input
            type="number"
            id="numericScore"
            value={numericScore}
            onChange={(e) => setNumericScore(e.target.value)}
            className="mt-1 block w-full border border-border rounded-md shadow-sm bg-background p-2"
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-foreground">Notes</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="4"
            className="mt-1 block w-full border border-border rounded-md shadow-sm bg-background p-2"
          ></textarea>
        </div>
        {observation.module && observation.module.competencies && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Competencies Demonstrated</label>
            <CompetencySelector
              availableCompetencies={observation.module.competencies}
              selectedIds={selectedCompetencyIds}
              onChange={setSelectedCompetencyIds}
            />
          </div>
        )}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="bg-muted text-muted-foreground font-bold py-2 px-4 rounded-md hover:bg-muted/90"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-primary text-primary-foreground font-bold py-2 px-4 rounded-md hover:bg-primary/90"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};


const MediaFileViewer = ({ submissionId, questionIndex, answer, openMediaViewer }) => {
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMediaUrl = async () => {
      try {
        const url = await getSubmissionMediaUrl(submissionId, questionIndex);
        setFileUrl(url);
      } catch (err) {
        setError('Failed to load media file.');
      } finally {
        setLoading(false);
      }
    };

    if (answer && answer.url) {
      fetchMediaUrl();
    } else {
      setLoading(false);
    }
  }, [submissionId, questionIndex, answer]);

  if (loading) return <p className="text-muted-foreground">Loading media...</p>;
  if (error) return <p className="text-destructive">{error}</p>;
  if (!fileUrl) return <p className="text-muted-foreground">No media file.</p>;

  // Basic rendering based on common media types
  const fileExtension = fileUrl.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
    return <Image src={fileUrl} alt="Submission media" className="max-w-full h-auto rounded-md cursor-pointer" onClick={() => openMediaViewer(fileUrl, 'image')} layout="responsive" width={500} height={500} objectFit="contain" />;
  }
  if (['mp4', 'webm', 'ogg'].includes(fileExtension)) {
    return (
      <video controls className="max-w-full h-auto rounded-md cursor-pointer" onClick={() => openMediaViewer(fileUrl, 'video')}>
        <source src={fileUrl} type={`video/${fileExtension}`} />
        Your browser does not support the video tag.
      </video>
    );
  }
  if (['mp3', 'wav', 'aac'].includes(fileExtension)) {
    return (
      <audio controls className="max-w-full w-full rounded-md" onClick={() => openMediaViewer(fileUrl, 'audio')}>
        <source src={fileUrl} type={`audio/${fileExtension}`} />
        Your browser does not support the audio element.
      </audio>
    );
  }
  if (fileExtension === 'pdf') {
    return (
      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary hover:underline">
        <DocumentTextIcon className="h-5 w-5 mr-1" /> View PDF
      </a>
    );
  }

  return (
    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary hover:underline" onClick={() => openMediaViewer(fileUrl, 'other')}>
      <LinkIcon className="h-5 w-5 mr-1" /> View File
    </a>
  );
};

const MediaViewerModal = ({ isOpen, mediaUrl, mediaType, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div className="relative bg-card p-4 rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 rounded-full text-muted-foreground hover:bg-muted"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <div className="mt-8">
          {mediaType === 'image' && (
            <Image src={mediaUrl} alt="Enlarged media" className="max-w-full h-auto mx-auto" layout="responsive" width={700} height={500} objectFit="contain" />
          )}
          {mediaType === 'video' && (
            <video controls src={mediaUrl} className="max-w-full h-auto mx-auto"></video>
          )}
          {mediaType === 'audio' && (
            <audio controls src={mediaUrl} className="max-w-full w-full mx-auto"></audio>
          )}
          {mediaType === 'pdf' && (
            <iframe src={mediaUrl} width="100%" height="500px" className="border-none"></iframe>
          )}
          {mediaType === 'other' && (
            <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              View File (External Link)
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const SubmissionGrader = ({ submission, onGrade, onError }) => {
  const [questionScores, setQuestionScores] = useState([]);
  const [notes, setNotes] = useState('');
  const [scoreErrors, setScoreErrors] = useState([]);
  const [competencyEvidence, setCompetencyEvidence] = useState({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState('');

  useEffect(() => {
    if (!submission || !submission.assessment) {
      // If no submission is selected, or assessment data is missing,
      // reset states and exit.
      setQuestionScores([]);
      setCompetencyEvidence({});
      setScoreErrors([]);
      setNotes('');
      setIsEditing(false);
      return;
    }

    const questions = submission.assessment.rubric.questions;
    const studentAnswers = submission.data.answers;
    const existingScores = submission.grade?.questionScores;
    const existingEvidence = submission.grade?.competencyEvidence;

    const newScores = [];
    const newEvidence = {};

    questions.forEach((q, i) => {
      // Determine if the MCQ is correct
      const correctAnswer = submission.assessment.rubric.answers[i];
      const isCorrectMCQ = q.type === 'MCQ' &&
                           correctAnswer !== null &&
                           correctAnswer !== undefined &&
                           studentAnswers[i] === correctAnswer.toString();

      // Initialize score
      const existingScore = existingScores?.find(qs => qs.questionIndex === i)?.score;
      if (existingScore !== undefined) {
        newScores[i] = existingScore;
      } else if (isCorrectMCQ) {
        newScores[i] = q.marks;
      } else {
        newScores[i] = 0;
      }

      // Initialize competency evidence
      if (q.competencyIds && q.competencyIds.length > 0) {
        newEvidence[i] = {};
        q.competencyIds.forEach(cId => {
          const existing = existingEvidence?.[i]?.[cId];
          if (isCorrectMCQ) {
            newEvidence[i][cId] = true;
          } else {
            newEvidence[i][cId] = existing ?? false;
          }
        });
      }
    });

    setQuestionScores(newScores);
    setCompetencyEvidence(newEvidence);

    setScoreErrors(new Array(questions.length).fill(''));
    setNotes(submission.grade?.notes || '');
    setIsEditing(false); // Reset editing mode when submission changes
  }, [submission]);

  const openMediaViewer = (url, type) => {
    setSelectedMediaUrl(url);
    setSelectedMediaType(type);
    setIsMediaModalOpen(true);
  };

  const closeMediaModal = () => {
    setIsMediaModalOpen(false);
    setSelectedMediaUrl('');
    setSelectedMediaType('');
  };

  if (!submission || !submission.assessment) {
    return (
      <div className="bg-card p-6 rounded-lg shadow-md flex items-center justify-center h-full">
        <p className="text-muted-foreground text-lg">Please select a valid submission to grade.</p>
      </div>
    );
  }

  const handleCompetencyChange = (qIndex, cId, isDemonstrated) => {
    setCompetencyEvidence(prev => ({
      ...prev,
      [qIndex]: {
        ...prev[qIndex],
        [cId]: isDemonstrated,
      }
    }));
  };

  const handleScoreChange = (index, value) => {
    const newScores = [...questionScores];
    newScores[index] = value;
    setQuestionScores(newScores);

    if (value < 0 || value > submission.assessment.rubric.questions[index].marks) {
      const newErrors = [...scoreErrors];
      newErrors[index] = `Score must be between 0 and ${submission.assessment.rubric.questions[index].marks}`;
      setScoreErrors(newErrors);
    } else {
      const newErrors = [...scoreErrors];
      newErrors[index] = '';
      setScoreErrors(newErrors);
    }
  };

  const totalScore = questionScores.reduce((acc, score) => acc + (Number(score) || 0), 0);
  const totalMarks = submission.assessment.rubric.questions.reduce((acc, q) => acc + Number(q.marks), 0);

  const handleGradeAction = (shouldFinalize) => {
    const hasErrors = scoreErrors.some(e => e !== '');
    if (hasErrors) {
      onError('Please correct the scores in red before submitting.');
      return;
    }

    const grade = {
      notes,
      questionScores: submission.assessment.rubric.questions.map((q, i) => ({ questionIndex: i, score: Number(questionScores[i]) || 0 })),
      competencyEvidence,
    };
    onGrade(submission.submission_id, grade, shouldFinalize);
    setIsEditing(false); // Exit edit mode after saving
  };
  
  const handleConfirmFinalize = () => {
    handleGradeAction(true);
    setIsConfirmModalOpen(false);
  };
  
  const handleFinalizeClick = () => {
    const hasErrors = scoreErrors.some(e => e !== '');
    if (hasErrors) {
      onError('Please correct the scores in red before submitting.');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const hasErrors = scoreErrors.some(e => e !== '');

  const getCompetencyName = (cId) => {
    const competency = submission.assessment.module.competencies.find(c => c.id === cId);
    return competency ? competency.name : 'Unknown Competency';
  };

  const isSummativeGraded = submission.assessment.group === 'SUMMATIVE' && !!submission.gradedAt;
  const areFieldsDisabled = isSummativeGraded || (submission.assessment.group !== 'SUMMATIVE' && !!submission.gradedAt && !isEditing);

  return (
    <div className="bg-card p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">{submission.assessment.title}</h2>
      <p className="text-muted-foreground mb-4">Student: <span className="font-semibold">{submission.student.user.name}</span></p>

      {submission.assessment.group !== 'SUMMATIVE' && !!submission.gradedAt && !isEditing && (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="bg-secondary text-secondary-foreground font-bold py-2 px-4 rounded-md hover:bg-secondary/90"
          >
            Edit Grade
          </button>
        </div>
      )}

      <div className="space-y-6">
        {submission.assessment.rubric.questions.map((q, index) => {
          const studentAnswer = submission.data.answers[index];
          const isUnanswered = studentAnswer === null || studentAnswer === undefined;
          
          return (
          <div key={index} className="border border-border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-lg">Question {index + 1}: {q.text}</h3>
              {isUnanswered && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                  UNANSWERED
                </span>
              )}
              <span className="text-sm text-muted-foreground">({q.marks} marks)</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <h5 className="font-semibold text-foreground mb-2">Student&apos;s Answer</h5>
                <div className="bg-muted/50 p-3 rounded-md max-h-48 overflow-y-auto text-sm text-muted-foreground">
                  {isUnanswered ? (
                    <p>No answer provided.</p>
                  ) : (
                    <>
                      {(q.type === 'TEXT' || q.type === 'SHORT_ANSWER' || q.type === 'LONG_ANSWER') && (
                        <p>{studentAnswer}</p>
                      )}
                      {q.type === 'MCQ' && (
                        <p>Selected: {q.options[studentAnswer]}</p>
                      )}
                      {(q.type === 'FILE' || q.type === 'MEDIA' || q.type === 'FILE_UPLOAD') && (
                        <MediaFileViewer submissionId={submission.submission_id} questionIndex={index} answer={studentAnswer} openMediaViewer={openMediaViewer} />
                      )}
                    </>
                  )}
                </div>
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
                  disabled={areFieldsDisabled}
                />
                {scoreErrors[index] && <p className="text-red-500 text-xs mt-1">{scoreErrors[index]}</p>}
              </div>
            </div>

            {q.competencyIds && q.competencyIds.length > 0 && (
              <div className="mt-4 pt-4 border-t border-dashed border-border">
                <h5 className="font-semibold text-foreground mb-2 flex items-center">
                  <BookOpenIcon className="h-5 w-5 mr-2 text-muted-foreground"/>
                  Associated Competencies
                </h5>
                <div className="space-y-2">
                  {q.competencyIds.map(cId => (
                    <label key={cId} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                      <input
                        type="checkbox"
                        checked={competencyEvidence[index]?.[cId] || false}
                        onChange={(e) => handleCompetencyChange(index, cId, e.target.checked)}
                        disabled={areFieldsDisabled}
                        className="form-checkbox h-5 w-5 text-primary border-border rounded focus:ring-primary disabled:opacity-50"
                      />
                      <span className="text-foreground">{getCompetencyName(cId)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-foreground">Overall Feedback / Notes</label>
            <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows="4" className="mt-1 block w-full border border-border rounded-md shadow-sm bg-background p-2" disabled={areFieldsDisabled}></textarea>
          </div>
          <div className="flex flex-col justify-between">
            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <h4 className="text-lg font-semibold text-foreground">Total Score</h4>
              <p className="text-3xl font-bold text-primary">{totalScore} / {totalMarks}</p>
            </div>
            
            {submission.assessment.group === 'SUMMATIVE' ? (
              <div className="flex gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => handleGradeAction(false)}
                  disabled={!!submission.gradedAt || hasErrors}
                  className="w-full bg-secondary text-secondary-foreground font-bold py-2 px-4 rounded-md hover:bg-secondary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                >
                  Save as Provisional Grade
                </button>
                <button
                  type="button"
                  onClick={handleFinalizeClick}
                  disabled={!!submission.gradedAt || hasErrors}
                  className="w-full bg-primary text-primary-foreground font-bold py-2 px-4 rounded-md hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                >
                  Grade and Finalize
                </button>
              </div>
            ) : (
              (isEditing || !submission.gradedAt) && (
                <div className="flex gap-4 mt-4">
                  <button
                    type="button"
                    onClick={() => handleGradeAction(false)}
                    disabled={hasErrors}
                    className="w-full bg-primary text-primary-foreground font-bold py-2 px-4 rounded-md hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
                  >
                    {submission.gradedAt ? 'Update Grade' : 'Submit Grade'}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="w-full bg-muted text-muted-foreground font-bold py-2 px-4 rounded-md hover:bg-muted/90"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
      <ConfirmSaveChangesModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmFinalize}
        title="Finalize Grade"
        message="Are you sure you want to finalize and issue the on-chain credential? This action can&apos;t be undone."
      />
      <MediaViewerModal
        isOpen={isMediaModalOpen}
        mediaUrl={selectedMediaUrl}
        mediaType={selectedMediaType}
        onClose={closeMediaModal}
      />
    </div>
  );
};

export default GradeSubmissions;