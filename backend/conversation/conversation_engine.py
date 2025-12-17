# Conversation Engine for PRIMUM AI Sales Orchestration Platform
# Manages dialogue state, detects objections, and routes to appropriate agents

from typing import Dict, Any, List, Optional
from enum import Enum
import uuid
from datetime import datetime
import re
import os

# Import LLM Controller
try:
    from llm.llm_controller import LLMController
    LLM_AVAILABLE = True
except ImportError:
    print("Warning: LLM Controller not available. Using rule-based fallback.")
    LLM_AVAILABLE = False


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
        
        # Initialize LLM Controller if available
        self.use_llm = LLM_AVAILABLE and os.getenv("GROQ_API_KEY")
        if self.use_llm:
            self.llm_controller = LLMController()
            print("✅ LLM Controller initialized - Using Groq Llama-3.3-70B (FREE)")
        else:
            self.llm_controller = None
            print("⚠️  LLM not available - Using rule-based patterns")
        
        # Define objection patterns (fallback for non-LLM mode)
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
            "change_history": [],  # Track all changes for rollback
            "pending_changes": None,  # Store pending changes awaiting confirmation
            "created_at": datetime.now(),
            "last_updated": datetime.now()
        }
        return conversation_id
    
    def process_message(self, conversation_id: str, message: str) -> Dict[str, Any]:
        """Process a user message and return the AI response"""
        try:
            if conversation_id not in self.conversations:
                conversation_id = self.start_conversation()
            
            conversation = self.conversations[conversation_id]
            
            # Check if conversation has ended
            if conversation.get("conversation_ended", False):
                # Check if user wants to make changes
                message_lower = message.lower()
                wants_modification = any(word in message_lower for word in ['change', 'modify', 'update', 'adjust', 'different', 'want to'])
                
                if wants_modification:
                    # User wants to modify - reopen for modifications
                    conversation["conversation_ended"] = False
                    loan_app = conversation.get("loan_application", {})
                    
                    # Reset flags to allow re-processing
                    loan_app.pop("verification_complete", None)
                    loan_app.pop("underwriting_complete", None)
                    loan_app.pop("sanction_complete", None)
                    loan_app.pop("sanction_letter_generated", None)
                    
                    conversation["stage"] = ConversationStage.NEEDS_ASSESSMENT
                    conversation["loan_application"] = loan_app
                    self.conversations[conversation_id] = conversation
                    
                    # Extract what they want to change and process it
                    return self.process_message(conversation_id, message)
                else:
                    # Just asking questions after closure
                    return {
                        "conversation_id": conversation_id,
                        "response": "💬 **Do you need any help?**\n\nIf you'd like to start a new loan application, please click the '**New Chat**' button above.",
                        "stage": "closure",
                        "next_action": "offer_help",
                        "actions": [],
                        "conversation_ended": True
                    }
            
            # Check if message is unclear and generate suggestions
            suggestions = self._check_unclear_message(message, conversation)
            
            # Add user message to conversation
            user_message = {
                "role": "user",
                "content": message,
                "timestamp": datetime.now()
            }
            conversation["messages"].append(user_message)
            
            # Use LLM for intelligent routing if available
            if self.use_llm and self.llm_controller:
                agent_response = self._llm_route_message(conversation_id, message, conversation)
            else:
                # Fallback to rule-based routing
                # Determine conversation stage and route to appropriate agent
                stage = self._determine_stage(conversation, message)
                conversation["stage"] = stage
                
                # Detect objections
                objection = self._detect_objection(message)
                
                # Route to appropriate agent based on stage and objection
                agent_response = self._route_to_agent(conversation_id, message, stage, objection)
            
            # Get current stage (might have been updated by handlers)
            current_stage = conversation.get("stage", ConversationStage.ENGAGEMENT)
            if isinstance(current_stage, ConversationStage):
                stage_value = current_stage.value
            else:
                stage_value = current_stage
            
            # Add assistant response to conversation
            assistant_message = {
                "role": "assistant",
                "content": agent_response.get("response", ""),
                "timestamp": datetime.now(),
                "stage": stage_value,
                "next_action": agent_response.get("next_action", ""),
                "actions": agent_response.get("actions", [])
            }
            conversation["messages"].append(assistant_message)
            
            # Update last updated timestamp
            conversation["last_updated"] = datetime.now()
            
            # Get relevant knowledge from RAG
            try:
                knowledge_context = self.knowledge_base.search(message)
            except:
                knowledge_context = []
            
            # Detect objection for response (if not using LLM)
            objection = None if self.use_llm else self._detect_objection(message)
            
            return {
                "conversation_id": conversation_id,
                "response": agent_response.get("response", ""),
                "stage": stage_value,
                "objection_detected": objection,
                "customer_data": conversation.get("customer_data", {}),
                "loan_application": conversation.get("loan_application", {}),
                "knowledge_context": knowledge_context,
                "suggestions": suggestions,
                "verification_display": agent_response.get("verification_display")
            }
        except Exception as e:
            # Fallback response if agent processing fails
            print(f"Error processing message: {str(e)}")
            return {
                "conversation_id": conversation_id,
                "response": f"Thank you for your message. I can help you with your loan application. Could you please provide more details about your loan requirements (loan amount, salary, employment status, and city)?",
                "stage": "engagement",
                "objection_detected": None,
                "customer_data": {},
                "loan_application": {},
                "knowledge_context": [],
                "next_action": "gather_requirements",
                "actions": []
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
        import re
        message_lower = message.lower()
        
        # Check for explicit loan keywords
        loan_keywords = ["loan", "borrow", "need money", "want money", "apply"]
        has_loan_keyword = any(keyword in message_lower for keyword in loan_keywords)
        
        # Check for requirement indicators
        requirement_keywords = ["salary", "income", "salaried", "self-employed", "contract", "employed", "per month", "monthly"]
        has_requirement = any(keyword in message_lower for keyword in requirement_keywords)
        
        # Check for numeric patterns (lakhs, K, crores, or large numbers)
        has_lakh_pattern = bool(re.search(r'\d+(?:\.\d+)?\s*(?:lakh|lakhs|lac|lacs)', message_lower))
        has_k_pattern = bool(re.search(r'\d+\s*k(?:\s|,|\.|per|$)', message_lower))
        has_crore_pattern = bool(re.search(r'\d+(?:\.\d+)?\s*(?:crore|crores)', message_lower))
        has_large_number = bool(re.search(r'\b\d{6,}\b', message))
        
        has_numeric_amount = has_lakh_pattern or has_k_pattern or has_crore_pattern or has_large_number
        
        # Check for city names (common Indian cities)
        has_city = any(city in message_lower for city in [
            "mumbai", "delhi", "bangalore", "bengaluru", "hyderabad", "chennai", "kolkata",
            "pune", "trivandrum", "thiruvananthapuram", "kochi", "cochin"
        ])
        
        # Check for name introduction
        name_keywords = ["i am", "i'm", "my name is", "call me", "this is", "hello, i"]
        has_name = any(keyword in message_lower for keyword in name_keywords)
        
        # Message is likely about loan requirements if:
        # 1. Has explicit loan keyword, OR
        # 2. Has numeric amounts AND (requirements OR city), OR
        # 3. User is introducing themselves (has name)
        return has_loan_keyword or (has_numeric_amount and (has_requirement or has_city)) or has_name
    
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
    
    def _detect_explanation_question(self, message: str, conversation: Dict[str, Any]) -> Dict[str, Any]:
        """Detect if user is asking for explanation about decision/EMI/process"""
        message_lower = message.lower()
        
        # Check for hypothetical EMI scenarios first (e.g., "what if I paid 6000 as EMI?")
        # Extract EMI amount from hypothetical questions
        hypothetical_emi_patterns = [
            r'what.*if.*(?:i\s*)?(?:paid|pay|paying|could pay)\s*(\d+(?:\.\d+)?)([k])?\s*(?:inr|rs|rupees)?\s*(?:as|per|for)?.*(?:emi|monthly|month)',
            r'if.*(?:i\s*)?(?:paid|pay|could pay)\s*(\d+(?:\.\d+)?)([k])?\s*(?:inr|rs|rupees)?\s*(?:as|per|for)?.*(?:emi|monthly|month)',
            r'can.*(?:i\s*)?pay\s*(\d+(?:\.\d+)?)([k])?\s*(?:inr|rs|rupees)?\s*(?:as|per|for)?.*(?:emi|monthly|month)',
            r'(\d+(?:\.\d+)?)([k])?\s*(?:inr|rs|rupees)?\s*(?:as|per)?.*(?:monthly emi|emi payment|emi|monthly payment)',
            r'pay.*(\d+(?:\.\d+)?)([k])?\s*(?:inr|rs|rupees)?\s*(?:per month|monthly|per\s*month).*(?:emi|for emi)?'
        ]
        
        for pattern in hypothetical_emi_patterns:
            match = re.search(pattern, message_lower)
            if match:
                emi_amount_str = match.group(1)
                has_k_suffix = match.group(2) if len(match.groups()) > 1 else None
                
                emi_amount = float(emi_amount_str)
                if has_k_suffix and has_k_suffix.lower() == 'k':
                    emi_amount = emi_amount * 1000
                
                emi_amount = int(emi_amount)
                return {"type": "hypothetical_emi", "question": message, "emi_amount": emi_amount}
        
        # EMI calculation explanation questions (how/why)
        emi_explanation_patterns = [
            r'how.*emi.*calculat',
            r'why.*emi.*amount',
            r'how.*you.*decide.*emi',
            r'how.*emi.*decid',
            r'how.*is.*emi.*decid',
            r'what.*basis.*emi',
            r'emi.*formula',
            r'how.*determine.*emi',
            r'explain.*emi.*calculat'
        ]
        
        for pattern in emi_explanation_patterns:
            if re.search(pattern, message_lower):
                return {"type": "emi_explanation", "question": message}
        
        # Decision process questions
        decision_patterns = [
            r'how.*decision.*made',
            r'why.*approved',
            r'why.*reject',
            r'how.*verify',
            r'what.*basis.*decision',
            r'how.*you.*decide',
            r'explain.*decision',
            r'explain.*verification',
            r'what.*process',
            r'how.*eligibility',
            r'why.*interest.*rate',
            r'how.*calculate.*eligibility'
        ]
        
        for pattern in decision_patterns:
            if re.search(pattern, message_lower):
                return {"type": "decision_explanation", "question": message}
        
        return None
    
    def _detect_modification_request(self, message: str, conversation: Dict[str, Any]) -> Dict[str, Any]:
        """Detect if user wants to change/modify existing information"""
        message_lower = message.lower()
        loan_app = conversation.get("loan_application", {})
        
        # Only allow modifications if we have some data already
        if not loan_app:
            return None
        
        modification_patterns = [
            r'change',
            r'modify',
            r'update',
            r'edit',
            r'correct',
            r'fix',
            r'wrong',
            r'mistake',
            r'actually',
            r'instead'
        ]
        
        # Check if message contains modification keywords
        has_modification_keyword = any(re.search(pattern, message_lower) for pattern in modification_patterns)
        
        # IMPORTANT: Don't treat EMI/payment questions as modifications
        emi_question_patterns = [
            r'pay.*per month',
            r'pay.*monthly',
            r'afford.*per month',
            r'afford.*monthly',
            r'can.*pay',
            r'could.*pay',
            r'emi.*payment',
            r'installment',
            r'instalment',
            r'monthly payment'
        ]
        
        # If it's an EMI question, don't treat as modification
        is_emi_question = any(re.search(pattern, message_lower) for pattern in emi_question_patterns)
        if is_emi_question:
            return None
        
        if has_modification_keyword or (len(message_lower.split()) < 15 and re.search(r'\d+', message)):
            # Try to extract what they want to change
            modifications = {}
            
            # Check for loan amount changes
            lakh_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)', message_lower)
            if lakh_matches:
                modifications['loan_amount'] = int(float(lakh_matches[0]) * 100000)
            
            crore_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)', message_lower)
            if crore_matches:
                modifications['loan_amount'] = int(float(crore_matches[0]) * 10000000)
            
            if not modifications.get('loan_amount'):
                amount_matches = re.findall(r'\b\d{6,}\b', message)
                if amount_matches:
                    modifications['loan_amount'] = int(amount_matches[0])
            
            # Check for salary changes - but only if explicitly about salary/income
            salary_context = any(word in message_lower for word in ['salary', 'income', 'earn', 'earning'])
            
            if salary_context:
                k_matches = re.findall(r'(\d+)\s*k(?:\s|,|\.|per|/|$)', message_lower)
                if k_matches:
                    salary = int(k_matches[0]) * 1000
                    if 10000 <= salary <= 500000:
                        modifications['salary'] = salary
                
                per_month_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:k|lakh|lakhs)?\s*(?:per month|per\s*month|/month)', message_lower)
                if per_month_matches:
                    val = per_month_matches[0]
                    if 'k' in message_lower[message_lower.find(val):message_lower.find(val)+20]:
                        modifications['salary'] = int(float(val) * 1000)
                    elif 'lakh' in message_lower[message_lower.find(val):message_lower.find(val)+20]:
                        modifications['salary'] = int(float(val) * 100000)
                    else:
                        modifications['salary'] = int(float(val))
            
            # Check for employment status changes
            if 'salaried' in message_lower:
                modifications['employment_status'] = 'salaried'
            elif 'contract' in message_lower:
                modifications['employment_status'] = 'contract'
            elif 'self-employed' in message_lower or 'self employed' in message_lower:
                modifications['employment_status'] = 'self_employed'
            
            # Check for city changes
            indian_cities = [
                'mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'kolkata',
                'pune', 'ahmedabad', 'surat', 'jaipur', 'lucknow', 'kanpur', 'nagpur',
                'indore', 'thane', 'bhopal', 'visakhapatnam', 'pimpri-chinchwad', 'patna',
                'vadodara', 'ghaziabad', 'ludhiana', 'agra', 'nashik', 'faridabad',
                'meerut', 'rajkot', 'kalyan-dombivli', 'vasai-virar', 'varanasi', 'srinagar',
                'aurangabad', 'dhanbad', 'amritsar', 'navi mumbai', 'allahabad', 'ranchi',
                'howrah', 'coimbatore', 'jabalpur', 'gwalior', 'vijayawada', 'jodhpur',
                'madurai', 'raipur', 'kota', 'chandigarh', 'guwahati', 'solapur',
                'hubli-dharwad', 'mysore', 'tiruchirappalli', 'bareilly', 'moradabad',
                'gurgaon', 'gurugram', 'aligarh', 'jalandhar', 'bhubaneswar', 'salem', 'warangal',
                'mira-bhayandar', 'thiruvananthapuram', 'trivandrum', 'bhiwandi', 'saharanpur',
                'guntur', 'amravati', 'bikaner', 'noida', 'jamshedpur', 'bhilai', 'cuttack',
                'firozabad', 'kochi', 'cochin', 'nellore', 'bhavnagar', 'dehradun', 'durgapur'
            ]
            for city in indian_cities:
                if city in message_lower:
                    modifications['city'] = city.title()
                    break
            
            if modifications:
                return {"type": "modification", "changes": modifications, "message": message}
        
        return None
    
    def _route_to_agent(self, conversation_id: str, message: str, stage: ConversationStage, objection: Dict[str, Any]) -> Dict[str, Any]:
        """Route the message to the appropriate agent based on stage and objection"""
        
        conversation = self.conversations[conversation_id]
        
        # HIGHEST PRIORITY: Check for EMI adjustment confirmation or rejection
        if "pending_emi_adjustment" in conversation:
            message_lower = message.lower()
            
            # Check for rejection first
            rejection_match = re.search(r'\b(no|nope|not|dont|don\'t|no need|no thanks|cancel|skip|never mind)\b', message_lower)
            if rejection_match:
                # Clear pending adjustment and continue normally
                conversation.pop("pending_emi_adjustment", None)
                return {
                    "response": "No problem! Let's continue with your original loan details. I'll process your application now.",
                    "next_action": "continue_with_original",
                    "actions": ["clear_pending_adjustment"]
                }
            
            # Check for confirmation
            confirmation_match = re.search(r'\b(yes|yeah|yep|sure|ok|okay|do it|please do|go ahead|proceed)\b', message_lower)
            if confirmation_match:
                return self._handle_emi_adjustment_confirmation(conversation_id)
        
        # SECOND PRIORITY: Check if it's an explanation question (before any other routing)
        explanation_query = self._detect_explanation_question(message, conversation)
        if explanation_query:
            return self._handle_explanation_question(conversation_id, explanation_query)
        
        # THIRD PRIORITY: Check for modification requests
        modification_request = self._detect_modification_request(message, conversation)
        if modification_request:
            return self._handle_modification_request(conversation_id, modification_request)
        
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
    
    def _handle_rollback(self, conversation_id: str, rollback_to: str = None) -> Dict[str, Any]:
        """Handle rollback of previous changes"""
        conversation = self.conversations[conversation_id]
        change_history = conversation.get("change_history", [])
        
        if not change_history:
            return {
                "response": "❌ **No previous changes to rollback.**\n\nYou haven't made any modifications yet.",
                "next_action": "continue",
                "actions": []
            }
        
        loan_app = conversation.get("loan_application", {})
        
        if rollback_to and rollback_to != "last_change":
            # Rollback specific field
            found = False
            for i in range(len(change_history) - 1, -1, -1):
                change = change_history[i]
                if change["field"] == rollback_to:
                    # Revert this change
                    loan_app[change["field"]] = change["old_value"]
                    change_history.pop(i)
                    found = True
                    
                    response = f"✅ **Rolled back {change['field'].replace('_', ' ').title()}:**\n\n"
                    
                    if change["field"] in ["loan_amount", "salary"]:
                        response += f"• Reverted from ₹{change['new_value']:,} back to ₹{change['old_value']:,}\n\n"
                    else:
                        response += f"• Reverted from {change['new_value']} back to {change['old_value']}\n\n"
                    
                    response += self._format_customer_details(loan_app)
                    response += "\n\n**Would you like to proceed with verification using these details?**"
                    
                    conversation["awaiting_verification_confirmation"] = True
                    
                    return {
                        "response": response,
                        "next_action": "await_verification_confirmation",
                        "actions": ["rollback_applied"]
                    }
            
            if not found:
                return {
                    "response": f"❌ No changes found for {rollback_to.replace('_', ' ').title()}.",
                    "next_action": "continue",
                    "actions": []
                }
        else:
            # Rollback last change
            last_change = change_history.pop()
            loan_app[last_change["field"]] = last_change["old_value"]
            
            response = f"✅ **Rolled back last change:**\n\n"
            
            field_name = last_change['field'].replace('_', ' ').title()
            if last_change["field"] in ["loan_amount", "salary"]:
                response += f"• {field_name}: ~~₹{last_change['new_value']:,}~~ → **₹{last_change['old_value']:,}**\n\n"
            else:
                old_formatted = last_change['old_value'].replace('_', ' ').title() if isinstance(last_change['old_value'], str) else last_change['old_value']
                new_formatted = last_change['new_value'].replace('_', ' ').title() if isinstance(last_change['new_value'], str) else last_change['new_value']
                response += f"• {field_name}: ~~{new_formatted}~~ → **{old_formatted}**\n\n"
            
            response += "**Current Details:**\n"
            response += self._format_customer_details(loan_app)
            response += "\n\n**Would you like to proceed with verification?**"
            
            conversation["awaiting_verification_confirmation"] = True
            
            # Recalculate EMI if loan_amount or salary was rolled back
            if last_change["field"] in ["loan_amount", "salary"]:
                loan_amount = loan_app.get("loan_amount", 150000)
                interest_rate = loan_app.get("interest_rate", 10.5)
                tenure = loan_app.get("tenure_months", 60)
                
                p = loan_amount
                r = interest_rate / 12 / 100
                n = tenure
                emi = p * r * ((1 + r) ** n) / (((1 + r) ** n) - 1) if r > 0 else p / n
                loan_app["emi_amount"] = round(emi, 2)
            
            return {
                "response": response,
                "next_action": "await_verification_confirmation",
                "actions": ["rollback_applied"],
                "emi_data": self._calculate_emi_breakdown(loan_app.get("loan_amount", 150000), loan_app.get("interest_rate", 10.5)) if loan_app.get("loan_amount") else None
            }
    
    def _format_customer_details(self, loan_app: Dict[str, Any]) -> str:
        """Format customer details in a clean list"""
        details = ""
        if "customer_name" in loan_app:
            details += f"👤 **Name:** {loan_app['customer_name']}\n"
        if "loan_amount" in loan_app:
            details += f"💰 **Loan Amount:** ₹{loan_app['loan_amount']:,}\n"
        if "salary" in loan_app:
            details += f"💵 **Monthly Salary:** ₹{loan_app['salary']:,}\n"
        if "employment_status" in loan_app:
            details += f"💼 **Employment:** {loan_app['employment_status'].replace('_', ' ').title()}\n"
        if "city" in loan_app:
            details += f"🏙️ **City:** {loan_app['city']}\n"
        if "emi_amount" in loan_app:
            details += f"💳 **Monthly EMI:** ₹{loan_app['emi_amount']:,.2f}\n"
        
        return details.strip()
    
    def _calculate_emi_breakdown(self, loan_amount: float, interest_rate: float, num_months: int = 12, custom_emi: float = None) -> List[Dict[str, Any]]:
        """
        Calculate EMI breakdown for the first N months
        Returns array of objects with month, principal, interest, and emi values
        
        Args:
            loan_amount: Principal loan amount
            interest_rate: Annual interest rate
            num_months: Number of months to calculate breakdown for (default 12)
            custom_emi: Optional custom EMI amount (if user specified desired EMI)
        """
        # Default tenure to 60 months (5 years) for full loan calculation
        full_tenure = 60
        
        # Calculate monthly EMI
        P = loan_amount
        r = interest_rate / 12 / 100  # Monthly interest rate
        n = full_tenure
        
        if custom_emi:
            # Use the custom EMI specified by user
            emi = custom_emi
        else:
            # Calculate EMI from loan amount
            if r > 0:
                emi = P * r * ((1 + r) ** n) / (((1 + r) ** n) - 1)
            else:
                emi = P / n
        
        emi = round(emi, 2)
        
        # Calculate breakdown for first num_months
        breakdown = []
        remaining_principal = loan_amount
        
        for month in range(1, min(num_months + 1, full_tenure + 1)):
            # Interest for this month
            interest_payment = remaining_principal * r
            
            # Principal for this month
            principal_payment = emi - interest_payment
            
            # Update remaining principal
            remaining_principal -= principal_payment
            
            breakdown.append({
                "month": month,
                "principal": round(principal_payment, 2),
                "interest": round(interest_payment, 2),
                "emi": emi
            })
        
        return breakdown
    
    def _handle_modification_request(self, conversation_id: str, modification_request: Dict[str, Any]) -> Dict[str, Any]:
        """Handle user request to modify loan details"""
        conversation = self.conversations[conversation_id]
        loan_app = conversation.get("loan_application", {})
        change_history = conversation.get("change_history", [])
        changes = modification_request["changes"]
        
        # Filter out None values from changes - only keep actual modifications
        changes = {k: v for k, v in changes.items() if v is not None}
        
        if not changes:
            # No actual changes detected
            return {
                "response": "I'd be happy to help you modify your loan details. What would you like to change?",
                "next_action": "await_modification",
                "actions": []
            }
        
        # Track changes in history for rollback
        for field, new_value in changes.items():
            if field in loan_app and loan_app[field] != new_value:
                change_history.append({
                    "timestamp": datetime.now(),
                    "field": field,
                    "old_value": loan_app[field],
                    "new_value": new_value,
                    "change_type": "modification"
                })
            loan_app[field] = new_value
        
        conversation["change_history"] = change_history
        
        # Reset verification and underwriting if already done
        if "verification_complete" in loan_app:
            loan_app.pop("verification_complete", None)
            loan_app.pop("underwriting_complete", None)
            loan_app.pop("decision", None)
            # Reset stage to needs_assessment
            conversation["stage"] = ConversationStage.NEEDS_ASSESSMENT
        
        # Recalculate EMI if loan_amount or salary changed
        emi_changed = False
        if "loan_amount" in changes or "salary" in changes:
            loan_amount = loan_app.get("loan_amount", 150000)
            interest_rate = loan_app.get("interest_rate", 10.5)
            tenure = loan_app.get("tenure_months", 60)
            
            p = loan_amount
            r = interest_rate / 12 / 100
            n = tenure
            new_emi = p * r * ((1 + r) ** n) / (((1 + r) ** n) - 1) if r > 0 else p / n
            loan_app["emi_amount"] = round(new_emi, 2)
            emi_changed = True
        
        self.conversations[conversation_id] = conversation
        
        # Build response showing what was changed
        response = "✅ **Changes Applied:**\n\n"
        
        field_labels = {
            "customer_name": "👤 Name",
            "loan_amount": "💰 Loan Amount",
            "salary": "💵 Monthly Salary",
            "employment_status": "💼 Employment Type",
            "city": "🏙️ City"
        }
        
        # Show changes made
        for change in change_history[-len(changes):]:  # Get only the latest changes
            field = change["field"]
            label = field_labels.get(field, field.replace('_', ' ').title())
            old_val = change["old_value"]
            new_val = change["new_value"]
            
            if field in ["loan_amount", "salary"]:
                response += f"• {label}: ~~₹{old_val:,}~~ → **₹{new_val:,}**\n"
            elif field == "employment_status":
                response += f"• {label}: ~~{old_val.replace('_', ' ').title()}~~ → **{new_val.replace('_', ' ').title()}**\n"
            else:
                response += f"• {label}: ~~{old_val}~~ → **{new_val}**\n"
        
        response += "\n**Updated Profile:**\n"
        response += self._format_customer_details(loan_app)
        
        if emi_changed:
            response += f"\n\n💡 **Your EMI has been recalculated based on the new details.**"
        
        response += "\n\n**Would you like to proceed with verification using these updated details?**"
        response += "\n_(Type 'yes' to proceed, 'rollback' to undo changes, or make more modifications)_"
        
        conversation["awaiting_verification_confirmation"] = True
        
        return {
            "response": response,
            "next_action": "await_verification_confirmation",
            "actions": ["show_updated_details"],
            "emi_data": self._calculate_emi_breakdown(loan_app.get("loan_amount", 150000), loan_app.get("interest_rate", 10.5)) if emi_changed else None
        }
    
    def _handle_emi_adjustment_confirmation(self, conversation_id: str) -> Dict[str, Any]:
        """Handle user confirmation to adjust loan based on hypothetical EMI"""
        conversation = self.conversations[conversation_id]
        pending_adjustment = conversation.get("pending_emi_adjustment", {})
        
        if not pending_adjustment:
            return {
                "response": "I'm not sure what you'd like me to confirm. Could you please clarify?",
                "next_action": "continue_conversation"
            }
        
        loan_app = conversation.get("loan_application", {})
        hypothetical_emi = pending_adjustment["emi_amount"]
        interest_rate = pending_adjustment.get("interest_rate", 10.5)
        
        # Keep loan amount same, calculate new tenure based on EMI
        loan_amount = loan_app.get("loan_amount", 150000)
        r = interest_rate / 12 / 100
        
        # Calculate tenure using EMI formula: tenure = log(EMI / (EMI - P*r)) / log(1+r)
        import math
        if r > 0:
            try:
                tenure = math.log(hypothetical_emi / (hypothetical_emi - loan_amount * r)) / math.log(1 + r)
                tenure = int(math.ceil(tenure))  # Round up to nearest month
            except (ValueError, ZeroDivisionError):
                # If EMI is too low or calculation fails, use default
                tenure = 60
        else:
            tenure = int(loan_amount / hypothetical_emi)
        
        # Ensure tenure is reasonable (6 months to 10 years)
        tenure = max(6, min(tenure, 120))
        
        old_loan_amount = loan_app.get("loan_amount", 150000)
        old_emi = loan_app.get("emi_amount", 3224)
        old_tenure = loan_app.get("tenure_months", 60)
        
        # Update the loan application - KEEP LOAN AMOUNT SAME, UPDATE TENURE
        loan_app["emi_amount"] = hypothetical_emi
        loan_app["tenure_months"] = tenure
        
        # Reset verification and underwriting since loan changed
        loan_app.pop("verification_complete", None)
        loan_app.pop("underwriting_complete", None)
        loan_app.pop("sanction_complete", None)
        loan_app.pop("decision", None)
        
        # Update conversation
        conversation["loan_application"] = loan_app
        conversation["stage"] = ConversationStage.VERIFICATION  # Go back to verification
        
        # Clear pending adjustment
        conversation.pop("pending_emi_adjustment", None)
        
        self.conversations[conversation_id] = conversation
        
        # Calculate total payable and interest
        total_payable = hypothetical_emi * tenure
        total_interest = total_payable - loan_amount
        
        response = f"""✅ **EMI Adjusted Successfully!**

📝 **Changes Made:**
• 💳 Monthly EMI: ₹{old_emi:,.0f} → **₹{hypothetical_emi:,}**
• 📅 Tenure: {old_tenure} months → **{tenure} months ({tenure//12} years {tenure%12} months)**
• 💰 Loan Amount: **₹{loan_amount:,}** (unchanged)
• 💹 Interest Rate: **{interest_rate}% per annum**

**Impact:**
• Total amount to pay: ₹{total_payable:,}
• Total interest: ₹{total_interest:,.0f}
• **You'll save ₹{(old_emi * old_tenure) - total_payable:,.0f} by paying higher EMI!**

🔄 Let me verify your updated details and process your application..."""
        
        return {
            "response": response,
            "next_action": "verify_and_process",
            "actions": ["loan_adjusted", "start_verification"],
            "loan_application": loan_app,  # Include updated loan application
            "emi_data": self._calculate_emi_breakdown(loan_amount, interest_rate, custom_emi=hypothetical_emi)
        }
    
    def _handle_explanation_question(self, conversation_id: str, explanation_query: Dict[str, Any]) -> Dict[str, Any]:
        """Provide detailed explanation about decision-making or EMI calculation"""
        conversation = self.conversations[conversation_id]
        loan_app = conversation.get("loan_application", {})
        
        if explanation_query["type"] == "hypothetical_emi":
            # Calculate tenure based on hypothetical EMI amount for CURRENT loan amount
            hypothetical_emi = explanation_query["emi_amount"]
            interest_rate = loan_app.get("interest_rate", 10.5)
            current_loan_amount = loan_app.get("loan_amount", 150000)
            current_emi = loan_app.get("emi_amount", 3224)
            
            r = interest_rate / 12 / 100
            
            # Calculate tenure for hypothetical EMI with current loan amount
            import math
            if r > 0:
                try:
                    new_tenure = math.log(hypothetical_emi / (hypothetical_emi - current_loan_amount * r)) / math.log(1 + r)
                    new_tenure = int(math.ceil(new_tenure))
                except (ValueError, ZeroDivisionError):
                    new_tenure = 60  # Default if calculation fails
            else:
                new_tenure = int(current_loan_amount / hypothetical_emi)
            
            # Ensure tenure is reasonable
            new_tenure = max(6, min(new_tenure, 120))
            
            total_payment = hypothetical_emi * new_tenure
            total_interest = total_payment - current_loan_amount
            current_total = current_emi * loan_app.get("tenure_months", 60)
            savings = current_total - total_payment
            
            years = new_tenure // 12
            months = new_tenure % 12
            tenure_label = f"{years} year{'s' if years != 1 else ''}"
            if months > 0:
                tenure_label += f" {months} month{'s' if months != 1 else ''}"
            
            response = f"""💰 **Impact of ₹{hypothetical_emi:,} Monthly EMI:**

📝 **Your Loan Details:**
• Loan Amount: ₹{current_loan_amount:,}
• Interest Rate: {interest_rate}% per annum

📊 **Comparison:**

**Current Plan:**
• Monthly EMI: ₹{current_emi:,.0f}
• Tenure: {loan_app.get('tenure_months', 60)} months
• Total Payment: ₹{current_total:,.0f}

**With ₹{hypothetical_emi:,} EMI:**
• Monthly EMI: ₹{hypothetical_emi:,}
• **New Tenure: {new_tenure} months ({tenure_label})**
• Total Payment: ₹{total_payment:,.0f}
• Total Interest: ₹{total_interest:,.0f}

💡 **Impact:**
• Monthly difference: ₹{abs(hypothetical_emi - current_emi):,.0f} {"more" if hypothetical_emi > current_emi else "less"}
• Tenure {"reduced" if new_tenure < loan_app.get('tenure_months', 60) else "increased"} by {abs(new_tenure - loan_app.get('tenure_months', 60))} months
• **You'll {"save" if savings > 0 else "pay"} ₹{abs(savings):,.0f} overall!**

Would you like me to adjust your loan to this EMI?"""
            
            # Store the hypothetical EMI for potential confirmation
            conversation["pending_emi_adjustment"] = {
                "emi_amount": hypothetical_emi,
                "interest_rate": interest_rate
            }
            
            return {
                "response": response,
                "next_action": "continue_conversation",
                "actions": ["show_hypothetical_breakdown"],
                "hypothetical_emi": hypothetical_emi,
                "emi_data": self._calculate_emi_breakdown(current_loan_amount, interest_rate, custom_emi=hypothetical_emi)
            }
        
        elif explanation_query["type"] == "emi_explanation":
            # Explain EMI calculation
            loan_amount = loan_app.get("loan_amount", 150000)
            interest_rate = loan_app.get("interest_rate", 10.5)
            tenure = loan_app.get("tenure_months", 60)
            
            # Calculate EMI
            p = loan_amount
            r = interest_rate / 12 / 100
            n = tenure
            emi = p * r * ((1 + r) ** n) / (((1 + r) ** n) - 1) if r > 0 else p / n
            emi = round(emi, 2)
            
            response = f"""📊 **How Your EMI is Calculated:**

Your monthly EMI of **₹{emi:,}** is calculated using the standard loan EMI formula:

**EMI = P × r × (1+r)ⁿ / ((1+r)ⁿ - 1)**

Where:
• **P** = Principal (Loan Amount) = ₹{loan_amount:,}
• **r** = Monthly Interest Rate = {interest_rate}% ÷ 12 = {interest_rate/12:.4f}%
• **n** = Tenure in months = {tenure} months

**Breaking it down:**

1️⃣ **Principal Amount**: The loan amount you requested (₹{loan_amount:,})

2️⃣ **Interest Rate**: {interest_rate}% per annum
   - This is determined based on:
     • Your credit score and credit history
     • Employment type and stability
     • Loan amount and tenure
     • Current market rates (base rate: 10.5%)

3️⃣ **Tenure**: {tenure} months ({tenure//12} years)
   - Longer tenure = Lower EMI but more total interest
   - Shorter tenure = Higher EMI but less total interest

**Why this EMI amount?**
The EMI is designed to:
✅ Keep your monthly burden affordable (typically ≤ 50% of income)
✅ Ensure you repay both principal and interest equally over time
✅ Start with more interest, gradually shifting to more principal

💡 **Tip**: You can reduce your EMI by:
• Choosing a longer tenure
• Making a partial prepayment
• Negotiating a lower interest rate based on credit score"""
            
        else:  # decision_explanation
            # Explain decision-making process
            credit_score = loan_app.get("credit_score", "N/A")
            salary = loan_app.get("salary", 60000)
            employment = loan_app.get("employment_status", "salaried")
            decision = loan_app.get("decision", "pending")
            
            response = f"""🔍 **How We Make Loan Decisions:**

Our verification and underwriting process evaluates multiple factors:

**1️⃣ Credit Assessment**
• Credit Score: {credit_score}
• Payment History: We check your track record of repaying loans/credit cards
• Credit Utilization: How much of your available credit you're using
• Credit Age: Length of your credit history

**2️⃣ Income Verification**
• Monthly Salary: ₹{salary:,}
• Employment Type: {employment.replace('_', ' ').title()}
• Income Stability: Consistency of your income source
• Work Experience: Years in current employment

**3️⃣ Affordability Analysis**
• **FOIR (Fixed Obligation to Income Ratio)**:
  - Calculates: (Existing EMIs + New Loan EMI) / Monthly Income
  - Should be ≤ 50% of your income
  - Ensures you have enough for other expenses

• **Loan-to-Income Ratio**:
  - Loan Amount should be within 15-30x of monthly salary
  - Varies based on credit score and employment type

**4️⃣ Risk Assessment**
We evaluate:
• Debt burden (existing loans/credit cards)
• Banking behavior (bounced checks, overdrafts)
• Employment stability
• City (cost of living considerations)

**5️⃣ Interest Rate Determination**
Your interest rate is based on:
• **Base Rate**: 10.5% (RBI guidelines + bank costs)
• **Credit Premium**: 0-5% (based on credit score)
• **Risk Premium**: 0-2% (based on overall risk assessment)
• **Employment Premium**: 0-1% (employment type)

**Your Decision: {decision.upper()}**
"""
            
            if decision == "approved":
                response += """✅ **Why Approved:**
• Strong credit profile
• Stable income and employment
• FOIR within acceptable limits
• Low overall risk assessment
"""
            elif decision == "conditional":
                response += """⚠️ **Why Conditional:**
• Good overall profile but needs verification
• Additional documents required for final approval
• Some risk factors need clarification
"""
            elif decision == "under_review":
                response += """⏳ **Why Under Review:**
• Moderate risk factors present
• Requires credit committee evaluation
• May need co-applicant or collateral
"""
            
            response += """\n\n💡 **Key Principle:**
We balance **affordability** (can you repay?) with **risk** (will you repay?) to protect both you and the bank.

Have more specific questions about any part of the process?"""
        
        return {
            "response": response,
            "next_action": "continue_conversation",
            "actions": ["provide_explanation"]
        }
    
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
        response = """👋 **Welcome to PRIMUM Loan Services!**

I'm your AI assistant, here to help you with **Personal Loan Applications**.

---

📌 **I'll need a few details to get started:**

- 👤 **Your Name:** What should I call you?
- 💰 **Loan Amount:** How much do you wish to borrow?
- 💵 **Monthly Income:** Your current salary
- 💼 **Employment Type:** Salaried / Contract / Self-Employed
- 🏙️ **City:** Where do you currently live?

---

✨ **Quick Tip:** You can provide all details in one message for faster processing!

> Example: *"I'm Rajesh, need 1.5 lakhs, 60k per month, salaried, Trivandrum"*

How can I help you today?"""
        return {
            "response": response,
            "next_action": "gather_requirements",
            "actions": ["ask_loan_amount", "ask_salary", "ask_employment", "ask_city"]
        }
    
    def _handle_needs_assessment(self, conversation_id: str, message: str) -> Dict[str, Any]:
        """Handle needs assessment stage"""
        # Extract requirements from message
        self._extract_requirements(conversation_id, message)
        
        # Check if we have all requirements
        conversation = self.conversations[conversation_id]
        loan_app = conversation["loan_application"]
        
        # Check what information we have collected
        has_name = "customer_name" in loan_app
        has_loan_amount = "loan_amount" in loan_app
        has_salary = "salary" in loan_app
        has_employment = "employment_status" in loan_app
        has_city = "city" in loan_app
        
        # Build detailed response based on what we collected
        if has_loan_amount and has_salary and has_employment and has_city:
            # Calculate EMI for the loan
            loan_amount = loan_app['loan_amount']
            interest_rate = 10.5  # Default interest rate
            tenure = 60  # 5 years
            
            p = loan_amount
            r = interest_rate / 12 / 100
            n = tenure
            emi = p * r * ((1 + r) ** n) / (((1 + r) ** n) - 1) if r > 0 else p / n
            emi = round(emi, 2)
            
            loan_app["emi_amount"] = emi
            loan_app["interest_rate"] = interest_rate
            loan_app["tenure_months"] = tenure
            
            # All requirements collected - confirm and ASK before proceeding
            response = f"""✅ **Perfect! I've collected all your details:**

"""
            if has_name:
                response += f"👤 **Name:** {loan_app['customer_name']}\n"
            
            response += f"""💰 **Loan Amount:** ₹{loan_app['loan_amount']:,}
💵 **Monthly Salary:** ₹{loan_app['salary']:,}
💼 **Employment:** {loan_app['employment_status'].replace('_', ' ').title()}
🏙️ **City:** {loan_app['city']}
💳 **Estimated Monthly EMI:** ₹{emi:,.2f} _(for 60 months at {interest_rate}% p.a.)_

---

🔍 **Next Step:** I can now verify your eligibility and check your credit profile.

**Would you like me to proceed with verification?** _(Type "yes" or "proceed" to continue)_"""
            
            # Update stage but DON'T auto-advance - wait for user confirmation
            conversation["stage"] = ConversationStage.NEEDS_ASSESSMENT
            conversation["awaiting_verification_confirmation"] = True
            self.conversations[conversation_id] = conversation
            
            return {
                "response": response,
                "next_action": "await_verification_confirmation",
                "actions": ["confirm_details"],
                "emi_data": self._calculate_emi_breakdown(loan_amount, interest_rate) if loan_amount else None
            }
        else:
            # Build specific request for missing information
            missing = []
            if not has_name:
                missing.append("👤 Your name")
            if not has_loan_amount:
                missing.append("💰 Loan amount you need")
            if not has_salary:
                missing.append("💵 Monthly salary/income")
            if not has_employment:
                missing.append("💼 Employment type (salaried/contract/self-employed)")
            if not has_city:
                missing.append("🏙️ City of residence")
            
            collected_info = []
            if has_name:
                collected_info.append(f"✅ Name: {loan_app['customer_name']}")
            if has_loan_amount:
                collected_info.append(f"✅ Loan Amount: ₹{loan_app['loan_amount']:,}")
            if has_salary:
                collected_info.append(f"✅ Monthly Salary: ₹{loan_app['salary']:,}")
            if has_employment:
                collected_info.append(f"✅ Employment: {loan_app['employment_status'].replace('_', ' ').title()}")
            if has_city:
                collected_info.append(f"✅ City: {loan_app['city']}")
            
            if collected_info:
                response = "Thank you! I've noted:\n" + "\n".join(collected_info) + "\n\n"
            else:
                response = ""
            
            response += f"📋 **Still need the following information:**\n" + "\n".join(missing)
            response += "\n\nPlease provide these details so I can proceed with your loan application."
            next_action = "gather_remaining_requirements"
        
        return {
            "response": response,
            "next_action": next_action,
            "actions": ["continue_gathering_info"]
        }
    
    def _manual_extract_from_message(self, message: str, conversation: Dict[str, Any]) -> Dict[str, Any]:
        """Manually extract loan details from message when LLM extraction fails"""
        import re
        message_lower = message.lower()
        extracted = {}
        
        # ANTI-HALLUCINATION: Only extract if context keywords present
        loan_keywords = ['loan', 'borrow', 'need', 'want', 'require', 'looking for']
        has_loan_context = any(word in message_lower for word in loan_keywords)
        
        # Extract loan amount with lakhs/crores/K support ONLY if loan context present
        if has_loan_context:
            lakh_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)', message_lower)
            if lakh_matches:
                amount = int(float(lakh_matches[0]) * 100000)
                # Validate range: 50k to 50 lakhs
                if 50000 <= amount <= 5000000:
                    extracted["loan_amount"] = amount
            
            crore_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)', message_lower)
            if crore_matches:
                amount = int(float(crore_matches[0]) * 10000000)
                # Validate range
                if amount <= 5000000:  # Max 50 lakhs
                    extracted["loan_amount"] = amount
        
        # Extract salary with K support and annual conversion - ONLY if salary context
        salary_keywords = ['salary', 'income', 'earn', 'earning', 'paid', 'make', 'get paid', 'compensation']
        salary_context = any(word in message_lower for word in salary_keywords)
        
        # ANTI-HALLUCINATION: Only extract salary if explicitly mentioned
        if salary_context:
            # Check for annual salary indicators (multiple patterns)
            is_annual = any(term in message_lower for term in [
                'per year', 'per annum', 'annual', 'yearly', 'per-year', 'peryear', 
                '/year', 'pa', 'p.a', 'p.a.', 'annum', 'per yr'
            ])
            
            # Extract lakh amounts
            lakh_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)', message_lower)
            if lakh_matches:
                amount = int(float(lakh_matches[0]) * 100000)
                # Convert annual to monthly
                monthly_amount = amount // 12 if is_annual else amount
                # Validate range: 5k to 10 lakhs monthly
                if 5000 <= monthly_amount <= 1000000:
                    extracted['salary'] = monthly_amount
                    if is_annual:
                        print(f"💰 Converted annual salary {amount:,} to monthly {monthly_amount:,}")
            
            # Extract K amounts
            k_matches = re.findall(r'(\d+)\s*k(?:\s|,|\.|per|/|$)', message_lower)
            if k_matches:
                amount = int(k_matches[0]) * 1000
                monthly_amount = amount // 12 if is_annual else amount
                # Validate range
                if 5000 <= monthly_amount <= 1000000:
                    extracted['salary'] = monthly_amount
                    if is_annual:
                        print(f"💰 Converted annual salary {amount:,} to monthly {monthly_amount:,}")
        
        # Extract employment status
        if 'salaried' in message_lower:
            extracted['employment_status'] = 'salaried'
        elif 'contract' in message_lower:
            extracted['employment_status'] = 'contract'
        elif 'self-employed' in message_lower or 'self employed' in message_lower:
            extracted['employment_status'] = 'self_employed'
        
        # Extract city (abbreviated list)
        indian_cities = ['mumbai', 'delhi', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 
                        'kolkata', 'pune', 'trivandrum', 'thiruvananthapuram', 'kochi']
        for city in indian_cities:
            if city in message_lower:
                extracted['city'] = city.title()
                break
        
        return extracted
    
    def _extract_requirements(self, conversation_id: str, message: str):
        """Extract loan requirements from message"""
        conversation = self.conversations[conversation_id]
        loan_app = conversation["loan_application"]
        
        # CRITICAL: Post-process salary to detect and convert annual to monthly
        message_lower = message.lower()
        
        # Check if message mentions annual salary
        is_annual = any(term in message_lower for term in [
            'per year', 'per annum', 'annual', 'yearly', '/year', 'peryear', 
            'per-year', 'pa', 'p.a', 'p.a.', 'annum', 'per yr'
        ])
        
        # If salary was extracted and annual indicators present, convert it
        if "salary" in loan_app and is_annual:
            current_salary = loan_app["salary"]
            # If salary seems too high (likely annual), convert to monthly
            if current_salary > 1000000:  # More than 10 lakhs monthly is unusual
                monthly_salary = current_salary // 12
                print(f"💰 CONVERTED: Annual salary ₹{current_salary:,} → Monthly ₹{monthly_salary:,}")
                loan_app["salary"] = monthly_salary
        
        # Simple extraction - in a real system, this would use NLP
        message_lower = message.lower()
        
        # Extract customer name if not already present
        import re
        if "customer_name" not in loan_app:
            # Look for name patterns: "I am X", "My name is X", "This is X", "X here"
            name_patterns = [
                r"(?:i am|i\'m|my name is|this is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)",
                r"^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:here|speaking)",
                r"(?:hi|hello),?\s+(?:i am|i\'m|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)"
            ]
            
            for pattern in name_patterns:
                match = re.search(pattern, message)
                if match:
                    loan_app["customer_name"] = match.group(1).strip()
                    break
        
        # ANTI-HALLUCINATION: Only extract loan amount if loan keywords present
        loan_keywords = ['loan', 'borrow', 'need', 'want', 'require', 'looking for', 'apply']
        has_loan_context = any(keyword in message_lower for keyword in loan_keywords)
        
        # Extract loan amount with lakhs/crores/K support - ONLY if loan context present
        import re
        
        if has_loan_context and "loan_amount" not in loan_app:
            # Check for lakhs format (e.g., "2 lakhs", "2.5 lakh", "1.5 lakhs")
            lakh_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)', message_lower)
            if lakh_matches:
                amount = int(float(lakh_matches[0]) * 100000)
                # Validate range: 50k to 50 lakhs
                if 50000 <= amount <= 5000000:
                    loan_app["loan_amount"] = amount
                    print(f"💳 Extracted loan amount: ₹{amount:,}")
            
            # Check for crores format
            if "loan_amount" not in loan_app:
                crore_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:crore|crores|cr)', message_lower)
                if crore_matches:
                    amount = int(float(crore_matches[0]) * 10000000)
                    # Validate range: max 50 lakhs
                    if amount <= 5000000:
                        loan_app["loan_amount"] = amount
                        print(f"💳 Extracted loan amount: ₹{amount:,}")
            
            # Fallback to regular numbers if no lakhs/crores found
            if "loan_amount" not in loan_app:
                amount_matches = re.findall(r'\b\d{6,}\b', message)  # At least 6 digits
                if amount_matches:
                    amount = int(amount_matches[0])
                    if 50000 <= amount <= 5000000:
                        loan_app["loan_amount"] = amount
                        print(f"💳 Extracted loan amount: ₹{amount:,}")
        
        # Extract salary - improved to work WITHOUT specific keywords
        # First, determine if salary is annual or monthly
        if "salary" not in loan_app:
            is_annual = any(term in message_lower for term in ['per year', 'per annum', 'annual', 'yearly', '/year', 'peryear', 'per-year'])
            is_monthly = any(term in message_lower for term in ['per month', 'per-month', 'monthly', '/month', 'permonth'])
            
            # Look for K format (e.g., "30k", "60K")
            k_matches = re.findall(r'(\d+(?:\.\d+)?)\s*k(?:\s|,|\.|per|/|$)', message_lower)
            if k_matches:
                for k_val in k_matches:
                    amount = int(float(k_val) * 1000)
                    # Convert annual to monthly if needed
                    if is_annual:
                        amount = amount // 12
                    if 5000 <= amount <= 1000000:  # Reasonable monthly salary range
                        loan_app["salary"] = amount
                        break
            
            # Look for lakh format (e.g., "3.6 lakhs", "2 lakh")
            if "salary" not in loan_app:
                lakh_salary_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)', message_lower)
                # Skip the first lakh match if it's likely the loan amount
                for i, lakh_val in enumerate(lakh_salary_matches):
                    # If this is the first lakh and we already have loan_amount, or if it's not the first, use it for salary
                    if i > 0 or "loan_amount" in loan_app:
                        amount = int(float(lakh_val) * 100000)
                        # Convert annual to monthly if needed
                        if is_annual:
                            amount = amount // 12
                        if 5000 <= amount <= 1000000:
                            loan_app["salary"] = amount
                            break
        
        # Fallback: Look for salary-related keywords
        if "salary" not in loan_app:
            salary_phrases = ["salary", "income", "earning", "earn", "pay", "monthly"]
            for phrase in salary_phrases:
                if phrase in message_lower:
                    # Look for K format near the keyword
                    phrase_pos = message_lower.find(phrase)
                    context = message_lower[max(0, phrase_pos-20):min(len(message_lower), phrase_pos+50)]
                    
                    k_matches = re.findall(r'(\d+)\s*k(?:\s|,|\.|$)', context)
                    if k_matches:
                        loan_app["salary"] = int(k_matches[0]) * 1000
                        break
                    
                    # Look for lakhs
                    lakh_salary = re.findall(r'(\d+(?:\.\d+)?)\s*(?:lakh|lakhs)', context)
                    if lakh_salary:
                        loan_app["salary"] = int(float(lakh_salary[0]) * 100000)
                        break
                    
                    # Regular numbers
                    salary_matches = re.findall(r'\b\d{4,6}\b', context)
                    if salary_matches:
                        loan_app["salary"] = int(salary_matches[0])
                        break
        
        # Extract employment status - more flexible matching
        if re.search(r'\b(?:i am|i\'m|am|i\'m)\s+salaried\b', message_lower) or re.search(r'\bsalaried\b', message_lower):
            loan_app["employment_status"] = "salaried"
        elif "contract" in message_lower:
            loan_app["employment_status"] = "contract"
            loan_app["employment_status"] = "contract"
        elif "business" in message_lower or "self-employed" in message_lower or "self employed" in message_lower or "entrepreneur" in message_lower:
            loan_app["employment_status"] = "self_employed"
        
        # Extract city - common Indian cities
        indian_cities = [
            "mumbai", "delhi", "bangalore", "bengaluru", "hyderabad", "chennai", "kolkata",
            "pune", "ahmedabad", "surat", "jaipur", "lucknow", "kanpur", "nagpur", "indore",
            "thane", "bhopal", "visakhapatnam", "pimpri", "patna", "vadodara", "ghaziabad",
            "ludhiana", "agra", "nashik", "faridabad", "meerut", "rajkot", "kalyan", "vasai",
            "varanasi", "srinagar", "aurangabad", "dhanbad", "amritsar", "navi mumbai",
            "allahabad", "ranchi", "howrah", "coimbatore", "jabalpur", "gwalior", "vijayawada",
            "jodhpur", "madurai", "raipur", "kota", "guwahati", "chandigarh", "solapur",
            "hubli", "mysore", "tiruchirappalli", "bareilly", "moradabad", "mysuru", "tiruppur",
            "gurgaon", "gurugram", "aligarh", "jalandhar", "bhubaneswar", "salem", "warangal",
            "mira-bhayandar", "thiruvananthapuram", "trivandrum", "bhiwandi", "saharanpur",
            "guntur", "amravati", "bikaner", "noida", "jamshedpur", "bhilai", "cuttack",
            "firozabad", "kochi", "cochin", "nellore", "bhavnagar", "dehradun", "durgapur"
        ]
        for city in indian_cities:
            if city in message_lower:
                loan_app["city"] = city.title()
                break
        
        # Update conversation
        conversation["loan_application"] = loan_app
        self.conversations[conversation_id] = conversation
    
    def _llm_route_message(self, conversation_id: str, message: str, conversation: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use LLM to analyze message and route to appropriate handler.
        LLM has full control over the flow decision.
        """
        try:
            # Check if this is an auto-continuation signal from frontend
            if message.strip() == '[AUTO_CONTINUE]':
                print(f"")
                print(f"{'='*60}")
                print(f"🔄 AUTO-CONTINUE TRIGGERED")
                print(f"{'='*60}")
                
                # This is the continuation after delay - process the pending action
                loan_app = conversation.get("loan_application", {})
                
                # Check what stage we're at and continue accordingly
                if "pending_verification" in conversation:
                    print(f"📋 Processing pending verification...")
                    del conversation["pending_verification"]
                    # Reset verification flags to allow re-verification
                    loan_app["verification_complete"] = False
                    loan_app["underwriting_complete"] = False
                    loan_app["sanction_complete"] = False
                    conversation["loan_application"] = loan_app
                    self.conversations[conversation_id] = conversation
                    print(f"✅ Flags reset, calling verification handler")
                    print(f"{'='*60}")
                    print(f"")
                    return self._handle_verification(conversation_id)
                
                # Default: just continue with empty response
                return {
                    "response": "",
                    "next_action": "continue",
                    "actions": []
                }
            
            # ============================================================
            # CHECK FOR AWAITING CONFIRMATIONS BEFORE CALLING LLM
            # This ensures the state machine works step-by-step
            # ============================================================
            message_lower = message.lower().strip()
            is_yes = any(word in message_lower for word in ['yes', 'yeah', 'yep', 'ok', 'okay', 'sure', 'proceed', 'go ahead', 'continue', 'do it', 'please'])
            is_no = message_lower in ['no', 'nope', 'nah', 'cancel', 'stop']
            
            # Check for pending EMI adjustment FIRST (higher priority than verification)
            if conversation.get("pending_emi_adjustment") and is_yes:
                print(f"💰 User confirmed EMI adjustment - applying changes...")
                # Clear any awaiting flags since we're processing EMI adjustment
                conversation.pop("awaiting_verification_confirmation", None)
                conversation.pop("awaiting_underwriting_confirmation", None)
                conversation.pop("awaiting_sanction_confirmation", None)
                self.conversations[conversation_id] = conversation
                return self._handle_emi_adjustment_confirmation(conversation_id)
            
            # Check for awaiting verification confirmation
            if conversation.get("awaiting_verification_confirmation"):
                print(f"🔄 Awaiting verification confirmation...")
                if is_yes:
                    print(f"✅ User confirmed - proceeding to verification")
                    conversation.pop("awaiting_verification_confirmation", None)
                    conversation["stage"] = ConversationStage.VERIFICATION
                    self.conversations[conversation_id] = conversation
                    return self._handle_verification(conversation_id)
                elif is_no:
                    print(f"❌ User declined - asking what to change")
                    conversation.pop("awaiting_verification_confirmation", None)
                    self.conversations[conversation_id] = conversation
                    return {
                        "response": "No problem! Would you like to change any of the details before I verify? Just let me know what you'd like to modify.",
                        "next_action": "await_modification",
                        "actions": []
                    }
                # If neither yes nor no, check if they're providing new details
                # Fall through to LLM analysis
            
            # Check for awaiting underwriting confirmation
            if conversation.get("awaiting_underwriting_confirmation"):
                print(f"🔄 Awaiting underwriting confirmation...")
                if is_yes:
                    print(f"✅ User confirmed - proceeding to underwriting")
                    conversation.pop("awaiting_underwriting_confirmation", None)
                    conversation["stage"] = ConversationStage.UNDERWRITING
                    self.conversations[conversation_id] = conversation
                    return self._handle_underwriting(conversation_id)
                elif is_no:
                    print(f"❌ User declined underwriting")
                    conversation.pop("awaiting_underwriting_confirmation", None)
                    self.conversations[conversation_id] = conversation
                    return {
                        "response": "I understand. Is there anything you'd like to clarify or change before we proceed with the loan decision?",
                        "next_action": "await_user_input",
                        "actions": []
                    }
            
            # Check for awaiting sanction confirmation
            if conversation.get("awaiting_sanction_confirmation"):
                print(f"🔄 Awaiting sanction confirmation...")
                if is_yes:
                    print(f"✅ User confirmed - proceeding to sanction")
                    conversation.pop("awaiting_sanction_confirmation", None)
                    conversation["stage"] = ConversationStage.SANCTION
                    self.conversations[conversation_id] = conversation
                    return self._handle_sanction(conversation_id)
                elif is_no:
                    print(f"❌ User declined sanction")
                    conversation.pop("awaiting_sanction_confirmation", None)
                    self.conversations[conversation_id] = conversation
                    return {
                        "response": "No problem. Would you like to modify your loan details, or do you have any questions about the decision?",
                        "next_action": "await_user_input",
                        "actions": []
                    }
            
            # ============================================================
            # NO PENDING CONFIRMATIONS - USE LLM FOR INTENT DETECTION
            # ============================================================
            
            # Get LLM analysis of user message
            analysis = self.llm_controller.analyze_user_message(message, conversation)
            
            handler = analysis.get("next_handler", "engagement")
            reasoning = analysis.get("reasoning", "")
            
            print(f"")
            print(f"{'='*60}")
            print(f"🤖 LLM DECISION")
            print(f"{'='*60}")
            print(f"Intent: {analysis.get('intent')}")
            print(f"Handler: {handler}")
            print(f"Confidence: {analysis.get('confidence')}")
            print(f"Reasoning: {reasoning}")
            print(f"{'='*60}")
            print(f"")
            
            # Extract data using LLM if providing loan details
            if analysis.get("intent") == "provide_loan_details":
                loan_app = conversation.get("loan_application", {})
                extracted = analysis.get("extracted_data", {})
                
                # Update loan application with extracted data
                for key, value in extracted.items():
                    if value is not None:
                        loan_app[key] = value
                
                conversation["loan_application"] = loan_app
            
            # Route based on LLM's handler decision
            if handler == "confirmation":
                if "pending_emi_adjustment" in conversation:
                    return self._handle_emi_adjustment_confirmation(conversation_id)
                else:
                    # No pending action, check if we should advance the stage
                    loan_app = conversation.get("loan_application", {})
                    required = ["loan_amount", "salary", "employment_status", "city"]
                    has_all = all(field in loan_app for field in required)
                    
                    if has_all:
                        if not loan_app.get("verification_complete"):
                            conversation["stage"] = ConversationStage.VERIFICATION
                            return self._handle_verification(conversation_id)
                        elif not loan_app.get("underwriting_complete"):
                            conversation["stage"] = ConversationStage.UNDERWRITING
                            return self._handle_underwriting(conversation_id)
                        elif not loan_app.get("sanction_complete"):
                            conversation["stage"] = ConversationStage.SANCTION
                            return self._handle_sanction(conversation_id)
                        else:
                            conversation["stage"] = ConversationStage.CLOSURE
                            return self._handle_closure(conversation_id)
                    else:
                        # Missing details, go to needs assessment
                        conversation["stage"] = ConversationStage.NEEDS_ASSESSMENT
                        return self._handle_needs_assessment(conversation_id, message)
            
            elif handler == "rejection":
                if "pending_emi_adjustment" in conversation:
                    conversation.pop("pending_emi_adjustment", None)
                    return {
                        "response": "No problem! Let's continue with your original loan details. I'll process your application now.",
                        "next_action": "continue_with_original",
                        "actions": ["clear_pending_adjustment"]
                    }
                
                # Check if user is rejecting modification changes
                loan_app = conversation.get("loan_application", {})
                if not loan_app.get("verification_complete"):
                    # User said "no" to verification after modification
                    return {
                        "response": "I understand. How else can I assist you?",
                        "next_action": "await_further_input",
                        "actions": []
                    }
                
                # After sanction, "no" means they're done
                if loan_app.get("sanction_letter_generated"):
                    conversation["stage"] = ConversationStage.CLOSURE
                    return self._handle_closure(conversation_id, message)
                else:
                    return {
                        "response": "I understand. How else can I assist you?",
                        "next_action": "continue",
                        "actions": []
                    }
            
            elif handler == "hypothetical_emi":
                emi_amount = analysis.get("hypothetical_emi_amount")
                if emi_amount:
                    return self._handle_explanation_question(conversation_id, {
                        "type": "hypothetical_emi",
                        "question": message,
                        "emi_amount": emi_amount
                    })
            
            elif handler == "emi_explanation":
                return self._handle_explanation_question(conversation_id, {
                    "type": "emi_explanation",
                    "question": message
                })
            
            elif handler == "decision_explanation":
                return self._handle_explanation_question(conversation_id, {
                    "type": "decision_explanation",
                    "question": message
                })
            
            elif handler == "modification":
                extracted = analysis.get("extracted_data", {})
                print(f"📝 Extracted data from LLM: {extracted}")
                
                # If LLM didn't extract anything, try manual extraction from message
                if not extracted:
                    print(f"⚠️  No extracted data from LLM, attempting manual extraction...")
                    extracted = self._manual_extract_from_message(message, conversation)
                    print(f"📝 Manual extraction result: {extracted}")
                
                if extracted:
                    return self._handle_modification_request(conversation_id, {
                        "changes": extracted,
                        "original_message": message
                    })
                else:
                    # Fallback: treat as needs assessment
                    print(f"⚠️  No data extracted, falling back to needs_assessment")
                    conversation["stage"] = ConversationStage.NEEDS_ASSESSMENT
                    return self._handle_needs_assessment(conversation_id, message)
            
            elif handler == "rollback":
                # Handle rollback of changes
                rollback_to = analysis.get("rollback_to")
                print(f"🔄 Rollback requested for: {rollback_to or 'last change'}")
                return self._handle_rollback(conversation_id, rollback_to)
            
            elif handler == "objection":
                return self._handle_objection({"type": "general_concern", "message": message})
            
            elif handler == "needs_assessment":
                conversation["stage"] = ConversationStage.NEEDS_ASSESSMENT
                return self._handle_needs_assessment(conversation_id, message)
            
            elif handler == "verification":
                conversation["stage"] = ConversationStage.VERIFICATION
                return self._handle_verification(conversation_id)
            
            elif handler == "underwriting":
                conversation["stage"] = ConversationStage.UNDERWRITING
                return self._handle_underwriting(conversation_id)
            
            elif handler == "sanction":
                conversation["stage"] = ConversationStage.SANCTION
                return self._handle_sanction(conversation_id)
            
            elif handler == "confirmation" or handler == "rejection":
                # After sanction, user is responding to final confirmation
                loan_app = conversation.get("loan_application", {})
                if loan_app.get("sanction_letter_generated"):
                    conversation["stage"] = ConversationStage.CLOSURE
                    return self._handle_closure(conversation_id, message)
                else:
                    # Not at closure yet, handle normally
                    if handler == "confirmation":
                        # Already handled earlier, just continue flow
                        return {
                            "response": "Thank you for confirming. Processing...",
                            "next_action": "continue",
                            "actions": []
                        }
                    else:
                        return {
                            "response": "Understood. How else can I help you?",
                            "next_action": "continue",
                            "actions": []
                        }
            
            elif handler == "engagement":
                # Only go to engagement if truly starting fresh
                loan_app = conversation.get("loan_application", {})
                if loan_app and any(loan_app.values()):
                    # Has existing loan data, continue from current stage instead of resetting
                    print("⚠️  LLM suggested engagement but loan data exists, continuing current flow")
                    if loan_app.get("sanction_complete"):
                        return self._handle_sanction(conversation_id)
                    elif loan_app.get("underwriting_complete"):
                        return self._handle_sanction(conversation_id)
                    elif loan_app.get("verification_complete"):
                        return self._handle_underwriting(conversation_id)
                    else:
                        required = ["loan_amount", "salary", "employment_status", "city"]
                        has_all = all(field in loan_app for field in required)
                        if has_all:
                            return self._handle_verification(conversation_id)
                        else:
                            return self._handle_needs_assessment(conversation_id, message)
                else:
                    # Truly new, show engagement
                    conversation["stage"] = ConversationStage.ENGAGEMENT
                    return self._handle_engagement(message)
            
            else:
                # Fallback: determine stage and route
                loan_app = conversation.get("loan_application", {})
                required = ["loan_amount", "salary", "employment_status", "city"]
                has_all = all(field in loan_app for field in required)
                
                if has_all:
                    if not loan_app.get("verification_complete"):
                        conversation["stage"] = ConversationStage.VERIFICATION
                        return self._handle_verification(conversation_id)
                    elif not loan_app.get("underwriting_complete"):
                        conversation["stage"] = ConversationStage.UNDERWRITING
                        return self._handle_underwriting(conversation_id)
                    elif not loan_app.get("sanction_complete"):
                        conversation["stage"] = ConversationStage.SANCTION
                        return self._handle_sanction(conversation_id)
                    else:
                        conversation["stage"] = ConversationStage.CLOSURE
                        return self._handle_closure(conversation_id)
                else:
                    conversation["stage"] = ConversationStage.NEEDS_ASSESSMENT
                    return self._handle_needs_assessment(conversation_id, message)
            
        except Exception as e:
            print(f"⚠️  LLM routing failed: {e}. Falling back to rule-based routing.")
            import traceback
            traceback.print_exc()
            # Fallback to rule-based routing
            stage = self._determine_stage(conversation, message)
            conversation["stage"] = stage
            objection = self._detect_objection(message)
            return self._route_to_agent(conversation_id, message, stage, objection)
    
    def _check_unclear_message(self, message: str, conversation: Dict[str, Any]) -> list:
        """Check if message is unclear and provide suggestions"""
        message_lower = message.lower().strip()
        suggestions = []
        
        # Very short messages
        if len(message_lower) < 4:
            stage = conversation.get("stage", ConversationStage.ENGAGEMENT)
            if stage == ConversationStage.NEEDS_ASSESSMENT:
                loan_app = conversation.get("loan_application", {})
                if "loan_amount" not in loan_app:
                    suggestions = [
                        "I need a loan of 5 lakhs",
                        "I want to borrow 3 lakh rupees",
                        "Looking for a 10 lakh loan"
                    ]
                elif "salary" not in loan_app:
                    suggestions = [
                        "My salary is 50K per month",
                        "I earn 80,000 per month",
                        "Monthly income is 1 lakh"
                    ]
                elif "employment_status" not in loan_app:
                    suggestions = [
                        "I am salaried",
                        "I work on contract",
                        "I am self-employed"
                    ]
                elif "city" not in loan_app:
                    suggestions = [
                        "I live in Mumbai",
                        "I reside in Bangalore",
                        "My city is Delhi"
                    ]
        
        # Ambiguous words
        ambiguous_keywords = ["maybe", "might", "perhaps", "sort of", "kind of", "not sure"]
        if any(keyword in message_lower for keyword in ambiguous_keywords):
            suggestions = [
                "I need a loan of 5 lakhs, salary is 60K, I'm salaried, living in Trivandrum",
                "Can you explain the loan process?",
                "What documents do I need?"
            ]
        
        # Random or gibberish
        if len(message_lower) > 0 and message_lower.replace(" ", "").isalpha():
            vowels = sum(1 for c in message_lower if c in 'aeiou')
            consonants = sum(1 for c in message_lower if c.isalpha() and c not in 'aeiou')
            if len(message_lower) > 5 and vowels == 0:  # No vowels - likely gibberish
                suggestions = [
                    "I want a loan of 3 lakhs",
                    "What is the interest rate?",
                    "Tell me about eligibility criteria"
                ]
        
        return suggestions
    
    def _handle_verification(self, conversation_id: str) -> Dict[str, Any]:
        """Handle verification stage"""
        conversation = self.conversations[conversation_id]
        loan_app = conversation["loan_application"]
        
        # Check if verification already done
        if loan_app.get("verification_complete"):
            # Already verified, ask if user wants to proceed to underwriting
            return {
                "response": "✅ Your verification is already complete. Would you like me to proceed with the loan decision?",
                "next_action": "await_underwriting_confirmation",
                "actions": []
            }
        
        # First time in verification - show verifying message and results
        response = "🔍 **Verifying your details with our system...**\n\n"
        
        # Mock verification result (in real system, this would be async)
        verification_result = {
            "credit_score": 750,
            "kyc_status": "verified",
            "salary_verified": True,
            "eligible_limit": 2500000,
            "risk_flag": "low",
            "document_status": "complete"
        }
        
        # Update conversation with verification results
        loan_app.update(verification_result)
        loan_app["verification_complete"] = True
        conversation["loan_application"] = loan_app
        conversation["awaiting_underwriting_confirmation"] = True
        self.conversations[conversation_id] = conversation
        
        response += f"""✅ **Verification Complete!**

| Check | Result |
|-------|--------|
| 📊 Credit Score | **{verification_result['credit_score']}** (Excellent) |
| ✅ KYC Status | Verified |
| ✅ Salary | Verified |
| 💰 Eligible Limit | ₹{verification_result['eligible_limit']:,} |
| 🛡️ Risk Level | {verification_result['risk_flag'].title()} |

---

🎉 **Great news!** Your profile looks strong.

**Would you like me to proceed with the loan decision (underwriting)?** *(Type "yes" or "proceed" to continue)*"""
        
        # Format verification data for display in separate box
        verification_display = {
            "title": "Verification Complete",
            "status": "success",
            "items": [
                {"label": "Credit Score", "value": verification_result['credit_score'], "icon": "📊"},
                {"label": "KYC Status", "value": "Verified", "icon": "✅"},
                {"label": "Salary Verification", "value": "Verified", "icon": "✅"},
                {"label": "Eligible Loan Limit", "value": f"₹{verification_result['eligible_limit']:,}", "icon": "💰"},
                {"label": "Risk Level", "value": verification_result['risk_flag'].title(), "icon": "🛡️"}
            ]
        }
        
        return {
            "response": response,
            "next_action": "await_underwriting_confirmation",
            "actions": ["verify_credit", "verify_kyc", "calculate_eligibility"],
            "verification_result": verification_result,
            "verification_display": verification_display
        }
    
    def _handle_underwriting(self, conversation_id: str) -> Dict[str, Any]:
        """Handle underwriting stage"""
        conversation = self.conversations[conversation_id]
        loan_app = conversation["loan_application"]
        
        # Apply business rules using rule engine
        rule_result = self.rule_engine.determine_approval_path(loan_app)
        
        # Determine decision based on rule result
        if rule_result["path"] == "instant_approval":
            decision_text = "🎉 **APPROVED!**"
            decision_desc = "Your loan application has been **instantly approved** based on your strong credentials!"
            loan_app["decision"] = "approved"
            loan_app["reason"] = rule_result["reason"]
        elif rule_result["path"] == "conditional_approval":
            decision_text = "✅ **CONDITIONALLY APPROVED**"
            decision_desc = "Your application qualifies for conditional approval. We may need additional documents to finalize."
            loan_app["decision"] = "conditional"
            loan_app["reason"] = rule_result["reason"]
        else:
            decision_text = "📋 **UNDER REVIEW**"
            decision_desc = "We're processing your application and will verify additional details before making a final decision."
            loan_app["decision"] = "under_review"
            loan_app["reason"] = rule_result["reason"]
        
        # Update conversation
        loan_app["underwriting_complete"] = True
        conversation["loan_application"] = loan_app
        conversation["awaiting_sanction_confirmation"] = True
        self.conversations[conversation_id] = conversation
        
        response = f"""📝 **Underwriting Decision**

---

## {decision_text}

{decision_desc}

**Reason:** {rule_result['reason']}

---

**Would you like me to generate your sanction letter?** *(Type "yes" or "proceed" to continue)*"""
        
        return {
            "response": response,
            "next_action": "await_sanction_confirmation",
            "actions": ["apply_business_rules", "calculate_risk", "make_decision"]
        }
    
    def _handle_sanction(self, conversation_id: str) -> Dict[str, Any]:
        """Handle sanction stage"""
        conversation = self.conversations[conversation_id]
        loan_app = conversation["loan_application"]
        
        # Use existing values from loan_app if available, otherwise use defaults
        existing_emi = loan_app.get("emi_amount", 0)
        existing_tenure = loan_app.get("tenure_months", 60)
        existing_interest = loan_app.get("interest_rate", 10.5)
        
        # Prepare sanction details - preserve existing EMI/tenure if user adjusted them
        sanction_details = {
            "loan_amount": loan_app.get("loan_amount", 0),
            "interest_rate": existing_interest,
            "tenure_months": existing_tenure,
            "processing_fee": loan_app.get("loan_amount", 0) * 0.005,  # 0.5% processing fee
            "document_requirements": [] if loan_app.get("decision") == "approved" else ["salary_slip"]
        }
        
        # Use existing EMI if available, otherwise calculate
        if existing_emi > 0:
            sanction_details["emi_amount"] = existing_emi
        else:
            # Calculate EMI only if not already set
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
        response = f"📋 **Your Loan Has Been Sanctioned!**\n\n"
        response += f"**Loan Details:**\n"
        response += f"- Sanctioned Amount: ₹{sanction_details['loan_amount']:,}\n"
        response += f"- Interest Rate: {sanction_details['interest_rate']}%\n"
        response += f"- Monthly EMI: ₹{emi_amount:,}\n"
        response += f"- Tenure: {sanction_details['tenure_months']} months\n"
        response += f"- Processing Fee: ₹{sanction_details['processing_fee']:,}\n\n"
        
        # Mark that sanction letter is generated
        loan_app["sanction_letter_generated"] = True
        conversation["loan_application"] = loan_app
        self.conversations[conversation_id] = conversation
        
        response += "📄 **Sanction letter generated successfully!**\n\n"
        response += "💡 You can view your sanction letter by clicking the 'View Sanction Letter' button above.\n\n"
        response += "❓ **Do you have any questions or would you like to make any changes to your loan details?**\n"
        response += "- Type 'no' or 'proceed' if everything looks good\n"
        response += "- Or tell me what you'd like to change"
        
        return {
            "response": response,
            "next_action": "await_final_confirmation",
            "actions": ["calculate_sanction", "generate_document", "show_sanction_button"],
            "sanction_letter_ready": True,
            "show_sanction_letter_button": True
        }
    
    def _handle_closure(self, conversation_id: str, message: str = "") -> Dict[str, Any]:
        """Handle closure stage - check if user wants changes or is done"""
        conversation = self.conversations[conversation_id]
        loan_app = conversation.get("loan_application", {})
        
        # Check if user wants to proceed or make changes
        message_lower = message.lower()
        wants_changes = any(word in message_lower for word in ['change', 'modify', 'update', 'different', 'adjust', 'wrong'])
        confirmed = any(word in message_lower for word in ['no', 'proceed', 'good', 'fine', 'ok', 'yes', 'correct', 'looks good'])
        
        if wants_changes:
            # User wants to make changes, reset to verification
            loan_app.pop("verification_complete", None)
            loan_app.pop("underwriting_complete", None)
            loan_app.pop("sanction_complete", None)
            loan_app.pop("sanction_letter_generated", None)
            conversation["loan_application"] = loan_app
            conversation["stage"] = ConversationStage.NEEDS_ASSESSMENT
            self.conversations[conversation_id] = conversation
            
            response = "No problem! Let me help you update your details.\n\n"
            response += "Please tell me what you'd like to change:\n"
            response += "- Loan amount\n"
            response += "- Monthly salary\n"
            response += "- Employment status\n"
            response += "- City\n\n"
            response += "Just tell me the changes and I'll process your application again."
            
            return {
                "response": response,
                "next_action": "restart_from_changes",
                "actions": ["reset_verification"]
            }
        
        elif confirmed:
            # User is done, end conversation
            conversation["conversation_ended"] = True
            conversation["stage"] = ConversationStage.CLOSURE
            self.conversations[conversation_id] = conversation
            
            response = "✅ **Thank you for using PRIMUM Loan Services!**\n\n"
            response += "Your loan application has been successfully processed.\n"
            response += "Your sanction letter is ready for download.\n\n"
            response += "📧 A relationship manager will contact you shortly to complete the documentation process.\n\n"
            response += "❓ **Are your doubts clear, or do you have any more queries?**\n\n"
            response += "If not, thank you for choosing PRIMUM! We appreciate your business.\n\n"
            response += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            response += "**🔚 Conversation Ended**\n"
            response += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
            response += "💡 Click '**New Chat**' button above to start a new loan application."
            
            return {
                "response": response,
                "next_action": "conversation_complete",
                "actions": ["send_confirmation", "schedule_follow_up"],
                "conversation_ended": True
            }
        
        else:
            # Unclear response, ask again
            response = "I'm here to help! Please let me know:\n"
            response += "- Are you satisfied with these details? (say 'yes' or 'proceed')\n"
            response += "- Or would you like to make changes? (tell me what to change)"
            
            return {
                "response": response,
                "next_action": "await_clarification",
                "actions": []
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