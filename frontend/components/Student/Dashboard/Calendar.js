import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import api from '../../../lib/api';
import { useTheme } from 'next-themes';
import { format } from 'date-fns';

const StudentCalendar = () => {
    const [assessments, setAssessments] = useState([]);
    const [error, setError] = useState('');
    const { theme } = useTheme();
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedDateAssessments, setSelectedDateAssessments] = useState([]);

    useEffect(() => {
        const fetchAssessments = async () => {
            try {
                const res = await api.get('/student/assessments');
                setAssessments(res.data);
            } catch (err) {
                setError('Failed to fetch assessments.');
            }
        };
        fetchAssessments();
    }, []);

    const handleDateClick = (date) => {
        // Toggle off if the same date is clicked again
        if (selectedDate && date.getTime() === selectedDate.getTime()) {
            setSelectedDate(null);
            setSelectedDateAssessments([]);
        } else {
            const dateString = date.toISOString().split('T')[0];
            const assessmentsForDay = assessments.filter(assessment => {
                if (!assessment.deadline) return false;
                const deadlineDate = new Date(assessment.deadline).toISOString().split('T')[0];
                return deadlineDate === dateString;
            });
            setSelectedDate(date);
            setSelectedDateAssessments(assessmentsForDay);
        }
    };

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const dateString = date.toISOString().split('T')[0];
            const hasPendingAssessment = assessments.some(assessment => {
                if (!assessment.deadline) return false;
                const deadlineDate = new Date(assessment.deadline).toISOString().split('T')[0];
                const isPending = !assessment.submission || !assessment.submission.grade;
                return deadlineDate === dateString && isPending;
            });

            if (hasPendingAssessment) {
                return 'deadline-highlight';
            }
        }
        return null;
    };

    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dateString = date.toISOString().split('T')[0];
            const hasPendingAssessment = assessments.some(assessment => {
                 if (!assessment.deadline) return false;
                const deadlineDate = new Date(assessment.deadline).toISOString().split('T')[0];
                const isPending = !assessment.submission || !assessment.submission.grade;
                return deadlineDate === dateString && isPending;
            });

            if (hasPendingAssessment) {
                return <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-destructive rounded-full"></div>;
            }
        }
        return null;
    }


    return (
        <div className="bg-card p-4 rounded-xl shadow-lg dark:shadow-dark-lg border border-primary/70">
            <h2 className="text-xl font-bold mb-2 text-foreground">Upcoming Deadlines</h2>
            {error && <p className="text-destructive">{error}</p>}
            <div>
                 <Calendar
                    onClickDay={handleDateClick}
                    tileClassName={tileClassName}
                    tileContent={tileContent}
                    className="border-none !text-xs"
                />
            </div>
             <div className="mt-4">
                {selectedDate ? (
                    <>
                        <h3 className="text-lg font-bold text-foreground mb-2">
                            Assessments for {format(selectedDate, 'MMM dd')}
                        </h3>
                        <ul className="space-y-2">
                            {selectedDateAssessments.length > 0 ? (
                                selectedDateAssessments.map(assessment => (
                                    <li key={assessment.assessment_id} className="text-sm text-muted-foreground">
                                        <div className="flex justify-between">
                                                                                <span>{assessment.title}</span>
                                                                                <span>By {format(new Date(assessment.deadline), 'p')}</span>
                                                                            </div>                                    </li>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No assessments for this day.</p>
                            )}
                        </ul>
                    </>
                ) : (
                    <div className="text-sm text-muted-foreground text-center pt-4">
                        <p>Click a date to see assessments.</p>
                        <p className="flex items-center justify-center mt-2">
                            <span className="w-2 h-2 rounded-full bg-destructive inline-block mr-1"></span>
                            Indicates a deadline.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentCalendar;