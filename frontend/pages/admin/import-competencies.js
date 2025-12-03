import { useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { ArrowLeftIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const ImportCompetenciesPage = () => {
  const router = useRouter();
  const [fileToUpload, setFileToUpload] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileToUpload(e.dataTransfer.files[0]);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!fileToUpload) {
      toast.error('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('competenciesCsv', fileToUpload);
    setIsUploading(true);

    const promise = api.post('/competencies/bulk-import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    toast.promise(promise, {
      loading: 'Importing competencies...',
      success: (res) => {
        setIsUploading(false);
        router.push('/admin/competencies');
        return res.data.message || 'Import successful.';
      },
      error: (err) => {
        setIsUploading(false);
        return err.response?.data?.error || 'Failed to import competencies.';
      },
    });
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <div className="mb-6">
          <button onClick={() => router.push('/admin/competencies')} className="inline-flex items-center px-4 py-2 bg-muted text-muted-foreground rounded-md shadow-sm hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring">
            <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
            Back to Competencies
          </button>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-6 text-center">Import Competencies from CSV</h1>
        
        <div className="bg-card rounded-lg shadow-md p-8">
          <div className="prose prose-sm max-w-none text-muted-foreground mb-6">
            <h2 className="text-foreground">Instructions</h2>
            <p>
              Upload a CSV file to bulk-import competencies. The file must have the following columns in order:
            </p>
            <ul>
              <li><strong><code>name</code></strong>: The name of the competency (must be unique).</li>
              <li><strong><code>category</code></strong>: The category to group the competency under.</li>
              <li><strong><code>description</code></strong>: A brief description of the competency (optional).</li>
              <li><strong><code>associatedCourseCodes</code></strong>: A semicolon-separated list of course codes to associate with this competency (e.g., &quot;CS101;ENG202&quot;) (optional).</li>
            </ul>
            <p>
              <strong>Note:</strong> If a competency with the same name already exists, it will be skipped.
            </p>
          </div>
          <form onSubmit={handleImportSubmit} onDragEnter={handleDrag} className="mt-4 space-y-4">
            <label 
              htmlFor="file-upload" 
              className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <ArrowUpTrayIcon className={`w-10 h-10 mb-3 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
                <p className={`mb-2 text-sm ${dragActive ? "text-primary" : "text-muted-foreground"}`}>
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground/80">CSV file (max. 2MB)</p>
                {fileToUpload && <p className="mt-4 text-sm font-medium text-green-500">{fileToUpload.name}</p>}
              </div>
              <input 
                id="file-upload"
                type="file" 
                name="competenciesCsv" 
                accept=".csv"
                onChange={handleFileChange} 
                className="hidden"
              />
            </label>
            {dragActive && <div className="absolute inset-0 w-full h-full" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div>}

            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={!fileToUpload || isUploading}
                className="inline-flex items-center px-6 py-2 bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                <ArrowUpTrayIcon className="-ml-1 mr-2 h-5 w-5" />
                {isUploading ? 'Uploading...' : 'Upload and Import'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ImportCompetenciesPage;