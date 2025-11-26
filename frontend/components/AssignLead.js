import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import { useTheme } from 'next-themes';
import { getCourses, getAssessors, getCourseLeads, assignLeadToCourse } from '../lib/api';
import { customStyles } from '../styles/react-select-styles';
import { PencilIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const AssignLead = () => {
  const [courses, setCourses] = useState([]);
  const [assessors, setAssessors] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedAssessor, setSelectedAssessor] = useState(null);
  const [error, setError] = useState(null);
  const [courseLeads, setCourseLeads] = useState([]);
  const [isChanging, setIsChanging] = useState(false);
  const { theme } = useTheme();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchCoursesAndAssessors = async () => {
    try {
      const coursesData = await getCourses();
      const assessorsData = await getAssessors();
      setCourses(coursesData.data);
      setAssessors(assessorsData.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchCourseLeads = useCallback(async () => {
    try {
      const courseLeadsData = await getCourseLeads(page, limit);
      setCourseLeads(courseLeadsData.data);
      setTotal(courseLeadsData.total);
    } catch (err) {
      setError(err.message);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchCoursesAndAssessors();
    fetchCourseLeads();
  }, [fetchCourseLeads]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await assignLeadToCourse(selectedCourse.value, selectedAssessor.value);
      toast.success(`Lead ${isChanging ? 'changed' : 'assigned'} successfully`);
      fetchCourseLeads();
      setSelectedCourse(null);
      setSelectedAssessor(null);
      setIsChanging(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'An error occurred while assigning the lead.');
    }
  };

  const handleChangeClick = (courseId) => {
    const course = courses.find(c => c.course_id === courseId);
    setSelectedCourse({ value: course.course_id, label: course.name });
    setIsChanging(true);
  };

  const courseOptions = courses.map(course => ({
    value: course.course_id,
    label: course.name,
  }));

  const assessorOptions = assessors.map(assessor => ({
    value: assessor.id,
    label: assessor.user.name,
  }));

  return (
    <>
      <h1 className="text-3xl font-bold mb-6 text-foreground">{isChanging ? 'Change' : 'Assign'} Lead to Course</h1>
      {error && <p className="text-destructive mb-4">{error}</p>}
      <div className="bg-card p-6 shadow-sm rounded-lg mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Course</label>
            <Select
              styles={customStyles}
              options={courseOptions}
              value={selectedCourse}
              onChange={setSelectedCourse}
              isDisabled={isChanging}
              isClearable
              placeholder="Select a course"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Assessor</label>
            <Select
              styles={customStyles}
              options={assessorOptions}
              value={selectedAssessor}
              onChange={setSelectedAssessor}
              isClearable
              placeholder="Select an assessor"
            />
          </div>
          <div className="flex justify-end space-x-2">
            {isChanging && <button type="button" onClick={() => { setIsChanging(false); setSelectedCourse(null); }} className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80">Cancel</button>}
            <button type="submit" className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" />
              {isChanging ? 'Change' : 'Assign'} Lead
            </button>
          </div>
        </form>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Assigned Leads</h2>
      <div className="bg-card shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Course</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Lead Assessor</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {courseLeads.map((lead) => (
              <tr key={lead.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{lead.course.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{lead.assessor.user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleChangeClick(lead.courseId)} className="text-primary hover:text-primary/90">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div>
          <span className="text-sm text-muted-foreground">
            Showing {Math.min((page - 1) * limit + 1, total)} to {Math.min(page * limit, total)} of {total} results
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="inline-flex items-center px-4 py-2 bg-muted text-muted-foreground rounded-md shadow-sm hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page * limit >= total}
            className="inline-flex items-center px-4 py-2 bg-muted text-muted-foreground rounded-md shadow-sm hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
};

export default AssignLead;
