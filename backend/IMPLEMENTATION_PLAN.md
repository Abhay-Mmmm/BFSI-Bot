# Implementation Plan: Enhanced User Interaction Features

## Overview
Implementing comprehensive changes to improve customer interaction flow with:
1. Customer name collection
2. Confirmation flow after every profile change
3. Rollback functionality for changes
4. Dynamic EMI updates in UI
5. Enhanced LLM understanding

## Changes Implemented

### 1. ✅ LLM Controller Updates (`llm_controller.py`)

**Added Fields:**
- `customer_name` extraction
- `is_rollback` detection
- `rollback_to` field specification
- Enhanced intent recognition for `rollback` intent

**Enhanced Prompts:**
- Better name extraction logic
- Rollback detection ("undo", "go back", "revert")
- Improved confirmation flow understanding
- Post-change confirmation detection

### 2. 🔄 Conversation Engine Updates (`conversation_engine.py`) - IN PROGRESS

**State Management:**
```python
conversation = {
    "change_history": [],  # Track all changes with timestamps
    "pending_changes": None,  # Store changes awaiting confirmation
    "awaiting_change_confirmation": False,  # Flag for confirmation state
}
```

**Change History Structure:**
```python
{
    "timestamp": datetime.now(),
    "field": "salary",
    "old_value": 50000,
    "new_value": 60000,
    "change_type": "modification"
}
```

## Required Implementation Steps

### Step 1: Update Needs Assessment Handler

**Current Behavior:**
```python
# Collects: loan_amount, salary, employment_status, city
# Shows summary and asks "Would you like me to proceed with verification?"
```

**New Behavior:**
```python
# Collects: customer_name, loan_amount, salary, employment_status, city
# After ANY change, show updated info and ask for confirmation
# Support rollback to previous values
```

**Implementation:**
```python
def _handle_needs_assessment(self, conversation_id, message):
    conversation = self.conversations[conversation_id]
    loan_app = conversation["loan_application"]
    
    # Extract requirements using LLM
    extracted = self._extract_requirements(conversation_id, message)
    
    # Check for modifications
    changes_made = []
    for field, new_value in extracted.items():
        old_value = loan_app.get(field)
        if old_value and old_value != new_value:
            # Track the change
            changes_made.append({
                "field": field,
                "old_value": old_value,
                "new_value": new_value,
                "timestamp": datetime.now()
            })
            conversation["change_history"].append(changes_made[-1])
    
    # Apply changes
    loan_app.update(extracted)
    
    # If changes were made, show confirmation
    if changes_made:
        response = "✅ **Updated Information:**\n\n"
        for change in changes_made:
            response += f"• {change['field'].title()}: "
            response += f"~~₹{change['old_value']:,}~~ → **₹{change['new_value']:,}**\n"
        
        response += "\n**Current Details:**\n"
        response += self._format_customer_details(loan_app)
        response += "\n\n**Would you like to proceed with these changes?**"
        response += "\n_(Type 'yes' to proceed, 'no' to cancel, or 'rollback' to undo)_"
        
        conversation["awaiting_change_confirmation"] = True
        conversation["pending_changes"] = changes_made
        
        return {
            "response": response,
            "next_action": "await_change_confirmation",
            "actions": ["show_updated_details"]
        }
```

### Step 2: Add Rollback Handler

```python
def _handle_rollback(self, conversation_id, rollback_to=None):
    """Rollback the last change or specific field"""
    conversation = self.conversations[conversation_id]
    change_history = conversation.get("change_history", [])
    
    if not change_history:
        return {
            "response": "No previous changes to rollback.",
            "next_action": "continue",
            "actions": []
        }
    
    loan_app = conversation["loan_application"]
    
    if rollback_to:
        # Rollback specific field
        for change in reversed(change_history):
            if change["field"] == rollback_to:
                loan_app[change["field"]] = change["old_value"]
                change_history.remove(change)
                
                response = f"✅ **Rolled back {change['field'].title()}:**\n"
                response += f"• Reverted from ₹{change['new_value']:,} to ₹{change['old_value']:,}\n\n"
                response += self._format_customer_details(loan_app)
                
                return {
                    "response": response,
                    "next_action": "continue_gathering",
                    "actions": ["rollback_applied"]
                }
    else:
        # Rollback last change
        last_change = change_history.pop()
        loan_app[last_change["field"]] = last_change["old_value"]
        
        response = f"✅ **Rolled back last change:**\n"
        response += f"• {last_change['field'].title()}: "
        response += f"~~₹{last_change['new_value']:,}~~ → **₹{last_change['old_value']:,}**\n\n"
        response += self._format_customer_details(loan_app)
        
        return {
            "response": response,
            "next_action": "continue_gathering",
            "actions": ["rollback_applied"]
        }

def _format_customer_details(self, loan_app):
    """Format customer details in a table"""
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
    
    return details
```

### Step 3: Update Modification Handler

```python
def _handle_modification(self, conversation_id, message):
    """Handle modification requests with confirmation flow"""
    conversation = self.conversations[conversation_id]
    loan_app = conversation["loan_application"]
    
    # Extract what changed using LLM
    analysis = self.llm_controller.analyze_user_message(message, conversation)
    extracted = analysis.get("extracted_data", {})
    modification_type = analysis.get("modification_type")
    
    # Track changes
    changes_made = []
    for field, new_value in extracted.items():
        if new_value is not None and field in loan_app:
            old_value = loan_app[field]
            if old_value != new_value:
                changes_made.append({
                    "field": field,
                    "old_value": old_value,
                    "new_value": new_value,
                    "timestamp": datetime.now()
                })
                conversation["change_history"].append(changes_made[-1])
                loan_app[field] = new_value
    
    # Recalculate EMI if loan_amount or salary changed
    if any(change["field"] in ["loan_amount", "salary"] for change in changes_made):
        loan_amount = loan_app.get("loan_amount", 150000)
        interest_rate = loan_app.get("interest_rate", 10.5)
        tenure = loan_app.get("tenure_months", 60)
        
        p = loan_amount
        r = interest_rate / 12 / 100
        n = tenure
        new_emi = p * r * ((1 + r) ** n) / (((1 + r) ** n) - 1)
        new_emi = round(new_emi, 2)
        
        loan_app["emi_amount"] = new_emi
        
        # Generate EMI breakdown for 5 tenures
        emi_data = self._calculate_emi_breakdown(loan_amount, interest_rate)
    
    # Show updated information and ask for confirmation
    response = "✅ **Changes Applied:**\n\n"
    for change in changes_made:
        response += f"• {change['field'].replace('_', ' ').title()}: "
        response += f"~~{change['old_value']}~~ → **{change['new_value']}**\n"
    
    response += "\n**Updated Profile:**\n"
    response += self._format_customer_details(loan_app)
    
    if "emi_amount" in loan_app:
        response += f"\n💳 **Estimated Monthly EMI:** ₹{loan_app['emi_amount']:,.2f}\n"
    
    response += "\n**Would you like to proceed with verification using these updated details?**"
    response += "\n_(Type 'yes', 'no', 'rollback', or make more changes)_"
    
    conversation["awaiting_change_confirmation"] = True
    conversation["pending_changes"] = changes_made
    
    # Reset verification flags to allow re-processing
    loan_app.pop("verification_complete", None)
    loan_app.pop("underwriting_complete", None)
    loan_app.pop("sanction_complete", None)
    
    return {
        "response": response,
        "next_action": "await_change_confirmation",
        "actions": ["show_updated_emi"],
        "emi_data": emi_data if "emi_amount" in loan_app else None
    }
```

### Step 4: Frontend Updates Required

**ChatInterface.js:**
```javascript
// Update state to include customer name
const [customerName, setCustomerName] = useState(null);

// Handle EMI data updates
useEffect(() => {
  if (response.emi_data) {
    setEmiData(response.emi_data);
  }
}, [response]);

// Update loan status display to show customer name
<LoanStatus 
  loanStatus={loanStatus}
  customerName={customerName}
  emiData={emiData}
/>
```

**LoanStatus.js:**
```javascript
const LoanStatus = ({ loanStatus, customerName, emiData }) => {
  return (
    <div className="loan-status-card">
      {customerName && (
        <div className="customer-name">
          <h3>👤 {customerName}</h3>
        </div>
      )}
      
      {/* Existing loan status display */}
      
      {/* EMI Quick View - updates dynamically */}
      {emiData && (
        <div className="emi-quick-view">
          <h4>Monthly EMI</h4>
          <p className="emi-amount">₹{emiData.emi_amount.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
};
```

## Testing Scenarios

### Scenario 1: Name Collection
```
User: "Hi, I need a loan"
Bot: "Hello! I'd be happy to help. May I know your name?"
User: "I'm Rajesh"
Bot: "Nice to meet you, Rajesh! ..."
```

### Scenario 2: Profile Changes with Confirmation
```
User: "I need 2 lakhs, my salary is 50k, I'm salaried in Mumbai"
Bot: "✅ Perfect! I've collected all your details:
      👤 Name: Rajesh
      💰 Loan Amount: ₹2,00,000
      💵 Monthly Salary: ₹50,000
      💼 Employment: Salaried
      🏙️ City: Mumbai
      💳 Estimated Monthly EMI: ₹4,242
      
      Would you like to proceed with verification?"
      
User: "Change salary to 60k"
Bot: "✅ Changes Applied:
      • Salary: ~~₹50,000~~ → **₹60,000**
      
      Updated Profile:
      👤 Name: Rajesh
      💰 Loan Amount: ₹2,00,000
      💵 Monthly Salary: ₹60,000
      💼 Employment: Salaried
      🏙️ City: Mumbai
      💳 Estimated Monthly EMI: ₹4,242
      
      Would you like to proceed with verification?"
```

### Scenario 3: Rollback
```
User: "rollback"
Bot: "✅ Rolled back last change:
      • Salary: ~~₹60,000~~ → **₹50,000**
      
      Current Details: [shows profile]"
```

### Scenario 4: Multiple Changes
```
User: "Change loan to 3 lakhs and make me self-employed"
Bot: "✅ Changes Applied:
      • Loan Amount: ~~₹2,00,000~~ → **₹3,00,000**
      • Employment: ~~Salaried~~ → **Self Employed**
      
      Updated Profile: [shows all details]
      💳 Estimated Monthly EMI: ₹6,363
      
      Would you like to proceed?"
```

## Next Steps

1. ✅ Update LLM Controller prompts
2. ⚠️ Implement rollback handler
3. ⚠️ Update needs assessment handler
4. ⚠️ Update modification handler
5. ⚠️ Add customer name extraction
6. ⚠️ Update frontend to show dynamic EMI updates
7. ⚠️ Add change history display in UI
8. ⚠️ Test all scenarios

## Notes

- All changes require user confirmation before proceeding to verification
- EMI should update instantly when loan_amount or salary changes
- Change history stored for entire session
- Rollback supports both "last change" and "specific field" rollback
- Customer name asked early in conversation
- LLM fully controls flow based on user intent
