import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Select from 'react-select';
import { useTheme } from 'next-themes';
import { getModulesForCourse, getCourse } from '../../../../lib/api';
import { customStyles } from '../../../../styles/react-select-styles';
import { BookOpenIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const CourseModulesPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const [modules, setModules] = useState([]);
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    console.log('useEffect triggered. id:', id);
    if (id) {
      const fetchModules = async () => {
        try {
          console.log('Fetching modules and course for id:', id);
          const [modulesResponse, courseResponse] = await Promise.all([
            getModulesForCourse(id, page, limit, searchQuery),
            getCourse(id),
          ]);
          console.log('modulesResponse:', modulesResponse);
          console.log('courseResponse:', courseResponse);
          setModules(modulesResponse.data);
          setTotal(modulesResponse.total);
          setCourse(courseResponse);
        } catch (err) {
          console.error('Error fetching data:', err);
          setError(err.message || 'Failed to fetch data');
        } finally {
          setIsLoading(false);
          console.log('setIsLoading(false) called.');
        }
      };
      fetchModules();
    } else {
      console.log('id is not yet available.');
    }
  }, [id, page, limit, searchQuery]);

  const handleSearch = (selectedOption) => {
    setSearchQuery(selectedOption ? selectedOption.value : '');
    setPage(1);
  };

  if (isLoading) {
    return <p className="text-muted-foreground">Loading modules...</p>;
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  return (
    <>
      <div className="flex items-center mb-6">
        <Link href="/admin/courses" legacyBehavior>
          <a className="mr-4 text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="h-6 w-6" />
          </a>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Modules for {course?.name}</h1>
          <p className="text-muted-foreground">{course?.code}</p>
        </div>
      </div>

      <div className="flex justify-end gap-4 mb-6">
        <div className="w-1/3">
          <Select
            styles={customStyles}
            options={modules.map(module => ({ value: module.title, label: module.title }))}
            isClearable
            placeholder="Search for a module..."
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="bg-card shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Code</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {modules.map((module) => (
              <tr key={module.module_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{module.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{module.moduleCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* Add actions here */}
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

export default CourseModulesPage;
