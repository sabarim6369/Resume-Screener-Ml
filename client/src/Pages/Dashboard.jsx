import { useState } from 'react';
import { Link } from 'react-router-dom';

function Dashboard() {
  const [jobDescription, setJobDescription] = useState('');
  const [resumes, setResumes] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);

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
      alert('Please provide both job description and resumes');
      return;
    }

    setIsProcessing(true);

    // Create FormData for API call
    const formData = new FormData();
    formData.append('job_description', jobDescription);
    resumes.forEach((resume) => {
      formData.append('resumes', resume);
    });

    try {
      // TODO: Replace with actual API endpoint
      // const response = await fetch('http://localhost:5000/api/analyze', {
      //   method: 'POST',
      //   body: formData,
      // });
      // const data = await response.json();
      
      // Mock results for demonstration
      setTimeout(() => {
        const mockResults = resumes.map((resume, index) => ({
          name: resume.name,
          score: Math.floor(Math.random() * 30) + 70,
          skills_match: Math.floor(Math.random() * 30) + 65,
          experience_match: Math.floor(Math.random() * 30) + 60,
          education_match: Math.floor(Math.random() * 30) + 70,
          matched_skills: ['React', 'Node.js', 'Python', 'Machine Learning'].slice(0, Math.floor(Math.random() * 3) + 2),
        })).sort((a, b) => b.score - a.score);

        setResults(mockResults);
        setIsProcessing(false);
      }, 2000);
    } catch (error) {
      console.error('Error processing resumes:', error);
      alert('Error processing resumes. Please try again.');
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setJobDescription('');
    setResumes([]);
    setResults(null);
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

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Job Description Section */}
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
                  className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                    dragActive 
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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

                  {/* Matched Skills */}
                  <div>
                    <h4 className="text-white font-semibold mb-2">Matched Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {candidate.matched_skills.map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="bg-purple-600/30 text-purple-300 px-3 py-1 rounded-full text-sm border border-purple-500/50"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Export Button */}
            <div className="text-center">
              <button className="border-2 border-purple-400 text-purple-400 px-8 py-3 rounded-full font-semibold hover:bg-purple-400 hover:text-white transition-all">
                <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Results
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
