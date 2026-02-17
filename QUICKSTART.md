# Quick Start Guide

## Backend Setup (Terminal 1)

```bash
# Navigate to Backend
cd Backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Download SpaCy model
python -m spacy download en_core_web_sm

# Start server
uvicorn main:app --reload --port 8000
```

Backend will run at: http://localhost:8000

## Frontend Setup (Terminal 2)

```bash
# Navigate to client
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run at: http://localhost:5173

## Usage

1. Open http://localhost:5173 in your browser
2. Paste job description
3. Upload resume files (PDF format)
4. Click "Analyze Resumes"
5. View ranked results
6. Export results in CSV, JSON, or TXT format

## Supported File Formats

- PDF (.pdf)
- DOC (.doc) - Limited support
- DOCX (.docx) - Limited support

**Note:** PDF format is recommended for best results.

## Troubleshooting

### Backend not starting?
- Ensure Python 3.8+ is installed
- Check if virtual environment is activated
- Verify all dependencies are installed

### Frontend not connecting?
- Ensure backend is running on port 8000
- Check browser console for errors
- Verify CORS is enabled in backend

### Upload not working?
- Only PDF files are fully supported currently
- Check file size (large files may take longer)
- Ensure backend has write permissions for temp files

## Environment Variables (Optional)

Create a `.env` file in the client directory:

```env
VITE_API_URL=http://localhost:8000
```

## Next Steps

- Read the full README.md for detailed documentation
- Check API documentation at http://localhost:8000/docs
- Explore the code structure and customize as needed
