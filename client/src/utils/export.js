/**
 * Export data to CSV format
 * @param {Array} data - Array of candidate results
 * @param {string} filename - Name of the file to download
 */
export const exportToCSV = (data, filename = 'resume_rankings.csv') => {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  // Create CSV headers
  const headers = ['Rank', 'Candidate Name', 'Overall Score (%)', 'Skills Match (%)', 'Experience Match (%)', 'Education Match (%)', 'Matched Skills'];
  
  // Create CSV rows
  const rows = data.map((candidate, index) => [
    index + 1,
    candidate.name || candidate.filename,
    candidate.score || candidate.match_score,
    candidate.skills_match || '-',
    candidate.experience_match || '-',
    candidate.education_match || '-',
    (candidate.matched_skills || []).join('; ')
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
};

/**
 * Export data to JSON format
 * @param {Array} data - Array of candidate results
 * @param {string} filename - Name of the file to download
 */
export const exportToJSON = (data, filename = 'resume_rankings.json') => {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  downloadBlob(blob, filename);
};

/**
 * Export data to PDF format (simple text-based PDF)
 * @param {Array} data - Array of candidate results
 * @param {string} filename - Name of the file to download
 */
export const exportToPDF = (data, filename = 'resume_rankings.pdf') => {
  if (!data || data.length === 0) {
    console.error('No data to export');
    return;
  }

  // Create a simple text-based PDF content
  let content = 'Resume Screening Results\n\n';
  content += `Generated on: ${new Date().toLocaleString()}\n`;
  content += `Total Candidates: ${data.length}\n\n`;
  content += '='.repeat(80) + '\n\n';

  data.forEach((candidate, index) => {
    content += `Rank #${index + 1}\n`;
    content += `Candidate: ${candidate.name || candidate.filename}\n`;
    content += `Overall Score: ${candidate.score || candidate.match_score}%\n`;
    
    if (candidate.skills_match) {
      content += `Skills Match: ${candidate.skills_match}%\n`;
    }
    if (candidate.experience_match) {
      content += `Experience Match: ${candidate.experience_match}%\n`;
    }
    if (candidate.education_match) {
      content += `Education Match: ${candidate.education_match}%\n`;
    }
    if (candidate.matched_skills && candidate.matched_skills.length > 0) {
      content += `Matched Skills: ${candidate.matched_skills.join(', ')}\n`;
    }
    
    content += '\n' + '-'.repeat(80) + '\n\n';
  });

  const blob = new Blob([content], { type: 'text/plain' });
  downloadBlob(blob, filename.replace('.pdf', '.txt'));
};

/**
 * Helper function to trigger file download
 * @param {Blob} blob - Blob object to download
 * @param {string} filename - Name of the file
 */
const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Export with format selection
 * @param {Array} data - Array of candidate results
 * @param {string} format - Format type: 'csv', 'json', or 'txt'
 */
export const exportResults = (data, format = 'csv') => {
  const timestamp = new Date().toISOString().split('T')[0];
  
  switch (format.toLowerCase()) {
    case 'csv':
      exportToCSV(data, `resume_rankings_${timestamp}.csv`);
      break;
    case 'json':
      exportToJSON(data, `resume_rankings_${timestamp}.json`);
      break;
    case 'txt':
    case 'pdf':
      exportToPDF(data, `resume_rankings_${timestamp}.txt`);
      break;
    default:
      console.error('Unsupported export format:', format);
      exportToCSV(data, `resume_rankings_${timestamp}.csv`);
  }
};
