# PRIMUM - Human-Like AI Sales Orchestration Platform for Personal Loans (BFSI)

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │   Web Chat      │  │  Dashboard UI   │  │  Admin Panel    │                 │
│  │   Interface     │  │   (React)       │  │                 │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ API Calls
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND API LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ Conversation    │  │ Agent           │  │ RAG Knowledge   │                 │
│  │ Service         │  │ Orchestration   │  │ Service         │                 │
│  │                 │  │ Service         │  │                 │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ Rule Engine     │  │ Integration     │  │ Security        │                 │
│  │ Service         │  │ Service         │  │ Service         │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ Agent Communication
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           AGENT ORCHESTRATION LAYER                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ Master          │  │ Sales Agent     │  │ Verification    │                 │
│  │ Orchestrator    │  │                 │  │ Agent           │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
│  ┌─────────────────┐  ┌─────────────────┐                                     │
│  │ Underwriting    │  │ Sanction Letter │                                     │
│  │ Agent           │  │ Agent           │                                     │
│  └─────────────────┘  └─────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ External API Calls
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL INTEGRATION LAYER                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ Credit Bureau   │  │ CRM System      │  │ Loan Booking    │                 │
│  │ API (Mock)      │  │ (Mock)          │  │ Engine (Mock)   │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Agent Interaction Diagram

```
User Query
    │
    ▼
┌─────────────────┐
│ Master          │
│ Orchestrator    │
└─────────────────┘
    │ Determines stage and route
    │
    ▼
┌─────────────────────────────────────┐
│ Stage-based Agent Routing           │
├─────────────────────────────────────┤
│ Engagement → Sales Agent            │
│ Needs Assessment → Sales Agent      │
│ Verification → Verification Agent   │
│ Underwriting → Underwriting Agent   │
│ Sanction → Sanction Agent           │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────┐
│ Agent Response  │ → Knowledge Base Query
└─────────────────┘
    │
    ▼
Response to User
```

## Data Flow Diagram

```
┌──────────────┐    ┌─────────────────┐    ┌──────────────┐
│   User       │    │   Frontend      │    │   Backend    │
│ Interaction  │───▶│   (React)       │───▶│   API        │
└──────────────┘    └─────────────────┘    └──────────────┘
                                                    │
┌──────────────┐    ┌─────────────────┐             │
│ External     │◀───│ Integration     │◀────────────┘
│ Services     │    │ Layer           │
│ (Credit,     │    │ (CRM, Loan      │
│ CRM, etc.)   │    │ Booking)        │
└──────────────┘    └─────────────────┘
```

## BFSI Compliance Features

1. **PII Masking**: All personally identifiable information is masked in logs
2. **Role-based Access**: Different levels of access for staff and admin
3. **Audit Trails**: Complete tracking of all customer interactions
4. **Secure Storage**: Encrypted storage of sensitive data
5. **Regulatory Compliance**: Adherence to RBI and other regulatory requirements

## Scalability Design

- **Stateless Microservices**: Each service can scale independently
- **Asynchronous Processing**: Agent tasks processed asynchronously
- **Load Balancing**: API gateway for distributing requests
- **Database Connection Pooling**: Efficient database resource management
- **Caching Layer**: Redis for frequently accessed data

## Technology Stack

### Frontend
- React 18
- FastAPI
- WebSocket for real-time communication
- Charting libraries for EMI visualization

### Backend
- Python 3.10+
- FastAPI for REST API
- CrewAI for agent orchestration
- LangGraph for complex workflows
- ChromaDB for vector storage
- ReportLab for PDF generation
- Sentence Transformers for embeddings

### Security
- JWT for authentication
- PII masking
- HTTPS enforcement
- Input validation and sanitization