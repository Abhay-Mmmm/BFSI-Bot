# LLM-Powered Intelligent Routing with Groq

This system now uses **Groq's Llama-3.3-70B** for intelligent conversation flow control while maintaining your existing structured responses.

## 🎯 What the LLM Does

**Intelligence Layer:**
- ✅ Understands user intent (better than regex patterns)
- ✅ Extracts loan details from natural language
- ✅ Detects questions, confirmations, modifications
- ✅ Handles complex/ambiguous user inputs
- ✅ Routes to appropriate handlers

**Your Existing Responses:**
- ✅ All your structured responses are kept
- ✅ Verification boxes, EMI calculations unchanged
- ✅ Approval/rejection logic unchanged
- ✅ Stage-based flow maintained

## 🔄 Hybrid Architecture

```
User Message
    ↓
Groq Llama-3.3-70B → Intent Detection
    ↓
Your Existing Handlers → Structured Responses
    ↓
User sees familiar responses
```

## 🚀 Already Configured!

✅ Groq API key is already set in `.env`
✅ System is using Groq for intelligent routing
✅ **Completely FREE** - No cost per conversation!

## 💰 Cost

**Groq's Free Tier:**
- ✅ **100% FREE**
- ✅ 30 requests/minute
- ✅ 14,400 tokens/minute  
- ✅ More than enough for your use case!

## ⚡ Speed

**Groq is FAST:**
- Response time: ~0.3-0.5 seconds
- 10x faster than OpenAI
- Perfect for real-time chat

## 🔧 How It Works

When backend starts, you'll see:
```
✅ LLM Controller initialized - Using Groq Llama-3.3-70B (FREE)
```

Every user message is analyzed by Groq's fast AI model for intelligent intent detection.

## 🔄 Fallback Mode (If Groq unavailable)

If Groq API key is not set, system automatically falls back to:
- ✅ Rule-based pattern matching (current regex system)
- ✅ All functionality works, just less intelligent
- ⚠️ May miss complex/ambiguous user inputs

## 🎯 Examples

### Better Intent Detection

**User:** "I make around 70k monthly, need about 2 lakh loan, I'm working in Mumbai as a contractor"

**Old System:** Might miss "contractor" → defaults to salaried
**LLM System:** Correctly extracts:
```json
{
  "loan_amount": 200000,
  "salary": 70000,
  "employment_status": "contract",
  "city": "mumbai"
}
```

### Confirmation Detection

**User:** "yeah sure go ahead" (after hypothetical EMI breakdown)

**Old System:** Regex pattern `\b(yes|yeah|sure)\b` might trigger incorrectly
**LLM System:** Understands context → checks if EMI adjustment is pending → applies it

### Complex Questions

**User:** "if I was earning more, could I get a bigger loan?"

**Old System:** Doesn't match any pattern
**LLM System:** Detects as `question_type: hypothetical_scenario` → provides explanation

## 📊 Monitoring

Check terminal output for LLM decisions:
```
🤖 LLM Analysis: intent=provide_loan_details, confidence=0.95
🤖 LLM Analysis: intent=confirm, confidence=0.88
```

## 🎛️ Configuration

Edit `llm/llm_controller.py` to:
- Change model: `self.model = "llama-3.1-70b-versatile"` (different Groq model)
- Adjust temperature: `temperature=0.1` (lower = more deterministic)
- Modify max_tokens: `max_tokens=500` (limit response length)

Available Groq models:
- `llama-3.3-70b-versatile` (default - best balance)
- `llama-3.1-70b-versatile` (slightly older)
- `mixtral-8x7b-32768` (good for long context)

## 🐛 Troubleshooting

**LLM not working?**
```
⚠️  LLM not available - Using rule-based patterns
```
→ Check `GROQ_API_KEY` in `.env` file

**Import error?**
```
ImportError: No module named 'groq'
```
→ Run `pip install groq`

**API key invalid?**
→ Get free key at https://console.groq.com

## 🔒 Security

- API key is in `.env` file (already configured)
- `.gitignore` excludes `.env` from commits
- Free tier has no cost risk
