# How to Get FREE AI API Key (Groq - Llama 3.1)

## Why Groq?

- ✅ **100% FREE** - No credit card required
- ✅ **Fast** - Fastest inference speed
- ✅ **No limits** - 30 requests/minute on free tier
- ✅ **Llama 3.1** - State-of-the-art open-source AI
- ✅ **Easy setup** - Get key in 2 minutes

## Step-by-Step Guide

### 1. Go to Groq Console
Open: https://console.groq.com

### 2. Sign Up (FREE)
- Click "Sign Up"
- Use your email or Google account
- **No credit card required!**

### 3. Get Your API Key
- Once logged in, go to "API Keys"
- Click "Create API Key"
- Copy the key (starts with `gsk_...`)

### 4. Set the API Key

**Option A: Using Batch File (Easiest)**

Edit `start_demo.bat` and add this line before the Python command:
```batch
set GROQ_API_KEY=gsk_your_key_here
```

**Option B: Using PowerShell**
```powershell
$env:GROQ_API_KEY="gsk_your_key_here"
cd "F:\PGM\Projects\I'm beside you\demo_app"
C:\Users\aryan\AppData\Local\Programs\Python\Python312\python.exe server.py
```

**Option C: Create a .env file**
Create a file named `.env` in the demo_app folder:
```
GROQ_API_KEY=gsk_your_key_here
AI_ENABLED=true
```

### 5. Run with AI Enabled

**Method 1: Using batch file**
```batch
set GROQ_API_KEY=gsk_your_key_here
set AI_ENABLED=true
"C:\Users\aryan\AppData\Local\Programs\Python\Python312\python.exe" server.py
```

**Method 2: Using PowerShell**
```powershell
$env:GROQ_API_KEY="gsk_your_key_here"
$env:AI_ENABLED="true"
cd "F:\PGM\Projects\I'm beside you\demo_app"
python server.py
```

## What You'll Get

With Groq AI enabled:
- 🤖 **Real AI analysis** of documents
- 📝 **Intelligent metadata extraction** (finds missing authors in content)
- 💬 **Natural language explanations** of decisions
- 🎯 **Confidence scores** for recommendations
- ⚡ **Fast responses** (usually < 1 second)

## Troubleshooting

**"No GROQ_API_KEY found"**
- Make sure you set the environment variable
- Check for typos in the key
- Try restarting your terminal

**"API request failed"**
- Check your internet connection
- Verify the API key is correct
- Make sure you haven't hit rate limits (30/min)

**Still not working?**
- The app works perfectly in demo mode (no AI needed)
- Demo mode simulates all the AI features
- Perfect for testing and presentations

## Cost Comparison

| Provider | Free Tier | Credit Card Required | Speed |
|----------|-----------|---------------------|-------|
| **Groq** | ✅ 30 req/min | ❌ No | ⚡ Fastest |
| Anthropic | ❌ $5 credit | ✅ Yes | 🐢 Medium |
| OpenAI | ❌ $5 credit | ✅ Yes | 🐢 Slow |

**Winner: Groq!** Perfect for student projects and demos.

## Next Steps

1. Get your FREE Groq API key: https://console.groq.com
2. Set it in your environment
3. Run the demo with AI enabled
4. Enjoy real AI-powered document processing!

---

**Questions?** The demo works great in both modes:
- **Demo Mode**: Simulated AI (no setup needed)
- **AI Mode**: Real Llama 3.1 intelligence (2-minute setup)
