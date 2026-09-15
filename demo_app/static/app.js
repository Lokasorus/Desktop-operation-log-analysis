/**
 * Document Processing Automation - Frontend App
 * Handles UI interactions and API calls
 */

let config = {};
let sampleDocs = [];

// Initialize app on load
document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    await loadSampleDocuments();
    await updateStatistics();
    await updateQueue();
    await updateAuditLogs();

    // Auto-refresh
    setInterval(updateStatistics, 5000);
    setInterval(updateQueue, 3000);
    setInterval(updateAuditLogs, 3000);
});

async function loadConfig() {
    const response = await fetch('/api/config');
    config = await response.json();

    const modeText = config.ai_enabled ?
        `🤖 AI Agent Active (${config.ai_provider})` :
        '🎭 Demo Mode (Simulated)';
    document.getElementById('modeIndicator').textContent = modeText;
}

async function loadSampleDocuments() {
    const response = await fetch('/api/sample-documents');
    sampleDocs = await response.json();

    const listEl = document.getElementById('sampleDocsList');
    listEl.innerHTML = sampleDocs.map((doc, idx) => `
        <div class="sample-doc-card">
            <div class="doc-info">
                <strong>${doc.title}</strong>
                <small>${doc.author || '⚠️ Missing Author'} • ${doc.format} • ${doc.file_size_mb}MB</small>
            </div>
            <button onclick="processSampleDocument('${doc.id}')" class="btn btn-sm">
                Process
            </button>
        </div>
    `).join('');
}

async function processSampleDocument(docId) {
    const doc = sampleDocs.find(d => d.id === docId);
    if (!doc) return;

    addLog(`Uploading: ${doc.title}`);

    // Upload first
    const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc)
    });

    const uploadResult = await uploadResponse.json();
    addLog(`Added to queue: ${doc.title}`);
    await updateQueue();

    // Show processing view
    showProcessingView(doc);

    // Start processing
    processDocument(uploadResult.document.id);
}

async function uploadCustomDocument() {
    const title = document.getElementById('docTitle').value;
    const author = document.getElementById('docAuthor').value;
    const date = document.getElementById('docDate').value;

    if (!title) {
        alert('Please enter a document title');
        return;
    }

    const doc = {
        title,
        author,
        date: date || new Date().toISOString().split('T')[0],
        file_size_mb: 2.0,
        format: 'docx',
        content: `Custom document: ${title}`
    };

    addLog(`Uploading custom document: ${title}`);

    const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc)
    });

    const result = await response.json();
    addLog(`Added to queue: ${title}`);

    // Clear form
    document.getElementById('docTitle').value = '';
    document.getElementById('docAuthor').value = '';
    document.getElementById('docDate').value = '';

    await updateQueue();
    showProcessingView(doc);
    processDocument(result.document.id);
}

function showProcessingView(doc) {
    const view = document.getElementById('processingView');
    view.innerHTML = `
        <div class="processing-card">
            <div class="doc-header">
                <h3>📄 ${doc.title}</h3>
                <div class="doc-meta">
                    Author: ${doc.author || '⚠️ Missing'} •
                    Date: ${doc.date} •
                    ${doc.file_size_mb}MB ${doc.format}
                </div>
            </div>

            <div class="processing-status">
                <div class="spinner"></div>
                <p>Processing document...</p>
            </div>

            <div class="processing-steps">
                <div class="step active">✓ Document uploaded</div>
                <div class="step active">✓ Extracting metadata</div>
                <div class="step processing">⏳ Running validation checks...</div>
                ${config.ai_enabled ? '<div class="step">🤖 AI agent analyzing...</div>' : ''}
                <div class="step">Generating report...</div>
            </div>
        </div>
    `;
}

async function processDocument(docId) {
    try {
        addLog(`Processing ${docId}...`);

        const response = await fetch(`/api/process/${docId}`, {
            method: 'POST'
        });

        const result = await response.json();

        if (result.success) {
            addLog(`✓ Completed: ${result.document.title} (${result.processing_time}s)`);
            showResults(result);
            await updateStatistics();
            await updateQueue();
            await updateAuditLogs();
        } else {
            addLog(`✗ Error processing document: ${result.error}`);
        }
    } catch (error) {
        addLog(`✗ Processing error: ${error.message}`);
    }
}

function showResults(result) {
    const doc = result.document;
    const res = result.result;

    // Show AI analysis if available
    if (res.ai_analysis) {
        document.getElementById('aiOutput').style.display = 'block';
        document.getElementById('aiAnalysis').innerHTML = `
            <div class="ai-message">
                <strong>AI Agent Says:</strong>
                <p>${res.reasoning}</p>
                ${res.quality_notes ? `<p><small>${res.quality_notes}</small></p>` : ''}
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${res.confidence * 100}%"></div>
                </div>
                <small>Confidence: ${(res.confidence * 100).toFixed(0)}%</small>
            </div>
        `;
    }

    // Show results
    document.getElementById('resultsSection').style.display = 'block';
    const statusClass = res.valid ? 'success' : 'error';
    const statusIcon = res.valid ? '✅' : '❌';

    const decisionControls = doc.status === 'awaiting_approval' ? `
        <div class="decision-controls">
            <p>Validation passed. Final approval remains a human decision.</p>
            <button onclick="recordDecision('${doc.id}', 'approve')" class="btn btn-primary">Approve</button>
            <button onclick="recordDecision('${doc.id}', 'reject')" class="btn btn-secondary">Reject</button>
        </div>
    ` : `<p class="decision-state">${doc.status === 'needs_review' ? 'Manual review required.' : `Decision recorded: ${doc.status}.`}</p>`;

    document.getElementById('resultsContent').innerHTML = `
        <div class="result-card ${statusClass}">
            <h3>${statusIcon} ${res.recommendation}</h3>

            <div class="result-details">
                <div class="detail-row">
                    <span>Status:</span>
                    <span><strong>${res.valid ? 'PASSED' : 'FAILED'}</strong></span>
                </div>
                <div class="detail-row">
                    <span>Processing Time:</span>
                    <span><strong>${result.processing_time}s</strong></span>
                </div>
                <div class="detail-row">
                    <span>Manual Time:</span>
                    <span>118s</span>
                </div>
                <div class="detail-row highlight">
                    <span>Time Saved:</span>
                    <span><strong>⚡ ${result.time_saved.toFixed(1)}s (${((result.time_saved / 118) * 100).toFixed(0)}%)</strong></span>
                </div>
            </div>

            ${res.errors.length > 0 ? `
                <div class="errors-section">
                    <h4>Issues Found:</h4>
                    <ul>
                        ${res.errors.map(e => `<li>${e}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}

            <div class="reasoning">
                <strong>Reasoning:</strong> ${res.reasoning}
            </div>
            ${decisionControls}
        </div>
    `;
}

async function recordDecision(docId, decision) {
    const response = await fetch(`/api/decision/${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
    });
    const result = await response.json();
    if (!result.success) {
        addLog(`Decision error: ${result.error}`);
        return;
    }
    addLog(`Decision recorded: ${result.document.id} ${decision}`);
    showResults({
        document: result.document,
        result: result.document.result,
        processing_time: result.document.processing_time,
        time_saved: 118 - result.document.processing_time
    });
    await updateAuditLogs();
}

async function updateQueue() {
    const response = await fetch('/api/queue');
    const data = await response.json();

    document.getElementById('queueCount').textContent = data.queue_length;

    const queueEl = document.getElementById('queueList');
    if (data.queue_length === 0) {
        queueEl.innerHTML = '<div class="empty-queue">Queue is empty</div>';
    } else {
        queueEl.innerHTML = data.queue.map((doc, idx) => `
            <div class="queue-item">
                <span class="queue-position">#${idx + 1}</span>
                <span class="queue-title">${doc.title}</span>
                <span class="queue-status">${doc.status}</span>
            </div>
        `).join('');
    }
}

async function updateStatistics() {
    const response = await fetch('/api/stats');
    const data = await response.json();

    const stats = data.statistics;
    const metrics = data.metrics;

    document.getElementById('statProcessed').textContent = stats.total_processed;
    document.getElementById('statSuccessRate').textContent = metrics.success_rate + '%';
    document.getElementById('statAvgTime').textContent = metrics.avg_processing_time + 's';
    document.getElementById('statTimeSaved').textContent = metrics.total_minutes_saved + ' min';
    document.getElementById('statSavingsPercent').textContent = metrics.time_savings_percent + '%';
}

async function updateAuditLogs() {
    const response = await fetch('/api/logs');
    const data = await response.json();
    const logEl = document.getElementById('activityLog');

    if (data.logs.length === 0) {
        logEl.innerHTML = '<div class="log-item"><span class="log-message">No completed operations</span></div>';
        return;
    }

    logEl.innerHTML = data.logs.map(log => `
        <div class="log-item">
            <span class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
            <span class="log-message">${log.document_id}: ${log.status} - ${log.title} (${log.processing_time.toFixed(2)}s)</span>
        </div>
    `).join('');
}

async function resetDemo() {
    if (confirm('Reset all demo data?')) {
        await fetch('/api/reset', { method: 'POST' });
        addLog('Demo reset');
        location.reload();
    }
}

function addLog(message) {
    const logEl = document.getElementById('activityLog');
    const time = new Date().toLocaleTimeString();

    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    logItem.innerHTML = `
        <span class="log-time">${time}</span>
        <span class="log-message">${message}</span>
    `;

    logEl.insertBefore(logItem, logEl.firstChild);

    // Keep only last 10 logs
    while (logEl.children.length > 10) {
        logEl.removeChild(logEl.lastChild);
    }
}
