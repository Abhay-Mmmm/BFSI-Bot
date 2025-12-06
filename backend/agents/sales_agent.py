# Sales Agent for PRIMUM AI Sales Orchestration Platform

from crewai import Agent, Task
from langchain_groq import ChatGroq
from langchain.tools import tool
from typing import Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

from langchain.tools import tool

# Define tools for the sales agent
@tool("Knowledge Base Search")
def knowledge_base_search(query: str) -> str:
    """Search the knowledge base for product information, eligibility criteria, and FAQs"""
    # This would connect to our RAG system
    from rag.knowledge_base import KnowledgeBase
    kb = KnowledgeBase()
    results = kb.search(query)
    return str(results)

class SalesAgent:
    """Sales Agent for conversational persuasion and requirement gathering"""

    def __init__(self):
        self.llm = ChatGroq(
            model=os.getenv("GROQ_MODEL", "llama3-70b-8192"),
            temperature=0.7,  # Higher temperature for more conversational responses
            api_key=os.getenv("GROQ_API_KEY")
        )

        self.agent = self._create_agent()

    def _create_agent(self):
        """Create the sales agent"""
        return Agent(
            role="Personal Loan Sales Specialist",
            goal="Engage with customers, understand their loan requirements, handle objections, and guide them through the initial consultation process",
            backstory="""
            You are an experienced loan consultant who specializes in personal loans. Your goal is to understand customer needs, explain loan products in simple terms, handle objections professionally, and gather all necessary information to move the application forward.

            Your approach:
            1. Start with friendly engagement and understand their loan purpose
            2. Collect required information: loan amount, salary, employment status, city, and EMI preference
            3. Address concerns and provide clear explanations using knowledge base
            4. Guide the customer to the next stage when requirements are met
            5. Always maintain a helpful, professional, and empathetic tone
            """,
            verbose=True,
            allow_delegation=True,
            tools=[knowledge_base_search],
            llm=self.llm
        )
    
    def create_requirements_gathering_task(self, customer_query: str) -> Task:
        """Create a task for gathering loan requirements"""
        return Task(
            description=f"""
            Engage with the customer based on their query: '{customer_query}'
            
            Your goal is to gather the following information:
            1. Loan amount requested
            2. Purpose of the loan
            3. Monthly salary/income
            4. Employment status (salaried/self-employed)
            5. City of residence
            6. Preferred EMI amount or tenure
            
            Use a conversational approach, answer any questions they have about loan products,
            and address any concerns. If they ask about interest rates, EMI calculations, 
            or eligibility, use the knowledge base search tool to provide accurate information.
            """,
            expected_output="Structured format containing all required loan information and customer concerns addressed",
            agent=self.agent
        )
    
    def create_objection_handling_task(self, objection: str) -> Task:
        """Create a task for handling customer objections"""
        return Task(
            description=f"""
            Handle this customer objection: '{objection}'
            
            Provide a thoughtful, empathetic response that addresses their concern.
            If the objection is about interest rates, use the knowledge base to explain
            our competitive rates and any special offers.
            If it's about documentation, explain the simple process.
            If it's about eligibility, provide reassurance that we have solutions for various profiles.
            Always maintain a positive tone and try to move the conversation forward.
            """,
            expected_output="Appropriate response to the objection that maintains customer engagement",
            agent=self.agent
        )
    
    def create_product_explanation_task(self, query: str) -> Task:
        """Create a task for explaining loan products"""
        return Task(
            description=f"""
            Explain our personal loan products in response to: '{query}'
            
            Use the knowledge base search tool to provide accurate information about:
            - Interest rates and how they are determined
            - Eligibility criteria
            - Required documents
            - Processing time
            - Special features or benefits
            - EMI calculation and tenures available
            
            Explain in simple terms that a non-financial person can understand.
            """,
            expected_output="Clear, concise explanation of loan products with relevant details",
            agent=self.agent
        )
    
    def get_agent(self):
        """Return the sales agent"""
        return self.agent