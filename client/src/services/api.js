import axios from 'axios';

// Configure the base URL for the API
// Backend FastAPI server runs on port 8000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  // Don't set Content-Type here - let axios handle it for FormData
});

/**
 * Rank multiple resumes against a job description
 * Backend endpoint: POST /rank
 * @param {File[]} resumes - Array of resume files
 * @param {string} jobDescription - Job description text
 * @returns {Promise} - Array of ranked candidates
 */
export const rankResumes = async (resumes, jobDescription) => {
  const formData = new FormData();
  
  // Append job description (backend expects 'jd' field)
  formData.append('jd', jobDescription);
  
  // Append all resume files (backend expects 'resumes' field)
  resumes.forEach((resume) => {
    formData.append('resumes', resume);
  });

  try {
    const response = await api.post('/rank', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error ranking resumes:', error);
    throw error;
  }
};

/**
 * Match a single resume against a job description
 * Backend endpoint: POST /match
 * @param {File} resume - Resume file
 * @param {string} jobDescription - Job description text
 * @returns {Promise} - Match score
 */
export const matchResume = async (resume, jobDescription) => {
  const formData = new FormData();
  
  // Backend expects 'resume' and 'jd' fields
  formData.append('resume', resume);
  formData.append('jd', jobDescription);

  try {
    const response = await api.post('/match', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error matching resume:', error);
    throw error;
  }
};

/**
 * Check if the backend API is running
 * @returns {Promise<boolean>} - True if backend is accessible
 */
export const checkBackendHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data.status === 'healthy';
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

export default api;
