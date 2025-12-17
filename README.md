# PRIMUM AI - Intelligent Loan Processing Platform

<div align="center">
  <img src="https://img.shields.io/badge/BFSI-Compliant-blue?style=for-the-badge" alt="BFSI Compliant">
  <img src="https://img.shields.io/badge/LLM--Powered-Groq-orange?style=for-the-badge" alt="LLM Powered">
  <img src="https://img.shields.io/badge/React-18.2+-61DAFB?style=for-the-badge" alt="React">
  <img src="https://img.shields.io/badge/FastAPI-Python-green?style=for-the-badge" alt="FastAPI">
</div>

<div align="center">
  <h3>🤖 AI-Powered Conversational Loan Application Platform</h3>
  <p>Intelligent chatbot with automatic flow progression, real-time EMI calculations, and instant loan decisions</p>
</div>

---

## 🌟 Overview

**PRIMUM AI** is an intelligent loan processing platform that combines conversational AI with automated underwriting to deliver a seamless personal loan experience. Users can apply for loans through natural conversation, get instant eligibility decisions, and receive sanction letters - all within minutes.

### Key Highlights
- 🤖 **LLM-Powered Conversations**: Natural language understanding with Groq's Llama-3.3-70B
- ⚡ **Instant Decisions**: Real-time eligibility checks and loan approvals
- 📊 **Dynamic EMI Calculator**: Interactive breakdown with adjustable parameters
- 📄 **Auto-Generated Sanction Letters**: Professional PDF documents
- 🎯 **Sales Agent Dashboard**: AI-powered calling and customer management

---

## ✨ Features

### 💬 Conversational Loan Bot
- Natural language loan application ("I'm Rajesh, need 1.5 lakhs, 60k per month, salaried, Trivandrum")
- Smart data extraction (name, loan amount, salary, employment type, city)
- Multi-format number parsing (1.5L, 60k, 1.5 lakhs, etc.)
- Confirmation flows before proceeding to each stage
- Rollback capability for modifications

### 📈 Real-Time EMI Management
- Live EMI calculations with interest rate adjustments
- "What if" scenario modeling ("What if I pay 5000 per month?")
- Visual EMI breakdown over loan tenure
- Adjustable tenure with instant recalculation

### 🏦 Automated Underwriting
- Credit profile verification
- Risk assessment with scoring
- Instant approval for qualified applicants
- Conditional approval handling
- Business rule engine integration

### 📋 Loan Status Panel
- **Quick View**: EMI, loan amount, interest rate at a glance
- **Detailed View**: Complete cost breakdown with amortization schedule
- Downloadable sanction letters (PDF)
- Real-time status updates

### 👥 Sales Agent Dashboard
- AI-powered customer calling interface
- Potential customers list with call tracking
- Recent activities feed
- Team performance metrics
- Customer engagement analytics

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  ChatInterface  │  Dashboard  │  LoanStatus  │  EMIChart        │
│  DocumentUpload │  Sidebar    │  Settings    │  SanctionLetter  │
└─────────────────────────────────────────────────────────────────┘
                              │ API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (FastAPI)                          │
├─────────────────────────────────────────────────────────────────┤
│                    Conversation Engine                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ LLM Controller│  │ Rule Engine  │  │ RAG Service  │          │
│  │ (Groq API)   │  │              │  │ (ChromaDB)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
├─────────────────────────────────────────────────────────────────┤
│  Agents: Sales │ Verification │ Underwriting │ Sanction         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 16+
- Groq API Key (free at https://console.groq.com)

### 1. Clone & Setup Backend

```bash
# Clone repository
git clone https://github.com/your-org/primum-ai.git
cd primum-ai

# Setup backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### 2. Setup Frontend

```bash
cd frontend
npm install
```

### 3. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
# Or for production build:
npm run build
npx serve -s build -l 3000
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## 📁 Project Structure

```
PrimumAI/
├── backend/
│   ├── main.py                 # FastAPI application entry
│   ├── conversation/
│   │   └── conversation_engine.py  # Core conversation logic
│   ├── llm/
│   │   └── llm_controller.py   # Groq LLM integration
│   ├── agents/                 # Multi-agent handlers
│   ├── rules/                  # Business rule engine
│   ├── rag/                    # RAG knowledge base
│   ├── integrations/           # External service connectors
│   ├── security/               # Authentication & encryption
│   ├── .env.example            # Environment template
│   └── requirements.txt        # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.js      # Main chat UI
│   │   │   ├── Dashboard.js          # Sales dashboard
│   │   │   ├── LoanStatus.js         # Loan breakdown panel
│   │   │   ├── EMIChart.js           # EMI visualization
│   │   │   ├── SanctionLetter.js     # PDF generation
│   │   │   ├── PotentialCustomersCard.js  # AI calling
│   │   │   ├── DarkTheme.css         # Dark mode styles
│   │   │   └── ...
│   │   └── App.js
│   └── package.json
│
├── docs/                       # Documentation
├── README.md
├── QUICKSTART.md
└── LICENSE
```

---

## ⚙️ Configuration

### Environment Variables (.env)

```env
# Required
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# Database
DATABASE_URL=sqlite:///./primum.db
VECTOR_DB_TYPE=chroma
CHROMA_PERSIST_DIR=./chroma_data

# Security
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256

# Logging
LOG_LEVEL=INFO
```

### Available Groq Models
| Model | Speed | Quality | Recommended For |
|-------|-------|---------|-----------------|
| `llama-3.3-70b-versatile` | Medium | High | Production use |
| `llama-3.1-8b-instant` | Fast | Good | Development/testing |
| `mixtral-8x7b-32768` | Medium | Good | Balanced workloads |

---

## 🔄 Conversation Flow

```
User: "I'm Rajesh, need 1.5 lakhs, 60k per month, salaried, Trivandrum"
                    │
                    ▼
        ┌───────────────────┐
        │  Data Extraction  │
        │  Name, Amount,    │
        │  Salary, Type,    │
        │  City             │
        └───────────────────┘
                    │
                    ▼
        ┌───────────────────┐
        │   Eligibility     │
        │   Calculation     │
        │   (EMI, DTI)      │
        └───────────────────┘
                    │
                    ▼
        ┌───────────────────┐
        │   Verification    │◄── User confirms "yes"
        │   (Credit Check)  │
        └───────────────────┘
                    │
                    ▼
        ┌───────────────────┐
        │   Underwriting    │◄── User confirms "yes"
        │   (Risk/Approval) │
        └───────────────────┘
                    │
                    ▼
        ┌───────────────────┐
        │   Sanction        │◄── User confirms "yes"
        │   Letter Gen      │
        └───────────────────┘
                    │
                    ▼
            ✅ APPROVED
```

---

## 🎨 UI Modes

### 1. Loan Application Mode (Chatbot)
- Conversational interface for loan applications
- Real-time EMI panel on the right
- Document upload capability
- Sanction letter download

### 2. Sales Dashboard Mode
- AI agent calling interface with popup notifications
- Potential customers card with call tracking
- Recent activities feed
- Team performance metrics
- Customer management

Toggle between modes using the **Switch Mode** button in the sidebar.

---

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/conversation/start` | POST | Start new conversation |
| `/conversation/query` | POST | Send message to bot |
| `/conversation/{id}` | GET | Get conversation history |
| `/upload/document` | POST | Upload verification documents |
| `/health` | GET | Health check |

---

## 🛡️ Security Features

- **Data Encryption**: PII data masking
- **Secure API**: CORS-protected endpoints
- **Role-Based Access**: User/Admin separation
- **Audit Logging**: Complete transaction trails
- **BFSI Compliance**: RBI/GDPR ready architecture

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Groq](https://groq.com) for blazing-fast LLM inference
- [FastAPI](https://fastapi.tiangolo.com) for the excellent Python web framework
- [React](https://reactjs.org) for the frontend framework
- [ChromaDB](https://www.trychroma.com) for vector storage

---

<div align="center">
  <p>Built with ❤️ for the future of BFSI</p>
  <p><strong>PRIMUM AI</strong> - Making Loans Simple</p>
</div>
