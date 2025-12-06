# PRIMUM - Human-Like AI Sales Orchestration Platform for Personal Loans (BFSI)

## Business Process Model and Notation (BPMN) Style Sales Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER ACQUISITION PHASE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Lead Engagement                          →  Needs Assessment                   │
│  (Stage: Engagement)                      (Stage: Needs Assessment)            │
│  - Customer initiates contact            - Gather loan requirements             │
│  - Initial greeting                      - Loan amount, salary, employment      │
│  - Basic information capture             - City, purpose, EMI preference        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                       ELIGIBILITY VERIFICATION PHASE                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Credit Check        →  KYC Verification  →  Income Validation  →  Risk Assessment
│  (Credit Bureau)     (Identity Check)     (Salary Verification)  (Risk Scoring) │
│  - Credit score      - Aadhaar/PAN        - Salary slip review   - Credit risk  │
│  - Payment history   - Address proof      - Bank statements      - Income risk  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      LOAN APPROVAL DECISION PHASE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Business Rules Engine Application                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ IF loan_amount ≤ eligible_limit THEN → Instant Approval                    ││
│  │ ELIF loan_amount ≤ 2×eligible_limit THEN → Salary Slip Required            ││
│  │ ELIF credit_score < 700 OR loan_amount > 2×limit THEN → Rejection          ││
│  │ ELSE → Standard Review Process                                             ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│  → Decision: Approve/Conditional/Reject                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      LOAN SANCTION & DOCUMENTATION PHASE                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Sanction Letter Generation  →  Document Request  →  EMI Schedule  →  Disbursement
│  (PDF Generation)            (If Required)        (Calculation)      (Processing)
│  - Loan terms                - Salary slip        - Monthly EMI      - Fund transfer
│  - Interest rate             - Bank statements    - Tenure options   - Account setup
│  - Repayment terms           - Identity docs      - Total interest   - Processing fee
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          CRM & FOLLOW-UP PHASE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Lead Closure              →  Relationship Mgmt  →  Disbursement Tracking       │
│  (CRM Update)              (Customer Support)    (Fund Transfer Status)         │
│  - Status update           - Follow-up calls     - Process monitoring           │
│  - Next action planned     - Query resolution    - Completion confirmation      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Conversation Flow States

```
START
  │
  ▼
ENGAGEMENT ──────→ NEEDS_ASSESSMENT ────→ VERIFICATION ────→ UNDERWRITING
  │                   │                      │                   │
  │                   │                      │                   │
  │                   ▼                      ▼                   ▼
  │              REQUIREMENTS        CREDIT_KYC_VALIDATION  APPROVAL_DECISION
  │              GATHERING           COMPLETED              MADE
  │                   │                      │                   │
  │                   ▼                      ▼                   ▼
  │              REQUIREMENTS        VERIFICATION           DECISION
  │              COMPLETE            COMPLETE               COMMUNICATED
  │                   │                      │                   │
  │                   ▼                      │                   ▼
  └─────────────── BACK TO ENGAGEMENT ◄──────┘              │
                                                           │
                                                           ▼
SANCTION ──────────────────────────────────────────→ CLOSURE
  │                                                     │
  │                                                     │
  ▼                                                     ▼
SANCTION            SANCTION                     CLOSURE
LETTER              LETTER                       ACTIVITIES
GENERATED           ACCEPTED                     COMPLETED
& DOWNLOADED        & ACKNOWLEDGED               (CRM UPDATE)
```

## Agent Handoff Triggers

### 1. Sales Agent → Verification Agent
- Trigger: Customer provides basic information (salary, employment)
- Criteria: Completion of needs assessment

### 2. Verification Agent → Underwriting Agent  
- Trigger: Verification process completed
- Criteria: All required verifications done

### 3. Underwriting Agent → Sanction Agent
- Trigger: Approval decision made
- Criteria: Loan approved and all conditions met

### 4. Human Escalation Points
- High-value loans (>₹50 Lakhs)
- Complex risk scenarios
- System uncertainty
- Customer requests human interaction

## Risk Assessment Criteria

| Risk Level | Credit Score | Debt-to-Income | Loan-to-Value | Action |
|------------|--------------|----------------|---------------|---------|
| Low        | >750         | <30%           | <50%          | Instant Approval |
| Medium     | 700-749      | 30-40%         | 50-70%        | Conditional Approval |
| High       | 650-699      | 40-50%         | 70-80%        | Manual Review |
| Critical   | <650         | >50%           | >80%          | Rejection |

## Integration Touchpoints

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CUSTOMER      │    │  PRIMUM AI      │    │ EXTERNAL       │
│   INTERFACE     │    │  PLATFORM       │    │  SYSTEMS       │
└─────────┬───────┘    └───────┬─────────┘    └─────────┬───────┘
          │                    │                        │
          │ User Query         │                        │
          │───────────────────▶│                        │
          │                    │ 1. Verify Identity     │
          │                    │───────────────────────▶│
          │                    │ 2. Check Credit Score  │
          │                    │───────────────────────▶│
          │                    │ 3. Validate Income     │
          │                    │───────────────────────▶│
          │                    │                        │
          │                    │                        │
          │                    │ 4. Underwrite Loan     │
          │                    │───────────────────────▶│
          │                    │ 5. Generate Sanction   │
          │                    │───────────────────────▶│
          │                    │ 6. Update CRM          │
          │                    │───────────────────────▶│
          │                    │                        │
          │ AI Response        │                        │
          │◀───────────────────│                        │
          │                    │                        │