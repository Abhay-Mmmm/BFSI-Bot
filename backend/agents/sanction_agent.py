# Sanction Letter Agent for PRIMUM AI Sales Orchestration Platform

from crewai import Agent, Task
from langchain_groq import ChatGroq
from langchain.tools import tool
from typing import Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

from langchain.tools import tool

# Define tools for the sanction agent
@tool("PDF Generation")
def pdf_generation_tool(document_data: Dict[str, Any]) -> str:
    """Generate PDF documents like sanction letters"""
    # This would connect to our document generation system
    # For now, we'll simulate by creating a basic PDF structure
    import tempfile
    import os
    from reportlab.pdfgen import canvas
    from reportlab.lib.pagesizes import letter
    import uuid

    # Create a temporary PDF
    temp_dir = tempfile.gettempdir()
    filename = f"sanction_{uuid.uuid4()}.pdf"
    filepath = os.path.join(temp_dir, filename)

    # Generate a simple PDF with loan details
    c = canvas.Canvas(filepath, pagesize=letter)
    width, height = letter

    # Header
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "LOAN SANCTION LETTER")

    # Customer Information
    c.setFont("Helvetica", 12)
    y_position = height - 100
    c.drawString(50, y_position, f"Customer Name: {document_data.get('customer_name', 'N/A')}")
    y_position -= 20
    c.drawString(50, y_position, f"Loan Account Number: {document_data.get('loan_account_number', 'N/A')}")
    y_position -= 20
    c.drawString(50, y_position, f"Date: {document_data.get('sanction_date', 'N/A')}")
    y_position -= 40

    # Loan Details
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y_position, "LOAN DETAILS:")
    y_position -= 20
    c.setFont("Helvetica", 12)
    c.drawString(50, y_position, f"Sanctioned Amount: ₹{document_data.get('loan_amount', 'N/A'):,}")
    y_position -= 20
    c.drawString(50, y_position, f"Interest Rate: {document_data.get('interest_rate', 'N/A')}% per annum")
    y_position -= 20
    c.drawString(50, y_position, f"Loan Tenure: {document_data.get('tenure_months', 'N/A')} months")
    y_position -= 20
    c.drawString(50, y_position, f"Monthly EMI: ₹{document_data.get('emi_amount', 'N/A'):,}")
    y_position -= 20
    c.drawString(50, y_position, f"Processing Fee: ₹{document_data.get('processing_fee', 'N/A'):,}")
    y_position -= 40

    # Terms and Conditions
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y_position, "TERMS AND CONDITIONS:")
    y_position -= 20
    c.setFont("Helvetica", 10)
    terms = [
        "1. The loan must be used for the purpose mentioned in the application",
        "2. EMI payments are due on the same date each month",
        "3. Prepayment is allowed after 6 months with no charges for up to 25% of outstanding amount per year",
        "4. Interest will be charged on the reducing balance method",
        "5. Any changes in employment or income must be reported immediately"
    ]

    for term in terms:
        if y_position < 100:  # Start a new page if needed
            c.showPage()
            y_position = height - 50

        c.drawString(50, y_position, term)
        y_position -= 15

    c.save()

    return f"PDF generated successfully: {filename} at {filepath}"

@tool("Knowledge Base Search")
def knowledge_base_search(query: str) -> str:
    """Search the knowledge base for document templates and regulatory requirements"""
    # This would connect to our RAG system
    from rag.knowledge_base import KnowledgeBase
    kb = KnowledgeBase()
    results = kb.search(query)
    return str(results)

class SanctionLetterAgent:
    """Sanction Letter Generator Agent"""

    def __init__(self):
        self.llm = ChatGroq(
            model=os.getenv("GROQ_MODEL", "llama3-70b-8192"),
            temperature=0.1,  # Lower temperature for accurate document generation
            api_key=os.getenv("GROQ_API_KEY")
        )

        self.agent = self._create_agent()

    def _create_agent(self):
        """Create the sanction letter agent"""
        return Agent(
            role="Sanction Letter Generator Specialist",
            goal="Generate professional sanction letters and loan documentation that comply with regulatory requirements and clearly communicate terms and conditions",
            backstory="""
            You specialize in creating formal loan sanction documents that comply with regulatory requirements. You generate accurate, professional documents that clearly communicate loan terms, conditions, and next steps to customers.

            Your responsibilities:
            1. Generate accurate sanction letters with all required details
            2. Include proper legal terms and conditions
            3. Ensure compliance with regulatory requirements
            4. Format documents professionally
            5. Calculate and include accurate financial details
            """,
            verbose=True,
            allow_delegation=True,
            tools=[pdf_generation_tool, knowledge_base_search],
            llm=self.llm
        )
    
    def create_sanction_letter_task(self, loan_data: Dict[str, Any]) -> Task:
        """Create a task for generating sanction letter"""
        return Task(
            description=f"""
            Generate a professional sanction letter for loan approval: {loan_data}
            
            The sanction letter should include:
            1. Professional header with bank details
            2. Customer information (name, address, loan account number)
            3. Loan approval details:
               - Sanctioned amount
               - Interest rate
               - Loan tenure
               - Monthly EMI
               - Processing fee
               - Disbursement date
            4. Terms and conditions:
               - Usage restrictions
               - Repayment schedule
               - Prepayment policy
               - Default consequences
            5. Next steps for customer
            6. Authorization signatures (simulated)
            
            Use the PDF generation tool to create the final document.
            Ensure all financial calculations are accurate.
            """,
            expected_output="Sanction letter PDF file path and document details",
            agent=self.agent
        )
    
    def create_emi_schedule_task(self, loan_details: Dict[str, Any]) -> Task:
        """Create a task for generating EMI schedule"""
        return Task(
            description=f"""
            Generate a detailed EMI schedule for loan: {loan_details}
            
            Calculate and present:
            1. Monthly repayment schedule for the entire tenure
            2. Principal and interest components for each EMI
            3. Outstanding balance after each payment
            4. Total interest payable over the loan tenure
            
            The schedule should be accurate and clearly formatted for customer understanding.
            """,
            expected_output="Detailed EMI schedule with all payment information",
            agent=self.agent
        )
    
    def create_document_verification_task(self, document_data: Dict[str, Any]) -> Task:
        """Create a task for verifying document accuracy"""
        return Task(
            description=f"""
            Verify the accuracy of loan document data: {document_data}
            
            Check:
            1. All financial figures are calculated correctly
            2. Terms and conditions are accurate and comply with regulations
            3. Customer information is correctly included
            4. Dates and account numbers are accurate
            5. Legal compliance requirements are met
            
            Flag any discrepancies or errors found.
            """,
            expected_output="Verification report with any issues or confirmation of accuracy",
            agent=self.agent
        )
    
    def create_terms_confirmation_task(self, loan_data: Dict[str, Any]) -> Task:
        """Create a task for confirming terms and conditions"""
        return Task(
            description=f"""
            Review and confirm all terms and conditions for loan: {loan_data}
            
            Ensure the document includes:
            1. Proper regulatory compliance statements
            2. Accurate interest rate calculations
            3. Correct prepayment policies
            4. Clear default consequences
            5. All mandatory disclosure requirements
            
            Use the knowledge base to ensure compliance with current regulations.
            """,
            expected_output="Confirmation of terms compliance or required changes",
            agent=self.agent
        )
    
    def get_agent(self):
        """Return the sanction letter agent"""
        return self.agent