"""
LLM Controller for intelligent conversation flow and intent detection.
Uses Groq (faster, free tier) for understanding user intent and routing.
"""

import os
import json
from typing import Dict, Any, List, Optional
from groq import Groq

class LLMController:
    """
    LLM-based controller for conversation intelligence using Groq.
    Makes decisions about routing while using existing structured responses.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize LLM controller with Groq API key"""
        self.client = Groq(api_key=api_key or os.getenv("GROQ_API_KEY"))
        self.model = "llama-3.1-8b-instant"  # Faster model, uses fewer tokens
        self.fallback_model = "llama-3.3-70b-versatile"  # More powerful but higher token usage
        
    def analyze_user_message(self, message: str, conversation_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze user message to determine intent and extract information.
        
        Returns:
            {
                "intent": "provide_loan_details" | "ask_question" | "confirm" | "modify" | "object" | "greeting",
                "extracted_data": {
                    "loan_amount": 150000,
                    "salary": 60000,
                    "employment_status": "salaried",
                    "city": "trivandrum"
                },
                "question_type": "emi_explanation" | "decision_explanation" | "hypothetical_emi" | None,
                "modification_type": "loan_amount" | "salary" | "city" | "employment" | None,
                "confidence": 0.95
            }
        """
        
        loan_app = conversation_context.get("loan_application", {})
        stage = conversation_context.get("stage", "engagement")
        pending_emi = conversation_context.get("pending_emi_adjustment")
        
        system_prompt = f"""You are an AI assistant analyzing user messages for a loan application chatbot.

Current Context:
- Stage: {stage}
- Collected Info: {json.dumps(loan_app, indent=2)}
- Pending EMI Adjustment: {'Yes - user was shown hypothetical EMI breakdown and asked if they want to adjust' if pending_emi else 'No'}

Your job is to understand the user's intent and extract structured information.

Return a JSON object with:
{{
  "intent": "<one of: provide_loan_details, ask_question, confirm, reject, modify, object, greeting, other>",
  "next_handler": "<which handler to call: needs_assessment, verification, underwriting, sanction, emi_explanation, hypothetical_emi, decision_explanation, modification, objection, engagement, confirmation, rejection>",
  "extracted_data": {{
    "loan_amount": <number or null>,
    "salary": <number or null>,
    "employment_status": "<salaried|contract|self_employed or null>",
    "city": "<city name or null>"
  }},
  "question_type": "<if asking question: emi_explanation, decision_explanation, hypothetical_emi, or null>",
  "hypothetical_emi_amount": <if asking 'what if I paid X': number or null>,
  "modification_type": "<if modifying: loan_amount, salary, city, employment, or null>",
  "is_confirmation": <true if user is agreeing/confirming (yes/ok/sure/go ahead/please do), false otherwise>,
  "is_rejection": <true if user is declining WITHOUT proposing alternatives (no/nope/no need alone), false otherwise>,
  "reasoning": "<brief explanation of why you chose this handler>",
  "confidence": <0.0 to 1.0>
}}

CRITICAL: "what if" Detection:
- "what if I paid X as EMI?" → question_type: "hypothetical_emi", intent: "ask_question"
- "what if I was self-employed?" → intent: "modify", extracted_data: {{"employment_status": "self_employed"}}
- "what if my salary was 80k?" → intent: "modify", extracted_data: {{"salary": 80000}}
- "no, but what if I was X?" → intent: "modify" (the "but what if" overrides the "no")

Handler Selection Logic:
1. If pending EMI adjustment exists:
   - User confirms (yes/ok/sure) → next_handler: "confirmation"
   - User rejects (no/nope/skip) → next_handler: "rejection"

2. If user asks question:
   - "how is EMI calculated?" → next_handler: "emi_explanation"
   - "what if I paid X?" → next_handler: "hypothetical_emi"
   - "why was I approved/rejected?" → next_handler: "decision_explanation"

3. If user modifies info:
   - "change my salary to X" → next_handler: "modification"

4. If providing loan details:
   - Missing required fields → next_handler: "needs_assessment"
   - All fields present, not verified → next_handler: "verification"
   - Verified, not underwritten → next_handler: "underwriting"
   - Underwritten, not sanctioned → next_handler: "sanction"

5. If user has concerns:
   - "too expensive", "not sure" → next_handler: "objection"

6. IMPORTANT - Progress-based routing:
   - If verification_complete=true and user says ok/acknowledgment → next_handler: "underwriting"
   - If underwriting_complete=true and user says ok/acknowledgment → next_handler: "sanction"
   - If sanction_complete=true → next_handler: "sanction" (show final status)
   - Never reset to "engagement" unless explicitly starting new application

7. Only use "engagement" if:
   - Truly a new conversation (hello/hi at the very start)
   - No loan application data exists at all
   - User explicitly says "start over" or "new application"

8. For unclear acknowledgments (ok/ohh/hmm):
   - Check current stage and continue from there
   - Never reset to engagement unless stage is empty

Intent Definitions:
- provide_loan_details: User giving loan requirements (amount, salary, city, employment)
- ask_question: User asking how something works (EMI calculation, approval decision, etc)
- confirm: User confirming/agreeing to a suggestion (yes, ok, sure, please do it, go ahead)
- reject: User declining/rejecting a suggestion WITHOUT proposing changes (no, nope, no need, no thanks, skip, cancel)
- modify: User wants to change previously provided information OR asking "what if I was X instead?"
- object: User has concerns/objections (too expensive, not sure, need time)
- greeting: User saying hello/hi/starting conversation
- other: Anything else

IMPORTANT Distinction:
- "no" alone = reject (just declining)
- "no, but what if I was self-employed?" = modify (proposing a change)
- "what if my salary was 80k?" = modify (hypothetical change to application)
- "change my city to Mumbai" = modify (explicit change request)

For "what if" questions:
- "what if I paid 6k EMI?" → ask_question (hypothetical_emi calculation)
- "what if I was self-employed?" → modify (change employment status and recalculate)
- "what if my salary was higher?" → modify (change salary and recalculate)

IMPORTANT for Pending EMI Adjustment:
- If pending EMI exists and user says yes/ok/sure/go ahead → is_confirmation: true, intent: confirm
- If pending EMI exists and user says no/nope/no need/skip → is_rejection: true, intent: reject
- Context matters! "ok" after seeing breakdown = confirmation, "ok" in general chat = just acknowledgment

Question Types:
- emi_explanation: "How is EMI calculated?" "Why is my EMI X?"
- decision_explanation: "How did you decide?" "Why was I approved/rejected?"
- hypothetical_emi: "What if I paid 6000 per month?" "Can I pay 5k EMI?"

Extract numbers with Indian formats:
- "1.5 lakhs" = 150000
- "60k" = 60000  
- "2 crores" = 20000000
- "6000" = 6000
- "3 lakhs per year" / "per annum" = 300000/12 = 25000 (convert annual to monthly)
- "24k per month" = 24000

CRITICAL Salary Extraction:
- If user says "per year", "per annum", "annual", "yearly" → divide by 12 for monthly
- If user says "per month", "monthly" → use as-is
- Default assumption: amounts are monthly unless specified otherwise

Return ONLY valid JSON, no other text."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"User message: {message}"}
                ],
                temperature=0.1,
                response_format={"type": "json_object"},
                max_tokens=500
            )
            
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            print(f"LLM analysis error: {e}")
            # Fallback to basic analysis
            return {
                "intent": "other",
                "extracted_data": {},
                "question_type": None,
                "hypothetical_emi_amount": None,
                "modification_type": None,
                "is_confirmation": False,
                "confidence": 0.0
            }
    
    def decide_next_action(self, 
                          user_intent: Dict[str, Any], 
                          conversation_context: Dict[str, Any]) -> str:
        """
        Decide which handler to call based on LLM analysis.
        
        Returns:
            Handler name: "handle_confirmation", "handle_question", "handle_modification",
                         "handle_needs_assessment", "handle_verification", etc.
        """
        
        intent = user_intent.get("intent")
        stage = conversation_context.get("stage", "engagement")
        loan_app = conversation_context.get("loan_application", {})
        pending_emi = conversation_context.get("pending_emi_adjustment")
        
        # Priority 1: Confirmation of pending action
        if user_intent.get("is_confirmation") and pending_emi:
            return "handle_emi_confirmation"
        
        # Priority 2: Questions (explanations)
        if intent == "ask_question":
            question_type = user_intent.get("question_type")
            if question_type == "hypothetical_emi":
                return "handle_hypothetical_emi"
            elif question_type == "emi_explanation":
                return "handle_emi_explanation"
            elif question_type == "decision_explanation":
                return "handle_decision_explanation"
            return "handle_general_question"
        
        # Priority 3: Modifications
        if intent == "modify":
            return "handle_modification"
        
        # Priority 4: Objections
        if intent == "object":
            return "handle_objection"
        
        # Priority 5: Stage-based routing
        if intent == "provide_loan_details" or stage == "needs_assessment":
            # Check if we have all details
            required = ["loan_amount", "salary", "employment_status", "city"]
            has_all = all(field in loan_app for field in required)
            
            if has_all:
                return "handle_verification"
            else:
                return "handle_needs_assessment"
        
        # Stage-based defaults
        stage_handlers = {
            "engagement": "handle_engagement",
            "needs_assessment": "handle_needs_assessment",
            "verification": "handle_verification",
            "underwriting": "handle_underwriting",
            "sanction": "handle_sanction",
            "closure": "handle_closure"
        }
        
        return stage_handlers.get(stage, "handle_engagement")
    
    def extract_loan_requirements(self, message: str, current_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use LLM to extract loan requirements from natural language.
        More reliable than regex for complex sentences.
        """
        
        system_prompt = """Extract loan application details from user message.

Return JSON with any fields found (set to null if not mentioned):
{
  "loan_amount": <number in rupees>,
  "salary": <monthly salary in rupees>,
  "employment_status": "salaried" | "contract" | "self_employed" | null,
  "city": "<city name in lowercase>" | null
}

Handle Indian number formats:
- "1.5 lakhs" / "1.5L" = 150000
- "60k" / "60K" = 60000
- "2 crores" / "2cr" = 20000000

Employment keywords:
- "salaried", "salary", "employed", "job" → salaried
- "contract", "contractual" → contract
- "self employed", "business", "self-employed" → self_employed

Return ONLY valid JSON."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": message}
                ],
                temperature=0,
                response_format={"type": "json_object"},
                max_tokens=300
            )
            
            extracted = json.loads(response.choices[0].message.content)
            
            # Merge with current data (only add non-null values)
            result = current_data.copy()
            for key, value in extracted.items():
                if value is not None:
                    result[key] = value
            
            return result
            
        except Exception as e:
            print(f"LLM extraction error: {e}")
            return current_data
