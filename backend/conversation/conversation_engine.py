# Conversation Engine for PRIMUM AI Sales Orchestration Platform
# Manages dialogue state, detects objections, and routes to appropriate agents

from typing import Dict, Any, List
from enum import Enum
import uuid
from datetime import datetime
import re


class ConversationStage(Enum):
    ENGAGEMENT = "engagement"
    NEEDS_ASSESSMENT = "needs_assessment"
    VERIFICATION = "verification"
    UNDERWRITING = "underwriting"
    SANCTION = "sanction"
    CLOSURE = "closure"


class ConversationEngine:
    """Conversation Engine to manage dialogue state and agent routing"""
    
    def __init__(self, knowledge_base, rule_engine, orchestrator_agent):
        self.knowledge_base = knowledge_base
        self.rule_engine = rule_engine
        self.orchestrator = orchestrator_agent
        self.conversations = {}
        
        # Define objection patterns
        self.objection_patterns = [
            {"pattern": r"(expensive|costly|too much|high|price|fee)", "type": "cost_concern"},
            {"pattern": r"(not sure|unsure|doubt|think about it|consider)", "type": "uncertainty"},
            {"pattern": r"(need to think|think about|consider|consult|discuss)", "type": "delay"},
            {"pattern": r"(not interested|not need|no need|not looking)", "type": "not_interested"},
            {"pattern": r"(bad credit|credit score|credit history)", "type": "credit_concern"},
            {"pattern": r"(complicated|difficult|complex|hard|tricky)", "type": "process_concern"},
            {"pattern": r"(bank|other institution|another place|competitor)", "type": "alternative"},
        ]
    
    def start_conversation(self) -> str:
        """Start a new conversation and return conversation ID"""
        conversation_id = str(uuid.uuid4())
        self.conversations[conversation_id] = {
            "id": conversation_id,
            "stage": ConversationStage.ENGAGEMENT,
            "messages": [],
            "customer_data": {},
            "loan_application": {},
            "created_at": datetime.now(),
            "last_updated": datetime.now()
        }
        return conversation_id
    
    def process_message(self, conversation_id: str, message: str) -> Dict[str, Any]:
        """Process a user message and return the AI response"""
        if conversation_id not in self.conversations:
            conversation_id = self.start_conversation()
        
        conversation = self.conversations[conversation_id]
        
        # Add user message to conversation
        user_message = {
            "role": "user",
            "content": message,
            "timestamp": datetime.now()
        }
        conversation["messages"].append(user_message)
        
        # Determine conversation stage and route to appropriate agent
        stage = self._determine_stage(conversation, message)
        conversation["stage"] = stage
        
        # Detect objections
        objection = self._detect_objection(message)
        
        # Route to appropriate agent based on stage and objection
        agent_response = self._route_to_agent(conversation_id, message, stage, objection)
        
        # Add assistant response to conversation
        assistant_message = {
            "role": "assistant",
            "content": agent_response.get("response", ""),
            "timestamp": datetime.now(),
            "stage": stage.value,
            "next_action": agent_response.get("next_action", ""),
            "actions": agent_response.get("actions", [])
        }
        conversation["messages"].append(assistant_message)
        
        # Update last updated timestamp
        conversation["last_updated"] = datetime.now()
        
        # Get relevant knowledge from RAG
        knowledge_context = self.knowledge_base.search(message)
        
        return {
            "conversation_id": conversation_id,
            "response": agent_response.get("response", ""),
            "stage": stage.value,
            "objection_detected": objection,
            "knowledge_context": knowledge_context,
            "actions": agent_response.get("actions", []),
            "customer_data": conversation["customer_data"],
            "loan_application": conversation["loan_application"],
            "next_steps": agent_response.get("next_steps", [])
        }
    
    def _determine_stage(self, conversation: Dict[str, Any], message: str) -> ConversationStage:
        """Determine the current conversation stage based on context"""
        stage = conversation.get("stage", ConversationStage.ENGAGEMENT)
        
        # If we're in engagement and user provides requirements, move to needs assessment
        if stage == ConversationStage.ENGAGEMENT:
            if self._has_loan_requirements(message) or "loan" in message.lower():
                return ConversationStage.NEEDS_ASSESSMENT
        
        # If we're in needs assessment and have collected requirements, move to verification
        elif stage == ConversationStage.NEEDS_ASSESSMENT:
            if self._requirements_complete(conversation):
                return ConversationStage.VERIFICATION
        
        # If verification is complete, move to underwriting
        elif stage == ConversationStage.VERIFICATION:
            verification_complete = conversation["loan_application"].get("verification_complete", False)
            if verification_complete:
                return ConversationStage.UNDERWRITING
        
        # If underwriting is complete, move to sanction
        elif stage == ConversationStage.UNDERWRITING:
            underwriting_complete = conversation["loan_application"].get("underwriting_complete", False)
            if underwriting_complete:
                return ConversationStage.SANCTION
        
        # If sanction is complete, move to closure
        elif stage == ConversationStage.SANCTION:
            sanction_complete = conversation["loan_application"].get("sanction_complete", False)
            if sanction_complete:
                return ConversationStage.CLOSURE
        
        return stage
    
    def _has_loan_requirements(self, message: str) -> bool:
        """Check if message contains loan requirements"""
        loan_keywords = ["loan", "amount", "borrow", "need", "want", "apply"]
        requirement_keywords = ["salary", "income", "job", "employment", "city", "purpose"]
        
        message_lower = message.lower()
        return any(keyword in message_lower for keyword in loan_keywords) and \
               any(keyword in message_lower for keyword in requirement_keywords)
    
    def _requirements_complete(self, conversation: Dict[str, Any]) -> bool:
        """Check if loan requirements are complete"""
        required_fields = ["loan_amount", "salary", "employment_status", "city"]
        loan_application = conversation.get("loan_application", {})
        
        return all(field in loan_application for field in required_fields)
    
    def _detect_objection(self, message: str) -> Dict[str, Any]:
        """Detect if the customer has raised an objection"""
        for obj_pattern in self.objection_patterns:
            if re.search(obj_pattern["pattern"], message.lower(), re.IGNORECASE):
                return {
                    "type": obj_pattern["type"],
                    "message": message,
                    "pattern_matched": obj_pattern["pattern"]
                }
        
        return None
    
    def _route_to_agent(self, conversation_id: str, message: str, stage: ConversationStage, objection: Dict[str, Any]) -> Dict[str, Any]:
        """Route the message to the appropriate agent based on stage and objection"""
        
        if objection:
            # Handle objections first
            agent_name = self.orchestrator.route_task(conversation_id, "objection_handling")
            return self._handle_objection(objection)
        
        # Route based on conversation stage
        agent_name = self.orchestrator.route_task(conversation_id, f"stage_{stage.value}")
        
        # Get agent from orchestrator (in a real system, this would be a proper agent call)
        if stage == ConversationStage.ENGAGEMENT:
            return self._handle_engagement(message)
        elif stage == ConversationStage.NEEDS_ASSESSMENT:
            return self._handle_needs_assessment(conversation_id, message)
        elif stage == ConversationStage.VERIFICATION:
            return self._handle_verification(conversation_id)
        elif stage == ConversationStage.UNDERWRITING:
            return self._handle_underwriting(conversation_id)
        elif stage == ConversationStage.SANCTION:
            return self._handle_sanction(conversation_id)
        elif stage == ConversationStage.CLOSURE:
            return self._handle_closure(conversation_id)
        else:
            return {"response": "I'm here to help you with your personal loan application. How can I assist you today?"}
    
    def _handle_objection(self, objection: Dict[str, Any]) -> Dict[str, Any]:
        """Handle detected objections"""
        objection_type = objection["type"]
        
        responses = {
            "cost_concern": "I understand you're concerned about the cost. We offer competitive rates starting from 10.5%, and I can show you how our EMI calculator works to find an affordable option for you.",
            "uncertainty": "It's completely normal to want time to consider. I can provide you with all the details and answer any questions you might have to help you make an informed decision.",
            "delay": "I understand you need time to think about it. Would it help if I provided you with a summary of the benefits and terms so you can review them?",
            "not_interested": "I understand. Is there a specific reason you're not interested? Perhaps I can address any concerns you might have.",
            "credit_concern": "Don't worry about your credit score. We have solutions for various credit profiles, and I can guide you on how to improve your eligibility.",
            "process_concern": "I assure you that our loan process is simple and straightforward. I'll guide you through each step, and you'll find it quite easy.",
            "alternative": "I understand you might be comparing options. I can highlight what makes our personal loan offering unique and why many customers choose us."
        }
        
        response = responses.get(objection_type, "I understand your concern. Can you please share more details so I can assist you better?")
        
        return {
            "response": response,
            "next_action": "address_concern",
            "actions": ["provide_reassurance", "offer_additional_info"]
        }
    
    def _handle_engagement(self, message: str) -> Dict[str, Any]:
        """Handle engagement stage"""
        response = "Hello! I'm here to help you with your personal loan application. To get started, could you please tell me the loan amount you're looking for and your monthly salary?"
        return {
            "response": response,
            "next_action": "gather_requirements",
            "actions": ["ask_loan_amount", "ask_salary"]
        }
    
    def _handle_needs_assessment(self, conversation_id: str, message: str) -> Dict[str, Any]:
        """Handle needs assessment stage"""
        # Extract requirements from message
        self._extract_requirements(conversation_id, message)
        
        # Check if we have all requirements
        conversation = self.conversations[conversation_id]
        loan_app = conversation["loan_application"]
        
        if "loan_amount" in loan_app and "salary" in loan_app:
            response = f"Thank you for providing the details. I see you're looking for a loan of ₹{loan_app.get('loan_amount')} with a salary of ₹{loan_app.get('salary')}. Now I'll verify your eligibility."
            next_action = "start_verification"
        else:
            response = "Could you please provide your employment status and city of residence to proceed with your application?"
            next_action = "gather_remaining_requirements"
        
        return {
            "response": response,
            "next_action": next_action,
            "actions": ["continue_gathering_info"]
        }
    
    def _extract_requirements(self, conversation_id: str, message: str):
        """Extract loan requirements from message"""
        conversation = self.conversations[conversation_id]
        loan_app = conversation["loan_application"]
        
        # Simple extraction - in a real system, this would use NLP
        message_lower = message.lower()
        
        # Extract loan amount (simple approach)
        import re
        amount_matches = re.findall(r'\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b', message)
        if amount_matches:
            # Assume the largest number is the loan amount
            amounts = [int(amount.replace(',', '')) for amount in amount_matches if int(amount.replace(',', '')) > 10000]
            if amounts:
                loan_app["loan_amount"] = max(amounts)
        
        # Extract salary
        salary_phrases = ["salary", "income", "earning", "pay", "monthly"]
        for phrase in salary_phrases:
            if phrase in message_lower:
                salary_matches = re.findall(r'\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b', message[message_lower.find(phrase):])
                if salary_matches:
                    salaries = [int(salary.replace(',', '')) for salary in salary_matches if int(salary.replace(',', '')) > 10000]
                    if salaries:
                        loan_app["salary"] = max(salaries)
                        break
        
        # Extract employment status
        if "salaried" in message_lower or "employee" in message_lower:
            loan_app["employment_status"] = "salaried"
        elif "business" in message_lower or "self-employed" in message_lower or "entrepreneur" in message_lower:
            loan_app["employment_status"] = "self_employed"
        
        # Extract city
        city_keywords = ["city", "location", "residing", "live"]
        if any(keyword in message_lower for keyword in city_keywords):
            # In a real system, this would extract the actual city name
            loan_app["city"] = "Mumbai"  # Placeholder
        
        # Update conversation
        conversation["loan_application"] = loan_app
        self.conversations[conversation_id] = conversation
    
    def _handle_verification(self, conversation_id: str) -> Dict[str, Any]:
        """Handle verification stage"""
        # In a real system, this would call the verification agent
        response = "I'm now verifying your details with our system. This will help determine your eligible loan amount."
        
        # Mock verification result
        verification_result = {
            "credit_score": 750,
            "kyc_status": "verified",
            "salary_verified": True,
            "eligible_limit": 2500000,
            "risk_flag": "low",
            "document_status": "complete"
        }
        
        # Update conversation with verification results
        conversation = self.conversations[conversation_id]
        conversation["loan_application"].update(verification_result)
        conversation["loan_application"]["verification_complete"] = True
        self.conversations[conversation_id] = conversation
        
        next_response = f"Great news! Your verification is complete. Based on your credit score of {verification_result['credit_score']} and verified salary, you're eligible for a loan up to ₹{verification_result['eligible_limit']:,}."
        
        return {
            "response": response + "\n\n" + next_response,
            "next_action": "start_underwriting",
            "actions": ["verify_credit", "verify_kyc", "calculate_eligibility"]
        }
    
    def _handle_underwriting(self, conversation_id: str) -> Dict[str, Any]:
        """Handle underwriting stage"""
        conversation = self.conversations[conversation_id]
        loan_app = conversation["loan_application"]
        
        # Apply business rules using rule engine
        rule_result = self.rule_engine.determine_approval_path(loan_app)
        
        # Determine next step based on rule result
        if rule_result["path"] == "instant_approval":
            response = "Great news! Your loan application has been approved instantly based on your strong credentials."
            loan_app["decision"] = "approved"
            loan_app["reason"] = rule_result["reason"]
        elif rule_result["path"] == "conditional_approval":
            response = "Your application qualifies for conditional approval. We'll need to review your salary slip to finalize the approval."
            loan_app["decision"] = "conditional"
            loan_app["reason"] = rule_result["reason"]
        else:
            response = "We're processing your application and will verify a few more details before making a decision."
            loan_app["decision"] = "under_review"
            loan_app["reason"] = rule_result["reason"]
        
        # Update conversation
        loan_app["underwriting_complete"] = True
        conversation["loan_application"] = loan_app
        self.conversations[conversation_id] = conversation
        
        return {
            "response": response,
            "next_action": "prepare_sanction",
            "actions": ["apply_business_rules", "calculate_risk", "make_decision"]
        }
    
    def _handle_sanction(self, conversation_id: str) -> Dict[str, Any]:
        """Handle sanction stage"""
        conversation = self.conversations[conversation_id]
        loan_app = conversation["loan_application"]
        
        # Prepare sanction details
        sanction_details = {
            "loan_amount": loan_app.get("loan_amount", 0),
            "interest_rate": 10.5,  # This would come from underwriting
            "emi_amount": 0,  # Calculate based on loan amount and tenure
            "tenure_months": 60,
            "processing_fee": loan_app.get("loan_amount", 0) * 0.02,  # 2% processing fee
            "document_requirements": [] if loan_app.get("decision") == "approved" else ["salary_slip"]
        }
        
        # Calculate EMI
        p = sanction_details["loan_amount"]
        r = sanction_details["interest_rate"] / 12 / 100
        n = sanction_details["tenure_months"]
        if p > 0 and r > 0 and n > 0:
            emi = p * r * ((1 + r) ** n) / (((1 + r) ** n) - 1)
            sanction_details["emi_amount"] = round(emi, 2)
        
        # Update loan application with sanction details
        loan_app.update(sanction_details)
        loan_app["sanction_complete"] = True
        conversation["loan_application"] = loan_app
        self.conversations[conversation_id] = conversation
        
        # Prepare response
        emi_amount = sanction_details["emi_amount"]
        response = f"Your loan has been sanctioned! Here are the details:\n"
        response += f"- Sanctioned Amount: ₹{sanction_details['loan_amount']:,}\n"
        response += f"- Interest Rate: {sanction_details['interest_rate']}%\n"
        response += f"- Monthly EMI: ₹{emi_amount:,}\n"
        response += f"- Tenure: {sanction_details['tenure_months']} months\n"
        response += f"- Processing Fee: ₹{sanction_details['processing_fee']:,}\n\n"
        response += "I'll now generate your sanction letter for download."
        
        return {
            "response": response,
            "next_action": "generate_sanction_letter",
            "actions": ["calculate_sanction", "generate_document"]
        }
    
    def _handle_closure(self, conversation_id: str) -> Dict[str, Any]:
        """Handle closure stage"""
        response = "Congratulations! Your loan application is complete. Your sanction letter is ready for download. A relationship manager will contact you shortly to complete the documentation process."
        
        return {
            "response": response,
            "next_action": "complete_application",
            "actions": ["send_confirmation", "schedule_follow_up"]
        }
    
    def get_conversation_history(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get conversation history for a specific conversation"""
        if conversation_id in self.conversations:
            return self.conversations[conversation_id]["messages"]
        return []
    
    def get_conversation_state(self, conversation_id: str) -> Dict[str, Any]:
        """Get the current state of a conversation"""
        if conversation_id in self.conversations:
            return {
                "id": conversation_id,
                "stage": self.conversations[conversation_id]["stage"].value,
                "customer_data": self.conversations[conversation_id]["customer_data"],
                "loan_application": self.conversations[conversation_id]["loan_application"],
                "created_at": self.conversations[conversation_id]["created_at"],
                "last_updated": self.conversations[conversation_id]["last_updated"]
            }
        return {}


# Example usage
if __name__ == "__main__":
    # This would typically be initialized with actual agents and services
    print("Conversation Engine initialized")