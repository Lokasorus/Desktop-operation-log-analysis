# Document Processing Automation - Web Demo

**Interactive demonstration of the automation prototype**

## What This Is

A working web application that demonstrates the document processing automation system:
- **Web UI** - Visual interface to see the automation in action
- **AI Agent** - Optional intelligent assistant using Groq/Llama 3.1
- **Real-time Demo** - Watch documents get processed automatically
- **Statistics Dashboard** - See time savings and ROI metrics

## Technologies

- **Frontend:** HTML, CSS, JavaScript (vanilla - no build required)
- **Backend:** Python Flask server
- **AI:** Groq API with Llama 3.1 8B when enabled
- **Demo Mode:** Works without real APIs (uses simulated data)

## Quick Start

### Option 1: Demo Mode (No API Key Required)
```bash
cd demo_app
python server.py
```
Then open: http://localhost:5000

### Option 2: With Real AI (Requires a Groq API Key)
```bash
cd demo_app
set AI_ENABLED=true
set GROQ_API_KEY=your-api-key-here
python server.py
```

The server reads `AI_ENABLED` and `GROQ_API_KEY` from the environment. Without a valid key, it stays in deterministic demo mode. If an AI request fails during processing, the server falls back to the same rule-based validation used by demo mode.

## Features

### 1. Document Submission Interface
- Submit sample documents or metadata through the form
- See them get processed in real-time
- Visual feedback on validation status

### 2. AI Agent Assistant
- Powered by Llama 3.1 through Groq
- Reads document content
- Extracts metadata intelligently
- Makes approval recommendations
- Explains reasoning

### 3. Processing Dashboard
- Live processing queue
- Success/failure statistics
- Time savings calculator
- ROI metrics

### 4. Admin Panel
- View the in-memory audit log
- Reset the demo state

### 5. Human Approval Gate
- Validated documents are marked `READY FOR APPROVAL`
- A human can approve or reject them in the dashboard
- Invalid documents remain in `NEEDS REVIEW` and cannot be auto-approved

## Demo Scenarios

The app includes 3 pre-loaded demo scenarios:

1. **Happy Path** - Document passes all checks
2. **Missing Data** - Document fails validation (missing author)
3. **AI Assisted** - Optional AI can help extract missing information; the rule-based fallback remains available

## Perfect for Interview Demo

**Show this during your presentation:**
1. Open the web app
2. Upload a sample document
3. Watch automated validation process it
4. Review the result and make the human approval decision
5. Show the audit log and ROI dashboard

**Impact:** Makes your prototype tangible and impressive! 🚀

## Screenshots

```
┌─────────────────────────────────────┐
│  Document Processing Automation     │
├─────────────────────────────────────┤
│  [Upload Document]  [View Queue]    │
│                                     │
│  ┌───────────────┐                 │
│  │ Document.docx │  ✓ Processing   │
│  │ 2.5 MB        │  AI Agent:      │
│  │               │  "Extracted     │
│  │               │   metadata..."  │
│  └───────────────┘                 │
│                                     │
│  Processing Time: 2.1s              │
│  Manual Time: 118s                  │
│  Savings: 93% ⚡                    │
└─────────────────────────────────────┘
```

## Files Structure

```
demo_app/
├── server.py              # Flask backend
├── free_ai_agent.py       # Optional Groq/Llama integration
├── ai_agent.py            # Legacy optional agent module
├── static/
│   ├── index.html        # Main UI
│   ├── style.css         # Styling
│   └── app.js            # Frontend logic
├── install_dependencies.bat
└── start_demo.bat
```

## API Endpoints

```
GET  /                    # Main UI
POST /api/upload          # Upload document
GET  /api/queue           # Get processing queue
POST /api/process/<id>    # Run validation/AI processing
POST /api/decision/<id>   # Record human approval decision
GET  /api/stats           # Get statistics
GET  /api/logs            # Get audit logs
POST /api/reset           # Reset in-memory demo state
```

## Running the Demo

```bash
# Install dependencies
pip install flask requests

# Run in demo mode (no API key needed)
python server.py

# Or with AI enabled on Windows PowerShell
$env:AI_ENABLED="true"
$env:GROQ_API_KEY="your-api-key-here"
python server.py
```

The server will start on http://localhost:5000

## What Makes This Impressive

✅ **Visual** - Not just code, actual working UI
✅ **Interactive** - Can upload and process documents
✅ **AI-Powered** - Optionally shows Groq/Llama integration
✅ **Real Metrics** - Displays the 118-second manual baseline and measured demo time
✅ **Professional** - Looks like a real product
✅ **Easy to Demo** - Just open browser and show

## Next Steps

1. Run the demo: `python server.py`
2. Open browser: http://localhost:5000
3. Try uploading the sample documents
4. Watch the AI agent work!
5. Show this in your interview 🎯

---

**This is your "show something that works" moment!** 🚀
