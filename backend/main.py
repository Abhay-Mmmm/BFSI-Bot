from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from typing import Dict, Any, List, Optional
import uuid
from datetime import datetime
import asyncio
import tempfile
import shutil
from pathlib import Path

# Load environment variables
load_dotenv()

# Import components
from agents import AgentFactory
from rag.knowledge_base import KnowledgeBase
from rules.rule_engine import RuleEngine
from conversation.conversation_engine import ConversationEngine
from integrations.integration_services import CreditBureauAPI, CRMIntegration, LoanBookingEngine
from security.security_manager import SecurityManager, RoleManager

app = FastAPI(
    title="PRIMUM - AI Sales Orchestration API",
    description="Human-Like AI Sales Orchestration Platform for Personal Loans (BFSI)",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
agent_factory = AgentFactory()
all_agents = agent_factory.create_all_agents()
orchestrator_agent = all_agents['orchestrator']
sales_agent = all_agents['sales']
verification_agent = all_agents['verification']
underwriting_agent = all_agents['underwriting']
sanction_agent = all_agents['sanction']
knowledge_base = KnowledgeBase()
rule_engine = RuleEngine()
credit_api = CreditBureauAPI()
crm = CRMIntegration()
loan_booking_engine = LoanBookingEngine()
security_manager = SecurityManager()

class ModelSettings(BaseModel):
    model: str
    api_key: str = None

@app.post("/settings/model")
async def update_model_settings(settings: ModelSettings):
    """Update the Groq model used by agents"""
    try:
        # Update environment variable for future initializations
        os.environ["GROQ_MODEL"] = settings.model
        if settings.api_key:
            os.environ["GROQ_API_KEY"] = settings.api_key
            
        # Re-initialize agents with new model
        # Note: In a production app, this should be handled more gracefully
        # For this hackathon, we'll just recreate the factory and agents
        global agent_factory, all_agents, orchestrator_agent
        
        # We need to reload the AgentFactory to pick up new env vars if it reads them in __init__
        # But since we updated os.environ, let's just recreate the agents
        agent_factory = AgentFactory()
        all_agents = agent_factory.create_all_agents()
        orchestrator_agent = all_agents['orchestrator']
        
        return {"status": "success", "message": f"Model updated to {settings.model}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

role_manager = RoleManager()

# Initialize conversation engine with all components
conversation_engine = ConversationEngine(
    knowledge_base=knowledge_base,
    rule_engine=rule_engine,
    orchestrator_agent=orchestrator_agent
)

# Models
class Message(BaseModel):
    role: str
    content: str
    timestamp: datetime = None

class Conversation(BaseModel):
    conversation_id: str
    messages: List[Message] = []
    customer_data: Dict[str, Any] = {}
    loan_application: Dict[str, Any] = {}
    current_stage: str = "engagement"

class QueryRequest(BaseModel):
    query: str
    conversation_id: str = None
    uploaded_documents: Optional[List[Dict[str, Any]]] = None

class CustomerData(BaseModel):
    name: str
    mobile: str
    email: str
    loan_amount: int
    salary: int
    employment_status: str
    city: str
    credit_score: int = None

class SanctionRequest(BaseModel):
    customer_data: CustomerData
    loan_amount: int
    interest_rate: float
    tenure_months: int

# Routes
@app.get("/")
def read_root():
    return {"message": "PRIMUM AI Sales Orchestration API", "status": "running"}

@app.post("/conversation/start")
def start_conversation() -> Dict[str, Any]:
    """Start a new conversation"""
    conversation_id = conversation_engine.start_conversation()
    return {
        "conversation_id": conversation_id,
        "message": "New conversation started",
        "status": "success"
    }

@app.post("/conversation/query")
def process_query(request: QueryRequest) -> Dict[str, Any]:
    """Process a query and return the AI response"""
    try:
        # Add uploaded documents context to the query if available
        enhanced_message = request.query
        if request.uploaded_documents and len(request.uploaded_documents) > 0:
            doc_context = "\\n\\n[Uploaded Documents: "
            doc_context += ", ".join([doc.get('filename', 'Unknown') for doc in request.uploaded_documents])
            doc_context += "]"
            enhanced_message = request.query + doc_context
        
        result = conversation_engine.process_message(
            conversation_id=request.conversation_id or conversation_engine.start_conversation(),
            message=enhanced_message
        )
        
        # Include document info in response
        if request.uploaded_documents:
            result['uploaded_documents'] = request.uploaded_documents
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

@app.get("/conversation/{conversation_id}")
def get_conversation(conversation_id: str) -> Dict[str, Any]:
    """Get conversation details"""
    try:
        state = conversation_engine.get_conversation_state(conversation_id)
        if not state:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return state
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving conversation: {str(e)}")

@app.get("/knowledge/search")
def search_knowledge(query: str) -> List[Dict[str, Any]]:
    """Search the knowledge base"""
    try:
        results = knowledge_base.search(query)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching knowledge base: {str(e)}")

@app.get("/loan/status/{conversation_id}")
def get_loan_status(conversation_id: str) -> Dict[str, Any]:
    """Get the current loan application status"""
    try:
        state = conversation_engine.get_conversation_state(conversation_id)
        if not state:
            raise HTTPException(status_code=404, detail="Conversation not found")

        loan_app = state.get("loan_application", {})
        return {
            "conversation_id": conversation_id,
            "eligibility_status": loan_app.get("decision", "pending"),
            "loan_amount": loan_app.get("loan_amount"),
            "emi_amount": loan_app.get("emi_amount"),
            "interest_rate": loan_app.get("interest_rate"),
            "risk_category": loan_app.get("risk_category", "unknown"),
            "current_stage": state.get("stage", "engagement")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting loan status: {str(e)}")

@app.post("/verification/credit")
def verify_credit(identifier: str, identifier_type: str = "mobile") -> Dict[str, Any]:
    """Verify credit score"""
    try:
        result = credit_api.get_credit_report(identifier, identifier_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verifying credit: {str(e)}")

@app.post("/crm/lead")
def create_lead(customer_data: CustomerData) -> Dict[str, Any]:
    """Create a lead in CRM"""
    try:
        lead = crm.create_lead(customer_data.dict())
        return lead
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating lead: {str(e)}")

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("./uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@app.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    conversation_id: Optional[str] = None,
    document_type: Optional[str] = None
) -> Dict[str, Any]:
    """Upload a document (salary slip, ID proof, bank statement, etc.)"""
    try:
        # Validate file type
        allowed_extensions = {'.pdf', '.jpg', '.jpeg', '.png'}
        file_ext = Path(file.filename).suffix.lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file_ext} not allowed. Only PDF, JPG, PNG accepted."
            )
        
        # Validate file size (10MB max)
        max_size = 10 * 1024 * 1024  # 10MB
        file_content = await file.read()
        if len(file_content) > max_size:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        safe_filename = f"{file_id}_{file.filename}"
        file_path = UPLOAD_DIR / safe_filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Store document metadata
        document_metadata = {
            "id": file_id,
            "filename": file.filename,
            "stored_filename": safe_filename,
            "file_type": file_ext,
            "file_size": len(file_content),
            "document_type": document_type or "general",
            "conversation_id": conversation_id,
            "uploaded_at": datetime.now().isoformat(),
            "download_url": f"/documents/download/{file_id}"
        }
        
        return {
            "status": "success",
            "message": "Document uploaded successfully",
            "document": document_metadata
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")

@app.post("/documents/generate/sanction")
def generate_sanction_letter(request: SanctionRequest) -> Dict[str, str]:
    """Generate a sanction letter"""
    try:
        # This would call the sanction agent to generate the PDF
        # For now, return a mock response
        import tempfile
        import os
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter

        # Create a temporary PDF
        temp_dir = tempfile.gettempdir()
        filename = f"sanction_{uuid.uuid4()}.pdf"
        filepath = os.path.join(temp_dir, filename)

        # Generate a simple PDF
        c = canvas.Canvas(filepath, pagesize=letter)
        c.drawString(100, 750, "SANCTION LETTER")
        c.drawString(100, 730, f"Customer: {request.customer_data.name}")
        c.drawString(100, 710, f"Loan Amount: ₹{request.loan_amount:,}")
        c.drawString(100, 690, f"Interest Rate: {request.interest_rate}%")
        c.save()

        return {
            "download_url": f"/documents/download/{filename}",
            "filename": filename,
            "message": "Sanction letter generated successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating sanction letter: {str(e)}")

@app.get("/documents/download/{file_id}")
def download_document(file_id: str):
    """Download a document by file ID"""
    try:
        # Search for file in uploads directory
        matching_files = list(UPLOAD_DIR.glob(f"{file_id}_*"))
        
        if not matching_files:
            # Also check temp directory for sanction letters
            temp_dir = Path(tempfile.gettempdir())
            matching_files = list(temp_dir.glob(f"sanction_{file_id}.pdf"))
        
        if not matching_files:
            raise HTTPException(status_code=404, detail="Document not found")
        
        filepath = matching_files[0]
        
        # Determine media type based on extension
        media_type = "application/pdf"
        if filepath.suffix.lower() in ['.jpg', '.jpeg']:
            media_type = "image/jpeg"
        elif filepath.suffix.lower() == '.png':
            media_type = "image/png"
        
        return FileResponse(
            filepath, 
            media_type=media_type, 
            filename=filepath.name
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading document: {str(e)}")

@app.get("/admin/dashboard")
def admin_dashboard() -> Dict[str, Any]:
    """Admin dashboard with analytics"""
    # This would aggregate data from various services
    # For demo purposes, return mock data
    return {
        "total_conversations": len(conversation_engine.conversations),
        "conversion_rate": 0.35,  # 35% conversion rate
        "avg_processing_time": "7.2 min",
        "active_agents": 4,
        "total_leads_generated": 25,
        "approved_applications": 8,
        "revenue_generated": "₹5,00,00,000"
    }

@app.get("/admin/conversations")
def admin_conversations() -> List[Dict[str, Any]]:
    """Get all conversations for admin view"""
    conversations_list = []
    for conv_id, conv_data in conversation_engine.conversations.items():
        conversations_list.append({
            "conversation_id": conv_id,
            "stage": conv_data["stage"].value,
            "created_at": conv_data["created_at"],
            "last_updated": conv_data["last_updated"],
            "customer_name": conv_data["customer_data"].get("name", "Unknown"),
            "loan_amount": conv_data["loan_application"].get("loan_amount")
        })
    return conversations_list

# Health check endpoint
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "knowledge_base": "connected",
            "agents": "ready",
            "integration_services": "available"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)