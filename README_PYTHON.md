# Python Setup (Optional)

This project is primarily a **Node.js/React** application. Dependencies are managed via `package.json`.

The `analysis/` folder now contains a lightweight FastAPI service that powers the Gemini-driven travel insights. Install the Python dependencies if you plan to start that service locally.

## Node.js Dependencies (Primary)

```bash
# Install Node.js dependencies
npm install

# Start development server
npm run dev
```

## Python Setup (Optional)

If you need Python tooling or plan to add a Python backend:

### 1. Create Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 2. Install Python Dependencies

```bash
# Install from requirements.txt
pip install -r requirements.txt

# Or install specific packages as needed
pip install black flake8 pytest
```

### 3. Development Tools

```bash
# Format code
black .

# Lint code
flake8 .

# Run tests
pytest

# Type checking
mypy .
```

## Project Structure

```
rest-quest/
├── package.json          # Node.js dependencies (PRIMARY)
├── requirements.txt      # Python dependencies (OPTIONAL)
├── src/                  # React application source
├── node_modules/         # Node.js packages
└── venv/                 # Python virtual environment (if created)
```

## Notes

- **Main project**: Uses Node.js and `package.json` for dependencies
- **Python tooling**: Optional, for scripts, testing, or backend services
- **Analysis API**:
  ```bash
  pip install -r requirements.txt
  uvicorn analysis.api:app --reload --port 8000
  ```
  Point the React app to it with `VITE_ANALYSIS_ENDPOINT` (defaults to `http://localhost:8000/analysis`).
- **Camera trigger**:
  - The Emotional Check-In button calls `POST /camera/capture` to stream a short clip into the analysis.
  - The on-page live preview pulls from `GET /camera/stream` (override via `VITE_CAMERA_STREAM_ENDPOINT`) so the annotated OpenCV frames appear inside the app.
  - Logs land in `project/camera.log`. Set `CAMERA_PYTHON` if you need a specific interpreter for OpenCV/TF.
- **Full session runner**: `POST /session/start` (front-end default) spins up the entire `project/main.py` workflow; `GET /session/status` reports progress plus the latest answers. Adjust the endpoint with `VITE_SESSION_ENDPOINT` if needed.
