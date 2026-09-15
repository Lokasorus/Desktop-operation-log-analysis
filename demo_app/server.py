"""
Flask server for Document Processing Automation Demo
Includes AI agent integration with Anthropic Claude
"""
from flask import Flask, render_template, request, jsonify, send_from_directory
import json
import time
import os
from datetime import datetime
from pathlib import Path

app = Flask(__name__, static_folder='static', static_url_path='')

# Configuration
DEMO_MODE = os.getenv('DEMO_MODE', 'true').lower() == 'true'
AI_ENABLED = os.getenv('AI_ENABLED', 'false').lower() == 'true'

# In-memory storage for demo
processing_queue = []
completed_documents = []
statistics = {
    'total_processed': 0,
    'successful': 0,
    'failed': 0,
    'time_saved_seconds': 0,
    'manual_time_seconds': 0,
    'automated_time_seconds': 0
}

# Import AI agent if enabled
ai_agent = None
if AI_ENABLED:
    try:
        # Try free AI agent first (Groq/Llama - FREE!)
        from free_ai_agent import FreeDocumentAIAgent
        ai_agent = FreeDocumentAIAgent()
        if ai_agent.enabled:
            print("✓ AI Agent initialized (Llama 3.1 via Groq - FREE)")
        else:
            print("⚠ No GROQ_API_KEY found. Get one FREE at: https://console.groq.com")
            print("⚠ Running in demo mode (simulated responses)")
            AI_ENABLED = False
            DEMO_MODE = True
    except ImportError:
        try:
            # Fallback to Anthropic if available
            from ai_agent import DocumentAIAgent
            ai_agent = DocumentAIAgent()
            print("✓ AI Agent initialized (Claude API)")
        except ImportError:
            print("⚠ AI agent module not found, using demo mode")
            AI_ENABLED = False
            DEMO_MODE = True

# Sample documents for demo
SAMPLE_DOCS = [
    {
        'id': 'DOC001',
        'title': 'Q4 Budget Proposal',
        'author': 'John Smith',
        'date': '2026-09-10',
        'file_size_mb': 2.5,
        'format': 'docx',
        'content': 'Budget proposal for Q4 2026 fiscal year. Total allocation: $500,000 for marketing initiatives...'
    },
    {
        'id': 'DOC002',
        'title': 'Employee Handbook Update',
        'author': 'Sarah Johnson',
        'date': '2026-09-09',
        'file_size_mb': 5.2,
        'format': 'pdf',
        'content': 'Updated employee handbook with new remote work policies...'
    },
    {
        'id': 'DOC003',
        'title': 'Marketing Campaign Brief',
        'author': None,  # Missing - will fail validation or AI will extract
        'date': '2026-09-08',
        'file_size_mb': 1.8,
        'format': 'docx',
        'content': 'Campaign brief for new product launch targeting millennial audience...'
    }
]

@app.route('/')
def index():
    """Serve main UI"""
    return send_from_directory('static', 'index.html')

@app.route('/api/config')
def get_config():
    """Get app configuration"""
    return jsonify({
        'demo_mode': DEMO_MODE,
        'ai_enabled': AI_ENABLED,
        'ai_provider': 'Groq/Llama 3.1' if AI_ENABLED else None,
        'features': {
            'document_upload': True,
            'ai_processing': AI_ENABLED,
            'real_time_stats': True,
            'audit_logs': True
        }
    })

@app.route('/api/sample-documents')
def get_sample_documents():
    """Get sample documents for demo"""
    return jsonify(SAMPLE_DOCS)

@app.route('/api/upload', methods=['POST'])
def upload_document():
    """Handle document upload"""
    data = request.json

    # Create document record
    doc = {
        'id': f"DOC{len(processing_queue) + 1:03d}",
        'title': data.get('title', 'Untitled Document'),
        'author': data.get('author'),
        'date': data.get('date', datetime.now().strftime('%Y-%m-%d')),
        'file_size_mb': data.get('file_size_mb', 1.0),
        'format': data.get('format', 'docx'),
        'content': data.get('content', ''),
        'uploaded_at': datetime.now().isoformat(),
        'status': 'pending'
    }

    processing_queue.append(doc)

    return jsonify({
        'success': True,
        'document': doc,
        'queue_position': len(processing_queue)
    })

@app.route('/api/process/<doc_id>', methods=['POST'])
def process_document(doc_id):
    """Process a document (with or without AI)"""

    # Find document
    doc = next((d for d in processing_queue if d['id'] == doc_id), None)
    if not doc:
        doc = next((d for d in SAMPLE_DOCS if d['id'] == doc_id), None)
        if doc:
            doc = doc.copy()  # Make a copy for processing

    if not doc:
        return jsonify({'success': False, 'error': 'Document not found'}), 404

    start_time = time.time()
    doc['status'] = 'processing'

    # Simulate or run actual processing
    if AI_ENABLED and not DEMO_MODE:
        result = process_with_ai(doc)
    else:
        result = process_demo_mode(doc)

    processing_time = time.time() - start_time

    # Update statistics
    manual_time = 118  # Average manual processing time from analysis
    statistics['total_processed'] += 1
    statistics['manual_time_seconds'] += manual_time
    statistics['automated_time_seconds'] += processing_time
    statistics['time_saved_seconds'] += (manual_time - processing_time)

    if result['valid']:
        statistics['successful'] += 1
    else:
        statistics['failed'] += 1

    # Update document status
    doc['status'] = 'completed'
    doc['result'] = result
    doc['processing_time'] = processing_time
    doc['completed_at'] = datetime.now().isoformat()

    # Move to completed
    if doc in processing_queue:
        processing_queue.remove(doc)
    completed_documents.insert(0, doc)  # Add to front

    return jsonify({
        'success': True,
        'document': doc,
        'result': result,
        'processing_time': round(processing_time, 2),
        'time_saved': round(manual_time - processing_time, 2)
    })

def process_demo_mode(doc):
    """Process document in demo mode (no AI)"""
    time.sleep(1.5)  # Simulate processing

    # Basic validation
    errors = []
    if not doc.get('author'):
        errors.append('Missing required field: author')
    if doc.get('file_size_mb', 0) > 50:
        errors.append('File size exceeds 50MB limit')
    if doc.get('format') not in ['docx', 'pdf']:
        errors.append(f"Format '{doc.get('format')}' not allowed")

    is_valid = len(errors) == 0

    return {
        'valid': is_valid,
        'errors': errors,
        'ai_analysis': None,
        'recommendation': 'APPROVED' if is_valid else 'NEEDS REVIEW',
        'confidence': 0.95 if is_valid else 0.60,
        'reasoning': 'All validation checks passed' if is_valid else 'Failed validation checks'
    }

def process_with_ai(doc):
    """Process document with AI agent"""
    try:
        result = ai_agent.process_document(doc)
        return result
    except Exception as e:
        print(f"AI processing error: {e}")
        return process_demo_mode(doc)  # Fallback to demo mode

@app.route('/api/queue')
def get_queue():
    """Get current processing queue"""
    return jsonify({
        'queue': processing_queue,
        'queue_length': len(processing_queue),
        'completed': completed_documents[:10]  # Last 10 completed
    })

@app.route('/api/stats')
def get_stats():
    """Get processing statistics"""
    return jsonify({
        'statistics': statistics,
        'metrics': {
            'success_rate': round(statistics['successful'] / max(1, statistics['total_processed']) * 100, 1),
            'avg_processing_time': round(statistics['automated_time_seconds'] / max(1, statistics['total_processed']), 2),
            'time_savings_percent': round((statistics['time_saved_seconds'] / max(1, statistics['manual_time_seconds'])) * 100, 1),
            'total_minutes_saved': round(statistics['time_saved_seconds'] / 60, 1)
        }
    })

@app.route('/api/logs')
def get_logs():
    """Get audit logs"""
    logs = []
    for doc in completed_documents[:20]:  # Last 20
        logs.append({
            'timestamp': doc.get('completed_at', 'N/A'),
            'document_id': doc['id'],
            'title': doc['title'],
            'status': doc['result']['recommendation'],
            'processing_time': doc.get('processing_time', 0)
        })

    return jsonify({'logs': logs})

@app.route('/api/reset', methods=['POST'])
def reset_demo():
    """Reset demo state"""
    global processing_queue, completed_documents, statistics
    processing_queue = []
    completed_documents = []
    statistics = {
        'total_processed': 0,
        'successful': 0,
        'failed': 0,
        'time_saved_seconds': 0,
        'manual_time_seconds': 0,
        'automated_time_seconds': 0
    }
    return jsonify({'success': True, 'message': 'Demo reset successfully'})

if __name__ == '__main__':
    print("=" * 80)
    print("📄 DOCUMENT PROCESSING AUTOMATION - WEB DEMO")
    print("=" * 80)
    print(f"\nMode: {'🤖 AI-Enabled (FREE)' if AI_ENABLED else '📋 Demo Mode'}")
    if AI_ENABLED and ai_agent:
        print(f"AI Model: Llama 3.1 8B via Groq API (100% FREE)")
        print(f"Status: ✓ Active and ready")
    else:
        print(f"AI Agent: ✗ Using simulated responses")
    print("\n🌐 Starting server...")
    print("\n➡️  Open in browser: http://localhost:5000")
    print("\n💡 Tips:")
    print("  • Try uploading sample documents")
    print("  • Watch the processing in real-time")
    print("  • Check the statistics dashboard")
    if not AI_ENABLED:
        print("  • To enable FREE AI: Get API key from https://console.groq.com")
        print("  • Then set: GROQ_API_KEY=your-key and run with AI_ENABLED=true")
    print("\n" + "=" * 80 + "\n")

    app.run(debug=True, port=5000, host='0.0.0.0')
