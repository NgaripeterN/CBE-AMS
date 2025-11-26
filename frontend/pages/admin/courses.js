import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getCourses, createCourse, updateCourse, deleteCourse } from '../../lib/api';
import { customStyles } from '../../styles/react-select-styles';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', category: '', description: '' });
  const { theme } = useTheme();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  const fetchCourses = useCallback(async () => {
    try {
      const data = await getCourses(searchQuery, page, limit);
      setCourses(data.data);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    }
  }, [searchQuery, page, limit]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      toast.error('Name and code are required');
      return;
    }

    const promise = currentCourse
      ? updateCourse(currentCourse.course_id, formData)
      : createCourse(formData);

    toast.promise(promise, {
      loading: 'Saving course...',
      success: () => {
        fetchCourses();
        setIsModalOpen(false);
        return currentCourse ? 'Course updated successfully.' : 'Course created successfully.';
      },
      error: (err) => {
        return err.message || 'Failed to save course.';
      },
    });
  };

  const openModal = (e, course = null) => {
    e.stopPropagation();
    setCurrentCourse(course);
    setFormData(course ? { name: course.name, code: course.code, category: course.category, description: course.description } : { name: '', code: '', category: '', description: '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setIsDeleteModalOpen(true);
    setCurrentCourse(courses.find(c => c.course_id === id));
  };

  const confirmDelete = async () => {
    if (!currentCourse) return;

    const promise = deleteCourse(currentCourse.course_id);

    toast.promise(promise, {
      loading: 'Deleting course...',
      success: () => {
        fetchCourses();
        setIsDeleteModalOpen(false);
        setCurrentCourse(null);
        return 'Course deleted successfully.';
      },
      error: (err) => {
        return err.message || 'Failed to delete course.';
      },
    });
  };

  const courseOptions = courses.map(course => ({
    value: course.course_id,
    label: `${course.name} (${course.code})`
  }));

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Course Management</h1>
        <div className="flex space-x-2">
          <Link href="/admin/import-courses" className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md shadow-sm hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary">
            Import Courses
          </Link>
          <button onClick={(e) => openModal(e)} className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Course
          </button>
        </div>
      </div>
      <div className="mb-4">
        <Select
          styles={customStyles}
          options={courseOptions}
          onChange={option => setSearchQuery(option ? option.label : '')}
          onInputChange={inputValue => setSearchQuery(inputValue)}
          isClearable
          placeholder="Search for a course..."
        />
      </div>
      {error && <p className="text-destructive mb-4">{error}</p>}
      <div className="bg-card shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Code</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {courses.map((course) => (
              <tr key={course.course_id} onClick={() => router.push(`/admin/courses/${course.course_id}/modules`)} className="cursor-pointer hover:bg-muted/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{course.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{course.code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{course.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={(e) => openModal(e, course)} className="text-primary hover:text-primary/90 mr-4">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button onClick={(e) => handleDelete(e, course.course_id)} className="text-destructive hover:text-destructive/90">
                    <TrashIcon className="h-5 w-5" />
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium leading-6 text-foreground">{currentCourse ? 'Edit Course' : 'Add Course'}</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="Name" className="w-full p-2 border rounded bg-input text-foreground border-border" />
              <input type="text" name="code" value={formData.code} onChange={handleFormChange} placeholder="Code" className="w-full p-2 border rounded bg-input text-foreground border-border" />
              <input type="text" name="category" value={formData.category} onChange={handleFormChange} placeholder="Category" className="w-full p-2 border rounded bg-input text-foreground border-border" />
              <textarea name="description" value={formData.description} onChange={handleFormChange} placeholder="Description" className="w-full p-2 border rounded bg-input text-foreground border-border" />
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium leading-6 text-destructive">Confirm Deletion</h3>
            <div className="mt-4 space-y-4">
              <p>Are you sure you want to delete the course &quot;{currentCourse?.name}&quot;?</p>
              <p className="text-sm text-muted-foreground">This action is irreversible and will result in the following:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>All associated modules will be deleted.</li>
                <li>All student enrollments will be removed.</li>
                <li>All issued credentials for this course will be invalidated.</li>
              </ul>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80">Cancel</button>
              <button type="button" onClick={confirmDelete} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90">Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseManagement;
