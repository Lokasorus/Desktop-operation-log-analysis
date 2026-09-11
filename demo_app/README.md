# Document Processing Automation - Web Demo

**Interactive demonstration of the automation prototype**

## What This Is

A working web application that demonstrates the document processing automation system:
- **Web UI** - Visual interface to see the automation in action
- **AI Agent** - Intelligent assistant that processes documents using Claude API
- **Real-time Demo** - Watch documents get processed automatically
- **Statistics Dashboard** - See time savings and ROI metrics

## Technologies

- **Frontend:** HTML, CSS, JavaScript (vanilla - no build required)
- **Backend:** Python Flask server
- **AI:** Anthropic Claude API for intelligent document processing
- **Demo Mode:** Works without real APIs (uses simulated data)

## Quick Start

### Option 1: Demo Mode (No API Key Required)
```bash
cd demo_app
python server.py
```
Then open: http://localhost:5000

### Option 2: With Real AI (Requires Anthropic API Key)
```bash
cd demo_app
export ANTHROPIC_API_KEY=your-api-key-here
python server.py --ai-enabled
```

## Features

### 1. Document Upload Interface
- Drag & drop documents
- See them get processed in real-time
- Visual feedback on validation status

### 2. AI Agent Assistant
- Powered by Claude
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
- Configure validation rules
- View audit logs
- Export results

## Demo Scenarios

The app includes 3 pre-loaded demo scenarios:

1. **Happy Path** - Document passes all checks
2. **Missing Data** - Document fails validation (missing author)
3. **AI Assisted** - AI helps extract missing information

## Perfect for Interview Demo

**Show this during your presentation:**
1. Open the web app
2. Upload a sample document
3. Watch the AI agent process it
4. Show the time savings (118s → 8s)
5. Display the ROI dashboard

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
├── ai_agent.py           # Claude AI integration
├── static/
│   ├── index.html        # Main UI
│   ├── style.css         # Styling
│   └── app.js            # Frontend logic
├── sample_documents/      # Demo documents
│   ├── budget_proposal.json
│   ├── handbook_update.json
│   └── campaign_brief.json
└── config.py             # Configuration
```

## API Endpoints

```
GET  /                    # Main UI
POST /api/upload          # Upload document
GET  /api/queue           # Get processing queue
POST /api/process         # Process with AI
GET  /api/stats           # Get statistics
GET  /api/logs            # Get audit logs
```

## Running the Demo

```bash
# Install dependencies
pip install flask anthropic python-dotenv

# Run in demo mode (no API key needed)
python server.py

# Or with AI enabled
python server.py --ai-enabled
```

The server will start on http://localhost:5000

## What Makes This Impressive

✅ **Visual** - Not just code, actual working UI
✅ **Interactive** - Can upload and process documents
✅ **AI-Powered** - Shows Claude integration
✅ **Real Metrics** - Displays actual time savings
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
