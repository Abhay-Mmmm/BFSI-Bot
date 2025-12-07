# Master Orchestrator Agent for PRIMUM AI Sales Orchestration Platform

from crewai import Agent, LLM
from typing import Dict, Any
import os
from dotenv import load_dotenv

load_dotenv()

class MasterOrchestratorAgent:
    """Master Orchestrator Agent that controls flow state of every conversation"""

    def __init__(self):
        self.llm = LLM(
            model="groq/" + os.getenv("GROQ_MODEL", "llama3-70b-8192"),
            temperature=0.1,
            api_key=os.getenv("GROQ_API_KEY")
        )

        self.agent = self._create_agent()
        self.conversation_state = {}

    def _create_agent(self):
        """Create the orchestrator agent"""
        return Agent(
            role="Master Loan Application Orchestrator",
            goal="Control and coordinate the entire loan application process by routing tasks to appropriate specialized agents based on conversation stage and requirements",
            backstory="""
            You are the central coordinator managing the loan application journey. Your role is to understand where each customer is in the process and route their needs to the most appropriate specialized agent. You maintain the overall context and state of each application and ensure a seamless customer experience.

            Your responsibilities include:
            1. Tracking the stage of each conversation (engagement → needs assessment → verification → underwriting → sanction → closure)
            2. Routing customer queries to the appropriate specialized agent
            3. Maintaining context and state between different agent interactions
            4. Handling transitions between stages of the loan process
            5. Ensuring all required information is collected before moving to the next stage
            """,
            verbose=True,
            allow_delegation=True,
            llm=self.llm
        )
    
    def route_task(self, conversation_id: str, task_details: str, stage: str = None) -> str:
        """Route tasks to relevant agents based on conversation stage"""
        if stage is None:
            stage = self.get_conversation_stage(conversation_id)
        
        routing_map = {
            "engagement": "Sales Agent",
            "needs_assessment": "Sales Agent", 
            "verification": "Verification Agent",
            "underwriting": "Underwriting Agent",
            "sanction": "Sanction Agent",
            "closure": "Sanction Agent"  # Handled by same as sanction
        }
        
        target_agent = routing_map.get(stage, "Sales Agent")
        return target_agent
    
    def update_conversation_state(self, conversation_id: str, state_data: Dict[str, Any]):
        """Update conversation state"""
        if conversation_id not in self.conversation_state:
            self.conversation_state[conversation_id] = {}
        
        self.conversation_state[conversation_id].update(state_data)
    
    def get_conversation_stage(self, conversation_id: str) -> str:
        """Get current conversation stage"""
        if conversation_id in self.conversation_state:
            return self.conversation_state[conversation_id].get("stage", "engagement")
        return "engagement"
    
    def get_agent(self):
        """Return the orchestrator agent"""
        return self.agent