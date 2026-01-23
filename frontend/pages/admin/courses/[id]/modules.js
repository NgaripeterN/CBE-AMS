import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Select from 'react-select';
import { useTheme } from 'next-themes';
import toast from 'react-hot-toast';
import api, { getModulesForCourse, getCourse } from '../../../../lib/api';
import { customStyles } from '../../../../styles/react-select-styles';
import { BookOpenIcon, ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';
import CompetencySelector from '../../../../components/CompetencySelector';

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedCompetencyIds, setSelectedCompetencyIds] = useState([]);

  useEffect(() => {
    if (id) {
      const fetchModules = async () => {
        try {
          const [modulesResponse, courseResponse] = await Promise.all([
            getModulesForCourse(id, page, limit, searchQuery),
            getCourse(id),
          ]);
          setModules(modulesResponse.data);
          setTotal(modulesResponse.total);
          setCourse(courseResponse);
        } catch (err) {
          setError(err.message || 'Failed to fetch data');
        } finally {
          setIsLoading(false);
        }
      };
      fetchModules();
    }
  }, [id, page, limit, searchQuery]);

  const handleSearch = (selectedOption) => {
    setSearchQuery(selectedOption ? selectedOption.value : '');
    setPage(1);
  };

  const openCompetencyModal = (module) => {
    setSelectedModule(module);
    setSelectedCompetencyIds((module.competencies || []).map(c => c.id));
    setIsModalOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedModule) return;

    const promise = api.put(`/modules/${selectedModule.module_id}/competencies`, {
      competencyIds: selectedCompetencyIds,
    });

    toast.promise(promise, {
      loading: 'Saving competencies...',
      success: (res) => {
        // Update the local state to reflect the changes
        const updatedModules = modules.map(m =>
          m.module_id === selectedModule.module_id ? { ...m, competencies: res.data.competencies } : m
        );
        setModules(updatedModules);
        setIsModalOpen(false);
        return 'Competencies updated successfully.';
      },
      error: (err) => {
        return err.response?.data?.error || 'Failed to save competencies.';
      },
    });
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
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Competencies</th>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {module.competencies?.length || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openCompetencyModal(module)} className="text-primary hover:text-primary/90">
                    <PencilIcon className="h-5 w-5 mr-2 inline-block"/>
                    Manage Competencies
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
          <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium leading-6 text-foreground">Manage Competencies for {selectedModule?.title}</h3>
            <div className="mt-4">
              <CompetencySelector
                selectedIds={selectedCompetencyIds}
                onChange={setSelectedCompetencyIds}
                availableCompetencies={course?.competencies || []}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-border">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80">Cancel</button>
              <button type="button" onClick={handleSaveChanges} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseModulesPage;
