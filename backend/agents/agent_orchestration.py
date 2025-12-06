# Agent Orchestration System for PRIMUM AI Sales Orchestration Platform
# Uses CrewAI for coordinating multiple AI agents

from crewai import Agent, Task, Crew
from langchain.tools import tool
from langchain_groq import ChatGroq
from typing import Dict, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Define tools for agents
@tool("Knowledge Base Search")
def knowledge_base_search(query: str) -> str:
    """Search the knowledge base for product information, eligibility criteria, and FAQs"""
    # This would connect to our RAG system
    from rag.knowledge_base import KnowledgeBase
    kb = KnowledgeBase()
    results = kb.search(query)
    return str(results)

@tool("Credit Bureau Verification")
def credit_bureau_verification(identifier: str, identifier_type: str = "mobile") -> str:
    """Verify customer's credit score and history"""
    # This would connect to our credit bureau simulation
    from integrations.integration_services import CreditBureauAPI
    api = CreditBureauAPI()
    result = api.get_credit_report(identifier, identifier_type)
    return str(result)

@tool("CRM Lead Creation")
def crm_lead_creation(customer_data: Dict[str, Any]) -> str:
    """Create a lead in the CRM system"""
    # This would connect to our CRM simulation
    from integrations.integration_services import CRMIntegration
    crm = CRMIntegration()
    lead = crm.create_lead(customer_data)
    return str(lead)

@tool("Loan Booking")
def loan_booking(application_data: Dict[str, Any]) -> str:
    """Book a loan application in the system"""
    # This would connect to our loan booking engine
    from integrations.integration_services import LoanBookingEngine
    engine = LoanBookingEngine()
    application = engine.book_loan_application(application_data)
    return str(application)

class AgentOrchestrationSystem:
    """Main orchestration system for coordinating agents"""

    def __init__(self):
        # Initialize the LLM
        self.llm = ChatGroq(
            model=os.getenv("GROQ_MODEL", "llama3-70b-8192"),
            temperature=0.1,
            api_key=os.getenv("GROQ_API_KEY")
        )
        
        # Initialize agents
        self.orchestrator_agent = self._create_orchestrator_agent()
        self.sales_agent = self._create_sales_agent()
        self.verification_agent = self._create_verification_agent()
        self.underwriting_agent = self._create_underwriting_agent()
        self.sanction_agent = self._create_sanction_agent()
        
        # Initialize the crew
        self.crew = self._create_crew()
    
    def _create_orchestrator_agent(self):
        """Create the master orchestrator agent"""
        return Agent(
            role="Master Loan Application Orchestrator",
            goal="Control and coordinate the entire loan application process by routing tasks to appropriate specialized agents based on conversation stage and requirements",
            backstory="You are the central coordinator managing the loan application journey. Your role is to understand where each customer is in the process and route their needs to the most appropriate specialized agent. You maintain the overall context and state of each application.",
            verbose=True,
            allow_delegation=True,
            tools=[],
            llm=self.llm
        )
    
    def _create_sales_agent(self):
        """Create the sales agent"""
        return Agent(
            role="Personal Loan Sales Specialist",
            goal="Engage with customers, understand their loan requirements, and guide them through the initial consultation process",
            backstory="You are an experienced loan consultant who specializes in personal loans. You understand customer needs, explain loan products, handle objections, and gather all necessary information to move the application forward.",
            verbose=True,
            allow_delegation=True,
            tools=[knowledge_base_search],
            llm=self.llm
        )
    
    def _create_verification_agent(self):
        """Create the verification agent"""
        return Agent(
            role="Customer Verification Specialist",
            goal="Verify customer information including credit score, KYC details, and income verification",
            backstory="You are responsible for checking customer eligibility by verifying credit scores, performing KYC checks, and validating income details. You interface with credit bureaus and internal verification systems.",
            verbose=True,
            allow_delegation=True,
            tools=[credit_bureau_verification, knowledge_base_search],
            llm=self.llm
        )
    
    def _create_underwriting_agent(self):
        """Create the underwriting agent"""
        return Agent(
            role="Loan Underwriting Specialist",
            goal="Apply business rules to evaluate loan applications and make approval decisions",
            backstory="You are an expert in loan underwriting with deep knowledge of risk assessment, eligibility criteria, and business rules. You evaluate applications based on creditworthiness, income, and other factors to make approval decisions.",
            verbose=True,
            allow_delegation=True,
            tools=[knowledge_base_search],
            llm=self.llm
        )
    
    def _create_sanction_agent(self):
        """Create the sanction letter agent"""
        return Agent(
            role="Sanction Letter Generator",
            goal="Generate professional sanction letters and loan documentation based on approved applications",
            backstory="You specialize in creating formal loan sanction documents that comply with regulatory requirements. You generate accurate, professional documents that clearly communicate terms and conditions.",
            verbose=True,
            allow_delegation=True,
            tools=[knowledge_base_search],
            llm=self.llm
        )
    
    def _create_crew(self):
        """Create the crew with all agents"""
        return Crew(
            agents=[self.orchestrator_agent, self.sales_agent, self.verification_agent, 
                   self.underwriting_agent, self.sanction_agent],
            verbose=2,
            memory=True
        )
    
    def process_loan_application(self, customer_query: str, customer_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Process a loan application through the agent crew"""
        # Define the initial task that goes to the orchestrator
        initial_task = Task(
            description=f"Process this loan application query: {customer_query}. "
                       f"Customer context: {customer_context if customer_context else 'No prior context'}. "
                       f"Coordinate with other agents as needed to complete the loan application process.",
            expected_output="A complete loan application outcome with status, eligibility, and any required actions",
            agent=self.orchestrator_agent
        )
        
        # Execute the crew
        result = self.crew.kickoff([initial_task])
        
        return {
            "result": result,
            "status": "completed",
            "next_steps": ["review_application", "document_generation"]
        }
    
    def route_task_by_stage(self, stage: str, task_details: str, customer_context: Dict[str, Any]) -> str:
        """Route tasks based on the current stage of the loan application"""
        if stage == "engagement":
            task = Task(
                description=f"Engage with customer query: {task_details}. Gather loan requirements including amount, purpose, salary, employment status, and city.",
                expected_output="Structured loan requirements from customer",
                agent=self.sales_agent
            )
        elif stage == "needs_assessment":
            task = Task(
                description=f"Assess customer needs based on: {task_details}. Explain loan products and address any concerns.",
                expected_output="Needs assessment and product recommendations",
                agent=self.sales_agent
            )
        elif stage == "verification":
            task = Task(
                description=f"Verify customer details: {task_details}. Check credit score and validate information.",
                expected_output="Verification results with eligibility status",
                agent=self.verification_agent
            )
        elif stage == "underwriting":
            task = Task(
                description=f"Evaluate loan application: {task_details}. Apply business rules and make approval decision.",
                expected_output="Underwriting decision with risk assessment",
                agent=self.underwriting_agent
            )
        elif stage == "sanction":
            task = Task(
                description=f"Generate sanction documentation for: {task_details}. Create formal loan approval document.",
                expected_output="Sanction letter and loan terms document",
                agent=self.sanction_agent
            )
        else:
            task = Task(
                description=f"Handle customer query: {task_details}. Determine appropriate action based on context.",
                expected_output="Appropriate response and next steps",
                agent=self.orchestrator_agent
            )
        
        return self.crew.kickoff([task])

# Example usage
if __name__ == "__main__":
    # Initialize the orchestration system
    agent_system = AgentOrchestrationSystem()
    
    # Example customer query
    customer_query = "I want to apply for a personal loan of 20 lakhs for home renovation. My salary is 80k per month."
    customer_context = {
        "name": "John Doe",
        "mobile": "9876543210",
        "email": "john.doe@example.com",
        "location": "Mumbai"
    }
    
    # Process the loan application
    result = agent_system.process_loan_application(customer_query, customer_context)
    print(result)