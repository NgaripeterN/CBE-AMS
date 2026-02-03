import { useState, useEffect } from 'react';
import api from '../../lib/api';
import CredentialCard from '../../components/CredentialCard';
import CollapsibleSection from '../../components/CollapsibleSection';
import { motion, AnimatePresence } from 'framer-motion';

const Wallet = () => {
  const [walletData, setWalletData] = useState({ microCredentials: [], courseCredentials: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('micro');

  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/student/wallet');
        setWalletData(res.data);
      } catch (err) {
        setError('Failed to fetch wallet data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWalletData();
  }, []);

  const handleUpdateCredential = (id, updatedData) => {
    const update = (creds) => creds.map(c => c.id === id ? { ...c, ...updatedData } : c);
    setWalletData(prev => ({
        ...prev,
        microCredentials: update(prev.microCredentials),
        courseCredentials: update(prev.courseCredentials),
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Error</h2>
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  const { microCredentials, courseCredentials } = walletData;

  // Group micro-credentials by Year, then Semester
  const groupedByYear = microCredentials.reduce((acc, cred) => {
    const year = cred.module?.yearOfStudy || 'Unknown Year';
    const semester = cred.module?.semesterOfStudy || 'Unknown Semester';

    if (!acc[year]) {
      acc[year] = {};
    }
    if (!acc[year][semester]) {
      acc[year][semester] = [];
    }
    acc[year][semester].push(cred);
    return acc;
  }, {});

  // Sort Years
  const sortedYears = Object.keys(groupedByYear).sort((a, b) => {
    if (a === 'Unknown Year') return 1;
    if (b === 'Unknown Year') return -1;
    return a - b;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen text-foreground">
      <header className="bg-gradient-to-r from-primary to-secondary text-primary-foreground py-10 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1 
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            My Credentials Wallet
          </motion.h1>
          <motion.p 
            className="mt-4 max-w-3xl text-lg sm:text-xl text-primary-foreground/80"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            A secure and verifiable record of your achievements.
          </motion.p>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto pb-1">
            <TabButton title="Micro-Credentials" activeTab={activeTab} setActiveTab={() => setActiveTab('micro')} />
            <TabButton title="Course Credentials" activeTab={activeTab} setActiveTab={() => setActiveTab('course')} />
          </div>
        </div>

        <AnimatePresence mode='wait'>
          {activeTab === 'micro' && (
            <motion.div
              key="micro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {sortedYears.length > 0 ? (
                sortedYears.map((year, yearIndex) => (
                  <div key={year} className="space-y-4">
                    <h3 className="text-2xl font-bold text-foreground pl-1 border-l-4 border-primary/50">
                      {year === 'Unknown Year' ? 'Other' : `Year ${year}`}
                    </h3>
                    
                    {Object.keys(groupedByYear[year])
                      .sort((a, b) => {
                         if (a === 'Unknown Semester') return 1;
                         if (b === 'Unknown Semester') return -1;
                         return a - b;
                      })
                      .map((semester, semIndex) => (
                      <CollapsibleSection 
                        key={`${year}-${semester}`} 
                        title={
                          <div className="flex items-center gap-2">
                             <span className="text-muted-foreground font-medium">
                               {semester === 'Unknown Semester' ? 'Other' : `Semester ${semester}`}
                             </span>
                             <span className="bg-primary/10 px-2 py-0.5 rounded text-xs font-semibold text-primary">
                               {groupedByYear[year][semester].length} Credentials
                             </span>
                          </div>
                        }
                        defaultOpen={yearIndex === sortedYears.length - 1} // Open semesters of the latest year by default
                      >
                        <div className="pt-4">
                            <motion.div 
                              className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                              variants={containerVariants}
                              initial="hidden"
                              animate="visible"
                            >
                              {groupedByYear[year][semester].map((credential) => (
                                <motion.div key={credential.id} variants={itemVariants} className="h-full">
                                  <CredentialCard credential={credential} onUpdate={handleUpdateCredential} />
                                </motion.div>
                              ))}
                            </motion.div>
                        </div>
                      </CollapsibleSection>
                    ))}
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                  <p className="text-muted-foreground text-lg">No micro-credentials earned yet.</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'course' && (
            <motion.div
              key="course"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-12"
            >
              {courseCredentials.length > 0 ? (
                courseCredentials.map((courseCred) => (
                  <motion.div key={courseCred.id} variants={containerVariants} initial="hidden" animate="visible">
                    <motion.div variants={itemVariants}>
                      <CredentialCard credential={courseCred} onUpdate={handleUpdateCredential} isCourse />
                    </motion.div>
                    <div className="relative mt-8 ml-2 sm:ml-12 pl-6 sm:pl-8 border-l-2 border-primary/20">
                      <div className="absolute -left-4 top-2 w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path></svg>
                      </div>
                      <h3 className="text-2xl font-semibold mb-6 text-primary">Evidence (Micro-Credentials)</h3>
                      <motion.div 
                        className="grid gap-6 grid-cols-1 lg:grid-cols-2"
                        variants={containerVariants}
                      >
                        {microCredentials
                          .filter(mc => (courseCred.evidenceMicroCredentialIds || []).includes(mc.id))
                          .map(microCred => (
                            <motion.div key={microCred.id} variants={itemVariants}>
                              <CredentialCard credential={microCred} onUpdate={handleUpdateCredential} />
                            </motion.div>
                          ))}
                      </motion.div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-16 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                  <p className="text-muted-foreground text-lg">No course credentials earned yet.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const TabButton = ({ title, activeTab, setActiveTab }) => {
    const isActive = activeTab === title.toLowerCase().replace('-', '');
    return (
      <button 
        onClick={setActiveTab} 
        className={`px-4 py-2 text-lg font-medium transition-colors relative`}
      >
        <span className={`${isActive ? 'text-primary-500' : 'text-gray-500 dark:text-gray-300'}`}>{title}</span>
        {isActive && (
          <motion.div 
            className="absolute bottom-0 left-0 h-1 bg-primary-500 rounded-full"
            layoutId="underline-wallet"
          />
        )}
      </button>
    )
  }

export default Wallet;
