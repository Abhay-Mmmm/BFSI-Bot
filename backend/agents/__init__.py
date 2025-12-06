# Agent modules for PRIMUM AI Sales Orchestration Platform
# This file serves as the main entry point for all agents

from .orchestrator_agent import MasterOrchestratorAgent
from .sales_agent import SalesAgent
from .verification_agent import VerificationAgent
from .underwriting_agent import UnderwritingAgent
from .sanction_agent import SanctionLetterAgent
from .agent_orchestration import AgentOrchestrationSystem

# Backward compatibility for existing code
class OrchestratorAgent(MasterOrchestratorAgent):
    """Legacy compatibility class"""
    def __init__(self):
        super().__init__()

class AgentFactory:
    """Factory class to create and manage agents"""

    @staticmethod
    def create_all_agents():
        """Create instances of all agents"""
        return {
            'orchestrator': MasterOrchestratorAgent(),
            'sales': SalesAgent(),
            'verification': VerificationAgent(),
            'underwriting': UnderwritingAgent(),
            'sanction': SanctionLetterAgent()
        }

    @staticmethod
    def get_agent_orchestration_system():
        """Get the complete agent orchestration system"""
        return AgentOrchestrationSystem()

# For backward compatibility, expose the classes directly
__all__ = [
    'MasterOrchestratorAgent',
    'SalesAgent',
    'VerificationAgent',
    'UnderwritingAgent',
    'SanctionLetterAgent',
    'AgentOrchestrationSystem',
    'OrchestratorAgent',  # Legacy compatibility
    'AgentFactory'
]