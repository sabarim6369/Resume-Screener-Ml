# Starting the Backend Server

## Quick Start

Open a new terminal and run these commands:

```bash
# Navigate to Backend folder
cd Backend

# Activate virtual environment (if already created)
venv\Scripts\activate

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

The server will start at: **http://localhost:8000**

## First Time Setup

If you haven't set up the backend yet:

```bash
# Navigate to Backend folder
cd Backend

# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Download SpaCy model
python -m spacy download en_core_web_sm

# Start the server
uvicorn main:app --reload --port 8000
```

## Verify Backend is Running

1. Open your browser to http://localhost:8000
2. You should see: `{"status":"ok","message":"Resume Screening API is running","version":"1.0.0"}`
3. Or visit http://localhost:8000/docs to see the interactive API documentation

## Common Issues

### "uvicorn: command not found"
Make sure the virtual environment is activated and uvicorn is installed:
```bash
venv\Scripts\activate
pip install uvicorn
```

### "Port 8000 is already in use"
Either:
- Kill the process using port 8000
- Or use a different port:
  ```bash
  uvicorn main:app --reload --port 8001
  ```
  Then update frontend `.env` file:
  ```
  VITE_API_URL=http://localhost:8001
  ```

### "Module not found" errors
Install the missing dependencies:
```bash
pip install -r requirements.txt
```

## API Endpoints

Once running, the backend provides:

- **GET /**: Health check
- **GET /health**: Health status
- **POST /match**: Match single resume to job description
- **POST /rank**: Rank multiple resumes against job description

## Stopping the Server

Press `Ctrl + C` in the terminal running uvicorn.
