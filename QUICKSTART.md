# 🚀 BFSI-Bot Quick Start Guide

## Critical Problems Fixed ✅

1. ✅ Document Upload API implemented
2. ✅ Document Download API improved with better file handling
3. ✅ Frontend document upload connected to backend
4. ✅ File validation (type & size) added

## How to Run the Application

### Step 1: Start Backend (Terminal 1)

```powershell
# Navigate to backend
cd E:\Projects\VSC\EY\BFSI-Bot\backend

# Create .env file (first time only)
Copy-Item .env.example.env .env

# Install dependencies (first time only)
pip install -r requirements.txt

# Start backend server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Test Backend:**
- Open browser: http://localhost:8000/health
- Should see: `{"status": "healthy", ...}`

---

### Step 2: Start Frontend (Terminal 2)

```powershell
# Navigate to frontend
cd E:\Projects\VSC\EY\BFSI-Bot\frontend

# Install dependencies (first time only - already done)
npm install

# Start frontend
npm start
```

**Expected Output:**
```
Compiled successfully!
You can now view primum-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

**Access Application:**
- Main Chat: http://localhost:3000/
- Dashboard: http://localhost:3000/dashboard
- Settings: http://localhost:3000/settings
- Team: http://localhost:3000/team

---

## ✅ What's Working Now

### Backend APIs:
- ✅ POST /conversation/start - Start new conversation
- ✅ POST /conversation/query - Send messages
- ✅ GET /conversation/{id} - Get conversation details
- ✅ POST /documents/upload - Upload documents (NEW!)
- ✅ GET /documents/download/{id} - Download documents (FIXED!)
- ✅ POST /verification/credit - Check credit score
- ✅ GET /loan/status/{id} - Get loan status
- ✅ POST /settings/model - Update AI model
- ✅ GET /health - Health check

### Frontend Features:
- ✅ Chat interface with AI
- ✅ Document upload with validation
- ✅ Real-time conversation
- ✅ Loan status display
- ✅ EMI calculator
- ✅ Settings panel

---

## 🔴 Known Limitations (Still to Fix)

### High Priority:
1. Dashboard uses mock data - needs real API integration
2. Team Dashboard uses mock data
3. Sanction letter generation has hardcoded data
4. No authentication system
5. No user management

### Medium Priority:
6. No database persistence (uses in-memory storage)
7. No email/SMS notifications
8. No real credit bureau integration
9. No CRM integration (uses mock)

---

## 🐛 Troubleshooting

### Frontend won't start:
```powershell
cd frontend
rm -r node_modules
npm install
npm start
```

### Backend errors:
```powershell
cd backend
pip install --upgrade -r requirements.txt
python -m uvicorn main:app --reload
```

### Port already in use:
```powershell
# Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### CORS errors:
Backend already configured for CORS. If issues persist, check that backend is running on port 8000.

---

## 📝 Testing the Application

### Test Document Upload:
1. Start a conversation
2. Upload a PDF, JPG, or PNG file (max 10MB)
3. Check backend uploads folder: `backend/uploads/`
4. File should be saved with UUID prefix

### Test Chat:
1. Type: "I need a loan of 5 lakhs"
2. AI should respond and gather requirements
3. Check conversation flow through stages

### Test APIs:
Visit http://localhost:8000/docs for interactive API documentation

---

## 🎯 Next Steps

To make this production-ready:
1. Implement authentication (JWT)
2. Add database (PostgreSQL)
3. Connect real Dashboard APIs
4. Add email/SMS notifications
5. Implement proper error handling
6. Add logging and monitoring
7. Deploy to cloud (AWS/Azure/GCP)

---

## 📞 Need Help?

- Check terminal outputs for errors
- Visit API docs: http://localhost:8000/docs
- Check browser console for frontend errors
- Review this guide again

**Last Updated:** December 8, 2025
