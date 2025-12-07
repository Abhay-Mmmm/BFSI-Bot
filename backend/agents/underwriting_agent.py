# Underwriting Agent for PRIMUM AI Sales Orchestration Platform

from crewai import Agent, Task, LLM
from crewai.tools import tool
from typing import Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

# Define tools for the underwriting agent
@tool("Rule Engine")
def rule_engine_evaluation(application_data: Dict[str, Any]) -> str:
    """Evaluate loan application using business rules"""
    # This would connect to our rule engine
    from rules.rule_engine import RuleEngine
    rule_engine = RuleEngine()

    # Determine approval path
    approval_result = rule_engine.determine_approval_path(application_data)

    # Evaluate credit risk
    risk_result = rule_engine.evaluate_credit_risk(application_data)

    # Check for human escalation
    escalation_result = rule_engine.determine_human_escalation(application_data)

    return str({
        "approval_path": approval_result,
        "risk_evaluation": risk_result,
        "escalation_needed": escalation_result
    })

@tool("Knowledge Base Search")
def knowledge_base_search(query: str) -> str:
    """Search the knowledge base for underwriting policies and procedures"""
    # This would connect to our RAG system
    from rag.knowledge_base import KnowledgeBase
    kb = KnowledgeBase()
    results = kb.search(query)
    return str(results)

class UnderwritingAgent:
    """Underwriting Agent for rule-based decisions"""

    def __init__(self):
        self.llm = LLM(
            model="groq/" + os.getenv("GROQ_MODEL", "llama3-70b-8192"),
            temperature=0.1,  # Lower temperature for factual, rule-based responses
            api_key=os.getenv("GROQ_API_KEY")
        )

        self.agent = self._create_agent()

    def _create_agent(self):
        """Create the underwriting agent"""
        return Agent(
            role="Loan Underwriting Specialist",
            goal="Apply business rules to evaluate loan applications and make approval decisions based on risk assessment and eligibility criteria",
            backstory="""
            You are an expert in loan underwriting with deep knowledge of risk assessment, eligibility criteria, and business rules. You evaluate applications based on creditworthiness, income, employment status, and other factors to make approval decisions.

            Your responsibilities:
            1. Apply deterministic business rules for loan approval
            2. Assess risk based on credit score, income, and other factors
            3. Determine appropriate loan terms (amount, rate, tenure)
            4. Identify cases requiring human escalation
            5. Generate clear underwriting decision with justification
            """,
            verbose=True,
            allow_delegation=True,
            tools=[rule_engine_evaluation, knowledge_base_search],
            llm=self.llm
        )
    
    def create_underwriting_evaluation_task(self, application_data: Dict[str, Any]) -> Task:
        """Create a task for underwriting evaluation"""
        return Task(
            description=f"""
            Perform comprehensive underwriting evaluation for loan application: {application_data}
            
            Your evaluation should:
            1. Apply business rules using the rule engine tool
            2. Assess credit risk and determine risk category
            3. Calculate appropriate loan terms
            4. Identify any issues or concerns
            5. Determine final approval decision (Approve/Conditional/Reject)
            
            Business rules to consider:
            - If loan amount <= pre-approved limit: Instant approval
            - If loan amount <= 2x eligible limit: Conditional approval (salary slip required)
            - If credit score < 700 OR loan > 2x eligible limit: Review/possible rejection
            - For high-value loans (>50 lakhs): Flag for human review
            - Calculate EMI as loan amount / tenure with applicable interest rate
            """,
            expected_output="Complete underwriting report with decision, terms, risk assessment, and justification",
            agent=self.agent
        )
    
    def create_risk_analysis_task(self, application_data: Dict[str, Any]) -> Task:
        """Create a task for risk analysis"""
        return Task(
            description=f"""
            Perform detailed risk analysis for: {application_data}
            
            Consider:
            1. Credit score and trend
            2. Debt-to-income ratio
            3. Employment stability
            4. Loan-to-income ratio
            5. Past credit behavior
            6. Current economic factors that might affect repayment
            
            Provide risk score (1-100) and risk category (Low/Medium/High/Critical).
            """,
            expected_output="Risk analysis with score, category, and detailed factors",
            agent=self.agent
        )
    
    def create_terms_calculation_task(self, underwriting_data: Dict[str, Any]) -> Task:
        """Create a task for calculating loan terms"""
        return Task(
            description=f"""
            Calculate appropriate loan terms based on underwriting data: {underwriting_data}
            
            Calculate:
            1. Maximum eligible loan amount
            2. Appropriate interest rate based on risk profile
            3. Recommended tenure options
            4. Monthly EMI for different tenure options
            5. Total interest payable
            6. Processing fees
            
            Use standard EMI formula: EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
            Where P=Principal, R=monthly interest rate, N=number of months
            """,
            expected_output="Detailed loan terms with multiple tenure options and their EMIs",
            agent=self.agent
        )
    
    def create_approval_recommendation_task(self, evaluation_results: Dict[str, Any]) -> Task:
        """Create a task for final approval recommendation"""
        return Task(
            description=f"""
            Based on evaluation results: {evaluation_results}, provide a final approval recommendation.
            
            Your recommendation should include:
            1. Final decision (Approve/Conditional/Reject)
            2. Justification for the decision
            3. Any conditions for conditional approval
            4. Required documentation
            5. Suggested next steps
            6. Risk mitigation measures if applicable
            """,
            expected_output="Final approval recommendation with clear decision and justification",
            agent=self.agent
        )
    
    def get_agent(self):
        """Return the underwriting agent"""
        return self.agent