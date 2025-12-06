# Rule Engine for PRIMUM AI Sales Orchestration Platform
# Handles edge cases and business rules

import json
from typing import Dict, Any, List
from enum import Enum


class RiskCategory(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RuleEngine:
    """Rule Engine supporting edge cases and business logic"""
    
    def __init__(self, config_file: str = "rules_config.json"):
        self.rules_config = self.load_rules_config(config_file)
    
    def load_rules_config(self, config_file: str) -> Dict[str, Any]:
        """Load rules configuration from JSON file"""
        default_config = {
            "credit_score_thresholds": {
                "excellent": 750,
                "good": 700,
                "fair": 650,
                "poor": 600
            },
            "loan_to_income_ratios": {
                "max_ratio": 0.5,  # EMI should not exceed 50% of monthly income
                "conservative_ratio": 0.3  # Conservative: 30% of income
            },
            "document_verification_rules": {
                "salary_slip_required_threshold": 2000000,
                "bank_statement_months": 6,
                "income_proof_documents": ["salary_slip", "bank_statement", "tax_returns"]
            },
            "approval_rules": {
                "instant_approval_limit": 1000000,
                "conditional_approval_multiple": 2,
                "rejection_threshold": {
                    "credit_score": 600,
                    "dti_ratio": 0.6  # Debt-to-income ratio
                }
            },
            "escalation_rules": {
                "high_value_threshold": 5000000,
                "high_risk_score": 80,
                "escalation_reasons": ["high_value", "high_risk", "complex_case"]
            }
        }
        
        # In a real system, we would load from file
        return default_config
    
    def evaluate_missing_documents(self, application_data: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate if there are missing documents and recommend next steps"""
        required_docs = self.rules_config["document_verification_rules"]["income_proof_documents"]
        provided_docs = application_data.get("provided_documents", [])
        
        missing_docs = [doc for doc in required_docs if doc not in provided_docs]
        
        recommendations = []
        if "salary_slip" not in provided_docs:
            recommendations.append("Please upload your latest salary slip")
        if "bank_statement" not in provided_docs:
            recommendations.append("Please provide 6 months bank statement")
        
        return {
            "missing_documents": missing_docs,
            "recommendations": recommendations,
            "can_proceed": len(missing_docs) <= 1  # Allow proceeding with one missing doc
        }
    
    def evaluate_credit_risk(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate credit risk based on credit score and other factors"""
        credit_score = customer_data.get("credit_score", 0)
        loan_amount = customer_data.get("loan_amount", 0)
        monthly_income = customer_data.get("monthly_income", 0)
        
        # Determine risk based on credit score
        if credit_score >= self.rules_config["credit_score_thresholds"]["excellent"]:
            risk_category = RiskCategory.LOW
            risk_score = 20
        elif credit_score >= self.rules_config["credit_score_thresholds"]["good"]:
            risk_category = RiskCategory.MEDIUM
            risk_score = 40
        elif credit_score >= self.rules_config["credit_score_thresholds"]["fair"]:
            risk_category = RiskCategory.HIGH
            risk_score = 60
        else:
            risk_category = RiskCategory.CRITICAL
            risk_score = 80
        
        # Calculate debt-to-income ratio
        if monthly_income > 0:
            emi_amount = customer_data.get("emi_amount", 0)
            dti_ratio = emi_amount / monthly_income
        else:
            dti_ratio = 1.0  # Default to high ratio if no income
        
        # Apply DTI adjustment to risk
        if dti_ratio > self.rules_config["loan_to_income_ratios"]["max_ratio"]:
            risk_score = min(risk_score + 20, 100)
            if risk_score > 80:
                risk_category = RiskCategory.CRITICAL
        
        return {
            "risk_category": risk_category.value,
            "risk_score": risk_score,
            "dti_ratio": dti_ratio,
            "credit_score": credit_score
        }
    
    def determine_approval_path(self, application_data: Dict[str, Any]) -> Dict[str, Any]:
        """Determine the appropriate approval path based on application data"""
        loan_amount = application_data.get("loan_amount", 0)
        eligible_limit = application_data.get("eligible_limit", 0)
        credit_score = application_data.get("credit_score", 0)
        document_status = application_data.get("document_status", "incomplete")
        
        # Check for pre-approved cases
        if application_data.get("is_pre_approved", False):
            return {
                "path": "instant_approval",
                "reason": "Customer is pre-approved",
                "requires_verification": False
            }
        
        # Check instant approval conditions
        if (loan_amount <= self.rules_config["approval_rules"]["instant_approval_limit"] and 
            credit_score >= self.rules_config["credit_score_thresholds"]["good"] and
            document_status == "complete"):
            return {
                "path": "instant_approval",
                "reason": "Loan amount within instant approval limit with good credit score and complete documents",
                "requires_verification": False
            }
        
        # Check conditional approval (salary slip required)
        if (loan_amount <= self.rules_config["approval_rules"]["conditional_approval_multiple"] * eligible_limit and
            credit_score >= self.rules_config["credit_score_thresholds"]["poor"]):
            return {
                "path": "conditional_approval",
                "reason": "Loan within income multiple but requires additional documents",
                "requires_verification": True
            }
        
        # Check for rejection conditions
        if (credit_score < self.rules_config["approval_rules"]["rejection_threshold"]["credit_score"] or
            loan_amount > 3 * eligible_limit):  # Adjusted threshold
            return {
                "path": "rejection",
                "reason": "Credit score too low or loan amount too high relative to income",
                "requires_verification": False
            }
        
        # Default to standard verification
        return {
            "path": "standard_verification",
            "reason": "Standard verification required",
            "requires_verification": True
        }
    
    def determine_human_escalation(self, application_data: Dict[str, Any]) -> Dict[str, Any]:
        """Determine if a case requires human escalation"""
        loan_amount = application_data.get("loan_amount", 0)
        risk_score = application_data.get("risk_score", 0)
        is_complex = application_data.get("is_complex_case", False)
        
        escalation_reasons = []
        
        # Check high value threshold
        if loan_amount > self.rules_config["escalation_rules"]["high_value_threshold"]:
            escalation_reasons.append("high_value")
        
        # Check high risk score
        if risk_score > self.rules_config["escalation_rules"]["high_risk_score"]:
            escalation_reasons.append("high_risk")
        
        # Check if case is marked as complex
        if is_complex:
            escalation_reasons.append("complex_case")
        
        return {
            "requires_escalation": len(escalation_reasons) > 0,
            "reasons": escalation_reasons,
            "recommended_action": "Route to Relationship Manager"
        }
    
    def apply_limit_override(self, application_data: Dict[str, Any], override_reason: str) -> Dict[str, Any]:
        """Apply limit override based on special circumstances"""
        original_limit = application_data.get("eligible_limit", 0)
        
        # Define override multipliers based on reason
        override_multipliers = {
            "existing_customer": 1.2,
            "high_net_worth": 1.5,
            "salary_account_holder": 1.3,
            "government_employee": 1.4,
            "corporate_salaried": 1.2
        }
        
        multiplier = override_multipliers.get(override_reason, 1.0)
        new_limit = int(original_limit * multiplier)
        
        return {
            "original_limit": original_limit,
            "override_reason": override_reason,
            "multiplier": multiplier,
            "new_limit": new_limit,
            "override_approved": multiplier > 1.0
        }


# Example usage
if __name__ == "__main__":
    rule_engine = RuleEngine()
    
    # Example customer data
    customer_data = {
        "credit_score": 720,
        "loan_amount": 2000000,
        "monthly_income": 150000,
        "emi_amount": 50000,
        "eligible_limit": 2500000,
        "document_status": "complete",
        "is_pre_approved": False
    }
    
    # Evaluate credit risk
    risk_result = rule_engine.evaluate_credit_risk(customer_data)
    print("Risk Evaluation:", risk_result)
    
    # Determine approval path
    approval_result = rule_engine.determine_approval_path(customer_data)
    print("Approval Path:", approval_result)
    
    # Check for human escalation
    escalation_result = rule_engine.determine_human_escalation(customer_data)
    print("Escalation Check:", escalation_result)