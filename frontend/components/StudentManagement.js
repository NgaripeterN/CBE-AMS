import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import toast from 'react-hot-toast';
import { getStudents, createStudent, updateStudent, deleteStudent, getCourses } from '../lib/api';
import { customStyles } from '../styles/react-select-styles';
import { PlusIcon, PencilIcon, TrashIcon, ArrowUpTrayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', regNumber: '', program: '' });
  const { theme } = useTheme();
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchStudents = useCallback(async () => {
    try {
      const data = await getStudents(searchQuery, page, limit);
      setStudents(data.data);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    }
  }, [searchQuery, page, limit]);

  useEffect(() => {
    fetchStudents();
    fetchCourses();
  }, [fetchStudents]);

  const fetchCourses = async () => {
    try {
      const data = await getCourses();
      setCourses(data.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleProgramChange = (selectedOption) => {
    setFormData({ ...formData, program: selectedOption ? selectedOption.value : '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (currentStudent && !formData.program) {
      toast.error('Program cannot be empty for a student.');
      return;
    }
    if (!currentStudent) {
      const { name, email, regNumber, program } = formData;
      if (!name || !email || !regNumber || !program) {
        toast.error('Please fill in all fields.');
        return;
      }
    }

    const promise = currentStudent
      ? updateStudent(currentStudent.user.user_id, formData)
      : createStudent(formData);

    toast.promise(promise, {
      loading: 'Saving student...',
      success: () => {
        fetchStudents();
        setIsModalOpen(false);
        return currentStudent ? 'Student updated successfully.' : 'Student created successfully.';
      },
      error: (err) => {
        return err.message || 'Failed to save student.';
      },
    });
  };

  const openModal = (student = null) => {
    setCurrentStudent(student);
    setFormData(student ? { name: student.user.name, email: student.user.email, regNumber: student.user.regNumber, program: student.user.program } : { name: '', email: '', regNumber: '', program: '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    setIsDeleteModalOpen(true);
    setCurrentStudent(students.find(s => s.user.user_id === id));
  };

  const confirmDelete = async () => {
    if (!currentStudent) return;

    const promise = deleteStudent(currentStudent.user.user_id);

    toast.promise(promise, {
      loading: 'Deleting student...',
      success: () => {
        fetchStudents();
        setIsDeleteModalOpen(false);
        setCurrentStudent(null);
        return 'Student deleted successfully.';
      },
      error: (err) => {
        return err.message || 'Failed to delete student.';
      },
    });
  };

  const studentOptions = students.map(student => ({
    value: student.user.user_id,
    label: `${student.user.name} (${student.user.email})`
  }));

  const programOptions = courses.map(course => ({
    value: course.name,
    label: course.name
  }));

  return (
    <>
      <div className="mb-6">
        <button onClick={() => router.push('/admin/users')} className="inline-flex items-center px-4 py-2 bg-muted text-muted-foreground rounded-md shadow-sm hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring">
          <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
          Back
        </button>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Student Management</h1>
        <div className="flex gap-4">
          <Link href="/admin/import-users" legacyBehavior>
            <a className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground rounded-md shadow-sm hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary">
              <ArrowUpTrayIcon className="-ml-1 mr-2 h-5 w-5" />
              Import Students
            </a>
          </Link>
          <button onClick={() => openModal()} className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Student
          </button>
        </div>
      </div>
      <div className="mb-4">
        <Select
          styles={customStyles}
          options={studentOptions}
          onChange={option => setSearchQuery(option ? option.label : '')}
          onInputChange={inputValue => setSearchQuery(inputValue)}
          isClearable
          placeholder="Search for a student..."
        />
      </div>
      {error && <p className="text-destructive mb-4">{error}</p>}
      <div className="bg-card shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Registration Number</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Program</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.map((student) => (
              student.user && (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{student.user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{student.user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{student.user.regNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{student.user.program}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openModal(student)} className="text-primary hover:text-primary/90 mr-4">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(student.user.user_id)} className="text-destructive hover:text-destructive/90">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              )
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
            <h3 className="text-lg font-medium leading-6 text-foreground">{currentStudent ? 'Edit Student' : 'Add Student'}</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="Name" className="w-full p-2 border rounded bg-input text-foreground border-border" />
              <input type="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="Email" className="w-full p-2 border rounded bg-input text-foreground border-border" />
              <input type="text" name="regNumber" value={formData.regNumber} onChange={handleFormChange} placeholder="Registration Number" className="w-full p-2 border rounded bg-input text-foreground border-border" />
              <Select
                styles={customStyles}
                options={programOptions}
                onChange={handleProgramChange}
                value={programOptions.find(option => option.value === formData.program)}
                placeholder="Select a program..."
              />
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
              <p>Are you sure you want to delete the student &quot;{currentStudent?.user.name}&quot;?</p>
              <p className="text-sm text-muted-foreground">This action is irreversible and will result in the following:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>All enrollments for this student will be removed.</li>
                <li>All submissions and credentials for this student will be deleted.</li>
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

export default StudentManagement;
