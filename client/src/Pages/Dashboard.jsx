import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { rankResumes, checkBackendHealth } from '../services/api';
import { exportResults } from '../utils/export';

function Dashboard() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumes, setResumes] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [expandedCandidates, setExpandedCandidates] = useState({});
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking', 'online', 'offline'
  const exportMenuRef = useRef(null);

  // Check backend health on component mount
  useEffect(() => {
    const checkBackend = async () => {
      const isHealthy = await checkBackendHealth();
      setBackendStatus(isHealthy ? 'online' : 'offline');
      if (!isHealthy) {
        setError('Backend server is not running. Please start the backend on port 8000.');
      }
    };
    checkBackend();
  }, []);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    const fileArray = Array.from(files).filter(file =>
      file.type === 'application/pdf' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    );

    setResumes(prev => [...prev, ...fileArray]);
  };

  const removeResume = (index) => {
    setResumes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!jobDescription || resumes.length === 0) {
      setError('Please provide both job description and resumes');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Call the backend API
      const response = await rankResumes(resumes, jobDescription);
      
      // Transform the backend response to match our frontend format
      const transformedResults = response.map((item) => ({
        name: item.filename,
        score: Math.round(item.match_score),
        ats_score: Math.round(item.match_score),
        // Use real scores from backend
        skills_match: Math.round(item.skills_match),
        experience_match: Math.round(item.experience_match),
        education_match: Math.round(item.education_match),
        required_skills: item.required_skills || [],
        matched_skills: item.matched_skills || [],
        missing_skills: item.missing_skills || [],
        ats_issues: item.ats_issues || [],
        ats_issues_source: item.ats_issues_source || 'rules',
        raw_score: item.match_score
      }));

      setResults(transformedResults);
      setBackendStatus('online'); // Update status on successful call
    } catch (error) {
      console.error('Error processing resumes:', error);
      
      // Determine error message based on error type
      let errorMessage = 'Failed to process resumes. ';
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        errorMessage += 'Cannot connect to backend server. Please ensure the server is running on http://127.0.0.1:8000';
        setBackendStatus('offline');
      } else if (error.response) {
        // Server responded with error
        errorMessage += error.response.data?.detail || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response
        errorMessage += 'No response from server. Please check if the backend is running.';
        setBackendStatus('offline');
      } else {
        errorMessage += error.message || 'An unknown error occurred.';
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setJobDescription('');
    setResumes([]);
    setResults(null);
    setExpandedCandidates({});
    setError(null);
    setShowExportMenu(false);
  };

  const handleExport = (format) => {
    if (results && results.length > 0) {
      exportResults(results, format);
      setShowExportMenu(false);
    }
  };

  const recheckBackend = async () => {
    setBackendStatus('checking');
    setError(null);
    const isHealthy = await checkBackendHealth();
    setBackendStatus(isHealthy ? 'online' : 'offline');
    if (!isHealthy) {
      setError('Backend server is not running. Please start the backend on http://127.0.0.1:8000');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-blue-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getScoreGradient = (score) => {
    if (score >= 90) return 'from-green-500 to-emerald-500';
    if (score >= 75) return 'from-blue-500 to-cyan-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-orange-500 to-red-500';
  };

  const toggleCandidateDetails = (index) => {
    setExpandedCandidates((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getAtsIssues = (candidate) => {
    if (Array.isArray(candidate.ats_issues) && candidate.ats_issues.length > 0) {
      return candidate.ats_issues;
    }

    const issues = [];

    if (candidate.missing_skills.length > 0) {
      issues.push(`Missing keywords: ${candidate.missing_skills.slice(0, 6).join(', ')}`);
    }

    if (candidate.experience_match < 65) {
      issues.push('Weak project descriptions (not strongly aligned to JD responsibilities)');
    }

    if (candidate.experience_match < 55 || candidate.score < 70) {
      issues.push('Low business impact evidence (add JD-relevant metrics like delivery speed, cost savings, quality, or scale)');
    }

    if (issues.length === 0) {
      issues.push('No major ATS red flags detected for this JD.');
    }

    return issues;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900/95 backdrop-blur-lg shadow-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-linear-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">RS</span>
              </div>
              <span className="text-white text-xl font-bold">ResumeAI</span>
            </Link>
            <div className="flex items-center space-x-4">
              {/* Backend Status Indicator */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  backendStatus === 'online' ? 'bg-green-400' : 
                  backendStatus === 'offline' ? 'bg-red-400' : 
                  'bg-yellow-400 animate-pulse'
                }`}></div>
                <span className="text-gray-400 text-sm">
                  {backendStatus === 'online' ? 'API Connected' : 
                   backendStatus === 'offline' ? 'API Offline' : 
                   'Checking...'}
                </span>
              </div>
              <button
                onClick={resetForm}
                className="text-gray-300 hover:text-white transition"
              >
                New Analysis
              </button>
              <Link to="/" className="text-gray-300 hover:text-white transition">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!results ? (
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Resume Screening Dashboard
              </h1>
              <p className="text-gray-300 text-lg">
                Upload job description and resumes to get AI-powered rankings
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 backdrop-blur-lg">
                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-red-200 mb-2">{error}</p>
                    {backendStatus === 'offline' && (
                      <div className="bg-red-900/30 rounded-lg p-3 mt-2">
                        <p className="text-red-300 text-sm font-semibold mb-1">📌 To start the backend:</p>
                        <code className="text-red-200 text-xs block bg-black/30 p-2 rounded mt-1">
                          cd Backend<br/>
                          venv\Scripts\activate<br/>
                          uvicorn main:app --reload --port 8000
                        </code>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-300 shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">{/* Job Description Section */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Job Description
                </h2>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste your job description here... Include required skills, experience, qualifications, etc."
                  className="w-full h-48 bg-slate-800/50 text-white rounded-xl p-4 border border-white/10 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none placeholder-gray-500"
                  required
                />
              </div>

              {/* Resume Upload Section */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Resumes
                </h2>

                {/* Drag and Drop Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${dragActive
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-white/30 hover:border-purple-500/50'
                    }`}
                >
                  <input
                    type="file"
                    id="resume-upload"
                    multiple
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <div className="w-20 h-20 bg-linear-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-white text-xl font-semibold mb-2">
                      Drop resumes here or click to browse
                    </p>
                    <p className="text-gray-400">
                      Supports PDF, DOC, DOCX formats
                    </p>
                  </label>
                </div>

                {/* Uploaded Files List */}
                {resumes.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h3 className="text-white font-semibold mb-3">
                      Uploaded Resumes ({resumes.length})
                    </h3>
                    {resumes.map((resume, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-slate-800/50 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-white font-medium">{resume.name}</p>
                            <p className="text-gray-400 text-sm">
                              {(resume.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeResume(index)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={isProcessing || !jobDescription || resumes.length === 0}
                  className="bg-linear-to-r from-purple-600 to-pink-600 text-white px-12 py-4 rounded-full text-lg font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing Resumes...
                    </span>
                  ) : (
                    'Analyze Resumes'
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Results Section */
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Analysis Results
                </h1>
                <p className="text-gray-300">
                  Found {results.length} candidates ranked by match score
                </p>
              </div>
              <button
                onClick={resetForm}
                className="bg-linear-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
              >
                New Analysis
              </button>
            </div>

            {/* Results Grid */}
            <div className="space-y-4">
              {results.map((candidate, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 mb-4 md:mb-0">
                      <div className="w-12 h-12 bg-linear-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{candidate.name}</h3>
                        <p className="text-gray-400 text-sm">Candidate Resume</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-4xl font-bold ${getScoreColor(candidate.score)}`}>
                        {candidate.score}%
                      </div>
                      <p className="text-gray-400 text-sm">Overall Match</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className={`bg-linear-to-r ${getScoreGradient(candidate.score)} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${candidate.score}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Detailed Scores */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Skills Match</span>
                        <span className="text-white font-bold">{candidate.skills_match}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-linear-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                          style={{ width: `${candidate.skills_match}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Experience</span>
                        <span className="text-white font-bold">{candidate.experience_match}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-linear-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          style={{ width: `${candidate.experience_match}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">Education</span>
                        <span className="text-white font-bold">{candidate.education_match}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-linear-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                          style={{ width: `${candidate.education_match}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-5 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => toggleCandidateDetails(index)}
                      className="text-purple-300 hover:text-purple-200 font-semibold transition flex items-center gap-2"
                    >
                      {expandedCandidates[index] ? 'Hide ATS Insights' : 'View More'}
                      <svg
                        className={`w-4 h-4 transition-transform ${expandedCandidates[index] ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {expandedCandidates[index] && (
                      <div className="mt-4 bg-slate-900/55 rounded-xl border border-white/10 p-4 space-y-3">
                        <p className="text-white font-semibold">
                          ATS Score: <span className={getScoreColor(candidate.ats_score)}>{candidate.ats_score}%</span>
                        </p>

                        <div>
                          <p className="text-gray-300 font-medium mb-2">Issues</p>
                          <p className="text-gray-500 text-xs mb-2">
                            Source: {candidate.ats_issues_source === 'llm' ? 'AI (LLM)' : 'Rule-based fallback'}
                          </p>
                          <ul className="space-y-2 text-gray-300 text-sm">
                            {getAtsIssues(candidate).map((issue, issueIndex) => (
                              <li key={issueIndex} className="flex items-start gap-2">
                                <span className="text-pink-400 mt-1">•</span>
                                <span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Export Button */}
            <div className="text-center relative" ref={exportMenuRef}>
              <button 
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="border-2 border-purple-400 text-purple-400 px-8 py-3 rounded-full font-semibold hover:bg-purple-400 hover:text-white transition-all"
              >
                <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Results
                <svg className={`w-4 h-4 inline-block ml-2 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Export Format Menu */}
              {showExportMenu && (
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-slate-800/95 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl overflow-hidden z-10">
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-6 py-3 text-left text-white hover:bg-purple-600/30 transition-colors flex items-center space-x-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <div className="font-semibold">Export as CSV</div>
                      <div className="text-xs text-gray-400">Spreadsheet format</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full px-6 py-3 text-left text-white hover:bg-purple-600/30 transition-colors flex items-center space-x-3 border-t border-white/10"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    <div>
                      <div className="font-semibold">Export as JSON</div>
                      <div className="text-xs text-gray-400">Developer format</div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleExport('txt')}
                    className="w-full px-6 py-3 text-left text-white hover:bg-purple-600/30 transition-colors flex items-center space-x-3 border-t border-white/10"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div>
                      <div className="font-semibold">Export as TXT</div>
                      <div className="text-xs text-gray-400">Plain text format</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
