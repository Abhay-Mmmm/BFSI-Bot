# Verification Agent for PRIMUM AI Sales Orchestration Platform

from crewai import Agent, Task
from langchain_groq import ChatGroq
from langchain.tools import tool
from typing import Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

from langchain.tools import tool

# Define tools for the verification agent
@tool("Credit Bureau Verification")
def credit_bureau_verification(identifier: str, identifier_type: str = "mobile") -> str:
    """Verify customer's credit score and history"""
    # This would connect to our credit bureau simulation
    from integrations.integration_services import CreditBureauAPI
    api = CreditBureauAPI()
    result = api.get_credit_report(identifier, identifier_type)
    return str(result)

@tool("Knowledge Base Search")
def knowledge_base_search(query: str) -> str:
    """Search the knowledge base for verification procedures and policies"""
    # This would connect to our RAG system
    from rag.knowledge_base import KnowledgeBase
    kb = KnowledgeBase()
    results = kb.search(query)
    return str(results)

class VerificationAgent:
    """Verification Agent for credit score, KYC, and salary validation"""

    def __init__(self):
        self.llm = ChatGroq(
            model=os.getenv("GROQ_MODEL", "llama3-70b-8192"),
            temperature=0.1,  # Lower temperature for factual responses
            api_key=os.getenv("GROQ_API_KEY")
        )

        self.agent = self._create_agent()

    def _create_agent(self):
        """Create the verification agent"""
        return Agent(
            role="Customer Verification Specialist",
            goal="Verify customer information including credit score, KYC details, and income verification to assess eligibility for personal loans",
            backstory="""
            You are a specialized verification expert responsible for checking customer eligibility by verifying credit scores, performing KYC checks, and validating income details. You interface with credit bureaus and internal verification systems.

            Your tasks include:
            1. Retrieving and analyzing credit reports
            2. Verifying identity and KYC information
            3. Validating income claims through available data
            4. Assessing risk based on verification results
            5. Providing clear eligibility assessment to underwriting team
            """,
            verbose=True,
            allow_delegation=True,
            tools=[credit_bureau_verification, knowledge_base_search],
            llm=self.llm
        )
    
    def create_credit_verification_task(self, customer_info: Dict[str, Any]) -> Task:
        """Create a task for credit verification"""
        identifier = customer_info.get("mobile", customer_info.get("email", customer_info.get("customer_id", "unknown")))
        identifier_type = "mobile" if "mobile" in customer_info else "email" if "email" in customer_info else "customer_id"
        
        return Task(
            description=f"""
            Perform comprehensive verification for customer with identifier: {identifier} ({identifier_type}).
            
            Specifically:
            1. Retrieve credit report using the credit bureau verification tool
            2. Analyze credit score and history
            3. Check for any negative factors (defaults, late payments, etc.)
            4. Verify identity information if possible
            5. Assess overall creditworthiness
            
            Customer information: {customer_info}
            
            Provide a detailed verification report with:
            - Credit score and rating
            - Credit history length
            - Number of accounts and status
            - Any red flags or concerns
            - Eligibility assessment based on credit data
            """,
            expected_output="Comprehensive verification report with credit analysis and eligibility assessment",
            agent=self.agent
        )
    
    def create_eligibility_assessment_task(self, verification_data: Dict[str, Any]) -> Task:
        """Create a task for eligibility assessment based on verification data"""
        return Task(
            description=f"""
            Based on the verification data: {verification_data}, assess the customer's eligibility for a personal loan.
            
            Consider the following factors:
            1. Credit score (higher is better)
            2. Credit history length (longer is better)
            3. Account status (active accounts in good standing preferred)
            4. Any red flags like defaults or late payments
            5. Income to loan ratio (if available)
            
            Apply our internal eligibility rules:
            - Credit score >= 700: High eligibility
            - Credit score 650-699: Medium eligibility
            - Credit score 600-649: Low eligibility (additional documentation required)
            - Credit score < 600: Likely not eligible
            
            Provide clear eligibility determination with reasons.
            """,
            expected_output="Eligibility assessment with clear pass/fail determination and reasons",
            agent=self.agent
        )
    
    def create_risk_assessment_task(self, verification_results: Dict[str, Any]) -> Task:
        """Create a task for risk assessment"""
        return Task(
            description=f"""
            Perform risk assessment based on verification results: {verification_results}
            
            Consider:
            1. Credit score and trend
            2. Payment history
            3. Credit utilization
            4. Length of credit history
            5. Types of credit accounts
            6. Recent inquiries
            
            Provide a risk score and categorization (Low/Medium/High) with justification.
            """,
            expected_output="Risk assessment with score and categorization with detailed justification",
            agent=self.agent
        )
    
    def get_agent(self):
        """Return the verification agent"""
        return self.agent