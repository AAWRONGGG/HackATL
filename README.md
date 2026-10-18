# BizBridge — Business Made Simpler

**An AI-powered business guidance platform helping entrepreneurs navigate registration, licensing, permits, and paperwork with confidence.**

Built for HackATL 2026.

## The Problem

Starting a small business can be overwhelming, especially for first-time entrepreneurs, older adults, and people unfamiliar with government procedures.

Business owners often need to navigate multiple government websites, understand complicated requirements, organize documents, and keep track of deadlines.

Important information is scattered across agencies, and legal or regulatory language can be difficult to understand.

**BizBridge aims to make that process simpler, more accessible, and easier to navigate.**

## Our Solution

BizBridge combines AI-powered business guidance, structured compliance information, document analysis, and accessibility-focused design in one platform.

Instead of searching through government websites individually, entrepreneurs can ask questions in natural language, explore relevant requirements, and find official resources.

The platform is designed to support entrepreneurs throughout their business journey, from initial registration to document preparation and compliance planning.

## Features

### 1. AI Compliance Assistant — Working Prototype

Powered by Google Gemini and FastAPI, the assistant helps users:

- Ask questions about starting and operating a business.
- Understand business registration and licensing procedures.
- Explore potential permit and documentation requirements.
- Receive explanations in accessible language.
- Access references to official Georgia and Atlanta government resources.

The assistant generates informational guidance rather than making definitive legal or compliance determinations.

### 2. Business Dashboard

A centralized workspace for navigating business-related activities and resources.

### 3. Requirements and Deadlines

Provides an interface for exploring business requirements, reviewing next steps, and tracking regulatory tasks.

### 4. Document Management — Prototype

The frontend includes a document-selection interface. The backend provides document classification and information extraction capabilities.

Full frontend-to-document-analysis integration is a planned improvement.

### 5. ML-Powered Document Analysis — Backend Implemented

The document-analysis backend uses a trained machine-learning classifier to identify document types from extracted PDF text.

Current capabilities include:

- PDF text extraction using PyMuPDF.
- Machine-learning document classification.
- Candidate information extraction using pattern matching.
- Identification of potential business names, addresses, document numbers, and dates.
- Returning document-analysis results requiring human review.

Current limitations include a 10 MB file-size limit, a 20-page limit, and no OCR support for image-only scanned PDFs.

### 6. Accessibility

BizBridge includes accessibility-focused interface features, including configurable presentation settings designed to improve readability and usability.

### 7. Find Experts

An interface for exploring relevant professional assistance and business-support resources.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Python, FastAPI, Uvicorn |
| Generative AI | Google Gemini API |
| Machine Learning | scikit-learn, joblib |
| Document Processing | PyMuPDF, regular expressions |
| Accessibility | React accessibility components, OpenDyslexic font |
| Icons | Lucide React |
| Version Control | Git and GitHub |

## System Architecture

```text
                 Business Owner
                       |
                       v
               BizBridge Frontend
                  React + Vite
                       |
             ---------------------
             |                   |
             v                   v
       AI Assistant         Business Workspace
             |             Requirements / Deadlines
             |             Documents / Find Experts
             v
        FastAPI Backend
             |
       ------------------
       |                |
       v                v
  Gemini Chat API   Document Analysis
       |                |
       v                v
  AI Responses      PDF Text Extraction
  + References      ML Classification
                    Candidate Fields
```

## Project Structure

```text
HackATL/
|
|-- src/                       # Root React frontend
|-- clearbridge-frontend/      # Additional frontend implementation
|-- frontend/                  # Additional frontend directory
|
|-- ml/
|   |-- backend/
|   |   |-- main.py            # FastAPI application
|   |   |-- chat.py            # Gemini AI chatbot
|   |   `-- __init__.py
|   |
|   |-- models/                # Trained document classifier
|   |-- data/                  # ML data
|   |-- evaluation/            # Model evaluation
|   |-- notebooks/             # ML experiments
|   |-- tests/                 # Backend tests
|   `-- requirements.txt       # Python dependencies
|
|-- index.html
|-- package.json
|-- .env.example               # Optional configuration template
`-- README.md
```

**Note:** The repository currently contains multiple frontend implementations. The root Vite frontend is the version used for the demonstrated local Gemini chat integration.

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3.12
- Git
- Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/AAWRONGGG/HackATL.git
cd HackATL
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Set Up the Python Environment

On Windows PowerShell:

```powershell
py -3.12 -m venv .venv312
.\.venv312\Scripts\Activate.ps1
```

Install backend dependencies:

```powershell
python -m pip install -r ml/requirements.txt
python -m pip install google-genai python-dotenv
```

### 4. Configure Environment Variables

Create a `.env` file in the repository root:

```env
GEMINI_API_KEY=your_gemini_api_key
BIZBRIDGE_GEMINI_MODEL=your_available_gemini_model
BIZBRIDGE_CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Use a Gemini model that is available to your API project.

Create `.env.local` for the root Vite frontend:

```env
VITE_BIZBRIDGE_API_URL=http://localhost:8000
```

**Security:** Never commit API keys or environment files containing secrets to GitHub.

### 5. Start the FastAPI Backend

Run from the repository root:

```powershell
.\.venv312\Scripts\python.exe -m uvicorn ml.backend.main:app --reload --port 8000
```

Backend URL: `http://localhost:8000`

Interactive API documentation: `http://localhost:8000/docs`

### 6. Start the React Frontend

Open another terminal:

```bash
npm run dev
```

Visit `http://localhost:5173`.

### 7. Test the AI Assistant

Open the AI Assistant page and ask:

> I want to open a small restaurant in Atlanta. What licenses and permits should I check first?

The frontend sends the question to the FastAPI backend, which calls Gemini and returns a generated answer with relevant reference links.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Backend health and model-file availability |
| POST | `/api/chat` | AI business guidance |
| POST | `/api/analyze-document` | PDF document analysis |
| POST | `/api/classify-document` | Compatible document-classification endpoint |

### Chat API Example

**Request**

```json
{
  "message": "What permits might I need to open a restaurant in Atlanta?"
}
```

**Response structure**

```json
{
  "answer": "AI-generated guidance...",
  "sources": [
    {
      "title": "Official government resource",
      "url": "https://example.gov/resource"
    }
  ],
  "requires_review": true
}
```

The response is illustrative. Actual answers and source references vary by question.

## Current Limitations

- AI guidance is informational and requires verification with official government agencies.
- Source links are drawn from curated reference information rather than live verification of every generated claim.
- The chat prototype does not yet provide persistent conversation memory.
- Document classification and the website's document interface are not yet fully integrated.
- Image-only scanned PDFs require OCR support, which is not implemented in the current document-analysis backend.
- A publicly accessible FastAPI deployment is needed before remote users can use the Gemini chatbot through a deployed frontend.
- Public deployment should include authentication or appropriate abuse protection, rate limiting, and secure handling of uploaded business documents.

## Future Improvements

**AI and business guidance**
- Personalized compliance roadmaps based on business type and location.
- Conversation memory for contextual follow-up questions.
- Retrieval-augmented generation using vetted government information.
- AI-assisted document gap detection.

**Document intelligence**
- Direct frontend integration with PDF classification.
- OCR support for scanned documents.
- Document completeness checks.
- Human-review workflows and clearer classification explanations.

**Accessibility**
- ElevenLabs-powered voice assistance.
- Multilingual spoken guidance.
- Speech-rate adjustment and repeat controls.
- Simplified instructions for users unfamiliar with business procedures.

**Deployment**
- Deploy FastAPI to a secure cloud host.
- Connect the deployed frontend to the public backend.
- Add monitoring, testing, and rate limiting.

## Responsible AI

BizBridge is designed to help users understand business processes, not replace licensed professionals or government agencies.

AI-generated guidance may be incomplete or outdated. Business owners should verify licensing requirements, fees, deadlines, and legal obligations directly with the relevant authorities.

Document classification and extracted fields are provisional and require human confirmation.

## HackATL 2026

BizBridge demonstrates how generative AI, machine learning, and accessible user interfaces can work together to reduce the complexity of starting and managing a small business.

**Our mission: Make business guidance understandable and accessible, one step at a time.**

---

Built with React, FastAPI, Google Gemini, and Python.

**GitHub:** https://github.com/AAWRONGGG/HackATL