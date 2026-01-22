import { useState, useEffect } from 'react';
import api from '../../lib/api';
import useAuth from '../../hooks/useAuth';
import Select from 'react-select';
import toast from 'react-hot-toast';
import { FiDownload } from 'react-icons/fi';
import { customStyles } from '../../styles/react-select-styles';

const TranscriptPage = () => {
  const { user, loading } = useAuth();
  const [availableTranscriptYears, setAvailableTranscriptYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchTranscriptYears = async () => {
      try {
        const transcriptRes = await api.get('/student/transcript');
        const years = Object.keys(transcriptRes.data.yearlySummary).sort((a, b) => b - a);
        setAvailableTranscriptYears(years.map(year => ({ value: year, label: `Year ${year}` })));
        if (years.length > 0) {
          setSelectedYear({ value: years[0], label: `Year ${years[0]}` });
        }
      } catch (err) {
        console.error('Failed to fetch transcript years', err);
        toast.error('Failed to load available transcript years.');
      }
    };
    fetchTranscriptYears();
  }, []);

  const handleDownloadTranscript = async (formatType) => {
    if (!selectedYear) {
      toast.error('Please select a year to download the transcript.');
      return;
    }

    try {
      const yearParam = selectedYear.value;
      const url = `/student/transcript?year=${yearParam}&format=${formatType}`;
      
      const config = {
          responseType: formatType === 'pdf' ? 'blob' : 'json'
      };

      const response = await api.get(url, config);

      const filename = `Transcript_Year_${String(yearParam)}_${String(user?.name || 'Student')}.${String(formatType)}`;

      if (formatType === 'pdf') {
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else { // JSON download
        const jsonStr = JSON.stringify(response.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      toast.success(`Transcript for Year ${selectedYear.value} downloaded successfully as ${String(formatType).toUpperCase()}!`);
    } catch (err) {
      console.error('Error downloading transcript:', err);
      let errorMessage = 'Failed to download transcript.';

      if (err.response) {
          if (err.response.data instanceof Blob) {
              const errorBlob = err.response.data;
              const reader = new FileReader();
              reader.onload = async (e) => {
                  const text = e.target.result;
                  try {
                      const errorJson = JSON.parse(text);
                      errorMessage = errorJson.message || errorJson.error || errorMessage;
                  } catch (parseError) {
                      errorMessage = text || errorMessage;
                  }
                  toast.error(errorMessage);
              };
              reader.readAsText(errorBlob);
              return;
          } else if (err.response.data && err.response.data.message) {
              errorMessage = err.response.data.message;
          } else if (err.response.data && err.response.data.error) {
              errorMessage = err.response.data.error;
          }
      }
      toast.error(errorMessage);
    } finally {
      setIsDropdownOpen(false);
    }
  };

  if (loading) {
    return <p>Loading user data...</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Academic Transcript</h1>
      
      <div className="bg-card p-6 rounded-xl shadow-lg border border-border">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-semibold text-foreground">Download Options</h2>
            <p className="text-muted-foreground mt-1">Select an academic year and format to download your official transcript.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-48">
              <Select
                options={availableTranscriptYears}
                value={selectedYear}
                onChange={setSelectedYear}
                isClearable={false}
                isSearchable={false}
                placeholder="Select Year"
                styles={customStyles}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
              />
            </div>
            
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="btn btn-primary flex items-center gap-2 px-6 py-2.5"
                disabled={!selectedYear || availableTranscriptYears.length === 0}
              >
                <FiDownload size={18} />
                Download
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-xl py-1 z-50 border border-gray-200 dark:border-gray-700 ring-1 ring-black ring-opacity-5">
                  <button
                    onClick={() => handleDownloadTranscript('json')}
                    className="block w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Download JSON
                  </button>
                  <button
                    onClick={() => handleDownloadTranscript('pdf')}
                    className="block w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Download PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
            <h3 className="text-lg font-medium text-foreground mb-4">What's included in the transcript?</h3>
            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Detailed module scores and descriptors.</li>
                <li>Overall course performance and demonstrated competencies.</li>
                <li>Official registrar signature and seal (PDF only).</li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default TranscriptPage;
