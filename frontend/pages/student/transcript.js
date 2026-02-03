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
        const hasCourseCredential = transcriptRes.data.courseSummaries && transcriptRes.data.courseSummaries.length > 0;

        let yearOptions = years.map(year => ({ value: year, label: `Year ${year}` }));
        
        if (hasCourseCredential && years.length > 0) {
          yearOptions.unshift({ value: 'all', label: 'Combined (All Years)' });
        }

        setAvailableTranscriptYears(yearOptions);

        if (yearOptions.length > 0) {
          setSelectedYear(yearOptions[0]);
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
      const isCombined = selectedYear.value === 'all';
      const yearParam = isCombined ? '' : selectedYear.value;
      const url = `/student/transcript?${yearParam ? `year=${yearParam}&` : ''}format=${formatType}`;
      
      const config = {
          responseType: formatType === 'pdf' ? 'blob' : 'json'
      };

      const response = await api.get(url, config);

      const filename = isCombined
        ? `Transcript_Combined_${String(user?.name || 'Student')}.${String(formatType)}`
        : `Transcript_Year_${String(yearParam)}_${String(user?.name || 'Student')}.${String(formatType)}`;

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
      toast.success(`${isCombined ? 'Combined Transcript' : `Transcript for Year ${selectedYear.value}`} downloaded successfully as ${String(formatType).toUpperCase()}!`);
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
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-8 text-foreground tracking-tight">Academic Transcript</h1>
      
      <div className="bg-card p-6 sm:p-8 rounded-2xl shadow-xl border border-border">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-10">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-foreground">Download Options</h2>
            <p className="text-muted-foreground mt-2 text-lg">Select an academic year and format to download your official transcript.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
            <div className="w-full sm:w-64">
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
            
            <div className="relative w-full sm:w-auto">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed h-[42px]"
                disabled={!selectedYear || availableTranscriptYears.length === 0}
              >
                <FiDownload size={20} />
                <span>Download</span>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-full sm:w-48 bg-card rounded-xl shadow-2xl py-2 z-50 border border-border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => handleDownloadTranscript('json')}
                    className="block w-full text-left px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Download JSON
                  </button>
                  <div className="h-px bg-border mx-2" />
                  <button
                    onClick={() => handleDownloadTranscript('pdf')}
                    className="block w-full text-left px-5 py-3.5 text-sm font-semibold text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    Download PDF
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-8">
            <h3 className="text-xl font-bold text-foreground mb-6">What&apos;s included in the transcript?</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-start gap-3">
                    <div className="mt-1 bg-primary/10 p-1 rounded-full">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <div>
                        <p className="font-semibold text-foreground">Detailed Scores</p>
                        <p className="text-sm text-muted-foreground mt-1">Comprehensive breakdown of module scores and descriptors.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="mt-1 bg-primary/10 p-1 rounded-full">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <div>
                        <p className="font-semibold text-foreground">Competencies</p>
                        <p className="text-sm text-muted-foreground mt-1">Verified course performance and demonstrated achievements.</p>
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <div className="mt-1 bg-primary/10 p-1 rounded-full">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <div>
                        <p className="font-semibold text-foreground">Official Validation</p>
                        <p className="text-sm text-muted-foreground mt-1">Official registrar signature and secure digital seal (PDF).</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptPage;
