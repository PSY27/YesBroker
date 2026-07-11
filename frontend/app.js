// YesBroker (GharCheck) - Premium Client Interaction Layer

// Configuration: backend API base url (handles running on same port or localhost)
const API_BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? window.location.origin
    : 'http://localhost:8000'; // Fallback if opened via filesystem

// DOM Elements
const searchForm = document.getElementById('search-form');
const areaInput = document.getElementById('area');
const pincodeInput = document.getElementById('pincode');
const maxRentInput = document.getElementById('max-rent');
const bhkSelect = document.getElementById('bhk');
const officeInput = document.getElementById('office');
const powerBackupCheckbox = document.getElementById('power-backup');
const nonVegCheckbox = document.getElementById('non-veg');

const listingsFeed = document.getElementById('listings-feed');
const resultsCount = document.getElementById('results-count');

const reportSection = document.getElementById('report-section');
const reportPlaceholder = document.getElementById('report-placeholder');
const trustReportDashboard = document.getElementById('trust-report-dashboard');

const reportBhkArea = document.getElementById('report-bhk-area');
const reportTitle = document.getElementById('report-title');
const reportRent = document.getElementById('report-rent');
const scoreCirclePath = document.getElementById('score-circle-path');
const scoreNumber = document.getElementById('score-number');
const verdictLabel = document.getElementById('verdict-label');
const reportFlagsList = document.getElementById('report-flags-list');
const reportQuestionsList = document.getElementById('report-questions-list');
const terminalBody = document.getElementById('terminal-body');

// Track currently active listing ID to prevent double clicking
let activeListingId = null;

// Initialize and handle page load
document.addEventListener('DOMContentLoaded', () => {
    // Perform initial automatic search to populate the feed with standard Bangalore data
    performSearch();
});

// Event Listener for Search Submission
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    performSearch();
});

// Perform Search API Call
async function performSearch() {
    const payload = {
        area: areaInput.value.trim(),
        pincode: pincodeInput.value.trim() || null,
        max_rent: parseInt(maxRentInput.value) || 35000,
        bhk: bhkSelect.value,
        office: officeInput.value.trim() || null,
        power_backup: powerBackupCheckbox ? powerBackupCheckbox.checked : false,
        non_veg: nonVegCheckbox ? nonVegCheckbox.checked : false
    };

    try {
        listingsFeed.innerHTML = `
            <div class="investigating-loader">
                <div class="loader-pulse"><i class="fa-solid fa-spinner"></i></div>
                <p style="font-size:0.9rem; color:var(--text-secondary);">Querying trust-ranked corpus...</p>
            </div>
        `;
        resultsCount.textContent = 'Searching...';

        const response = await fetch(`${API_BASE_URL}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        renderListings(data, payload);
    } catch (err) {
        console.error('Error fetching search results:', err);
        showErrorState('Failed to fetch listings. Please ensure the backend server is running.');
    }
}

// Render Listings Feed
function renderListings(listings, payload) {
    if (listings.length === 0) {
        resultsCount.textContent = `0 matches for ${payload.bhk}BHK · ${payload.area} · ≤₹${(payload.max_rent/1000).toFixed(0)}k`;
        listingsFeed.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>No Verified Listings Found</h3>
                <p>We couldn't find matches fitting your exact filters. Try relaxing your budget cap or changing configuration.</p>
            </div>
        `;
        return;
    }

    resultsCount.textContent = `Showing ${listings.length} matches for ${payload.bhk}BHK · ${payload.area} · ≤₹${(payload.max_rent/1000).toFixed(0)}k`;
    listingsFeed.innerHTML = '';

    listings.forEach((item) => {
        const row = document.createElement('div');
        row.className = `listing-row ${activeListingId === item.id ? 'active' : ''}`;
        row.setAttribute('data-id', item.id);

        let badgeClass = 'badge-safe';
        let badgeIcon = 'fa-circle-check';
        
        if (item.verdict === 'CAUTION') {
            badgeClass = 'badge-caution';
            badgeIcon = 'fa-triangle-exclamation';
        } else if (item.verdict === 'RISK' || item.verdict === 'HIGH_RISK') {
            badgeClass = 'badge-risk';
            badgeIcon = 'fa-skull-crossbones';
        }

        row.innerHTML = `
            <div class="row-rank">${item.rank}</div>
            <div class="row-info">
                <div class="row-title">${item.title}</div>
                <div class="row-why">${item.one_liner}</div>
            </div>
            <div class="row-rent">₹${item.rent.toLocaleString()}</div>
            <div class="row-badge-container">
                <span class="verdict-badge ${badgeClass}">
                    <i class="fa-solid ${badgeIcon}"></i> ${item.verdict}
                </span>
            </div>
        `;

        // Register Click Listener
        row.addEventListener('click', () => {
            handleListingSelection(item.id, row);
        });

        listingsFeed.appendChild(row);
    });
}

// Handle Row Click and ESCALATE to Live Investigation (SSE trace stream)
async function handleListingSelection(id, clickedRowElement) {
    if (activeListingId === id) return;

    activeListingId = id;

    document.querySelectorAll('.listing-row').forEach(row => row.classList.remove('active'));
    clickedRowElement.classList.add('active');

    reportPlaceholder.classList.add('hidden');
    trustReportDashboard.classList.add('hidden');

    let loaderDiv = document.getElementById('live-report-loader');
    if (!loaderDiv) {
        loaderDiv = document.createElement('div');
        loaderDiv.id = 'live-report-loader';
        loaderDiv.className = 'investigating-loader';
        reportSection.appendChild(loaderDiv);
    }
    loaderDiv.classList.remove('hidden');
    loaderDiv.innerHTML = `
        <div class="loader-pulse"><i class="fa-solid fa-fingerprint"></i></div>
        <h3 style="font-weight: 800; font-size: 1.1rem; color:var(--text-primary);">Live Investigation Running...</h3>
        <p style="font-size: 0.85rem; color:var(--text-secondary);">Watch the terminal for agent handoffs →</p>
    `;

    // Clear terminal and show live trace
    terminalBody.innerHTML = '';
    appendTerminalLine('Connecting to agent orchestrator (Gemini)...', 'muted');

    const rowTitle = clickedRowElement.querySelector('.row-title').textContent;
    const rowRent = clickedRowElement.querySelector('.row-rent').textContent;

    return new Promise((resolve, reject) => {
        const source = new EventSource(`${API_BASE_URL}/investigate/stream?id=${encodeURIComponent(id)}`);

        source.onmessage = (event) => {
            const payload = JSON.parse(event.data);

            if (payload.type === 'start') {
                appendTerminalLine(`Investigating: ${payload.title} (${payload.listing_id})`, 'highlight');
            } else if (payload.type === 'trace') {
                const line = formatTraceEvent(payload);
                let style = 'text';
                const msg = (payload.message || '').toLowerCase();
                if (payload.kind === 'handoff' || msg.includes('escalat') || msg.includes('re-dispatch')) {
                    style = 'alert';
                } else if (payload.kind === 'arbiter' || msg.includes('conflict')) {
                    style = 'critical';
                } else if (payload.kind === 'gemini') {
                    style = 'highlight';
                } else if (payload.kind === 'result') {
                    style = msg.includes('clean') ? 'highlight' : 'alert';
                }
                appendTerminalLine(line, style);
                terminalBody.scrollTop = terminalBody.scrollHeight;
            } else if (payload.type === 'done') {
                source.close();
                loaderDiv.classList.add('hidden');
                appendTerminalLine('Investigation complete. Rendering trust report...', 'highlight');
                renderTrustReport(payload.report, rowTitle, rowRent);
                resolve(payload.report);
            }
        };

        source.onerror = (err) => {
            source.close();
            console.error('SSE stream error:', err);
            // Fallback to non-streaming endpoint
            fetch(`${API_BASE_URL}/investigate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            })
            .then(r => r.json())
            .then(report => {
                loaderDiv.classList.add('hidden');
                renderTrustReport(report, rowTitle, rowRent);
                resolve(report);
            })
            .catch(reject);
        };
    }).catch(err => {
        console.error('Error during investigation:', err);
        loaderDiv.classList.add('hidden');
        reportPlaceholder.classList.remove('hidden');
        alert('Could not complete live investigation. Check server logs.');
    });
}

function formatTraceEvent(ev) {
    const kind = (ev.kind || '').toUpperCase();
    const actor = ev.actor || 'agent';
    let prefix = kind === 'AGENT' ? actor.toUpperCase() : (ev.message?.startsWith('[') ? '' : `[${kind}] `);
    if (ev.kind === 'gemini') {
        const dir = ev.meta?.direction || '';
        return `[Gemini ${dir}] ${ev.message}`;
    }
    if (ev.kind === 'result') {
        return `${actor}: ${ev.message}`;
    }
    return `${prefix}${ev.message || ''}`;
}

// Render Full Trust Report
function renderTrustReport(report, title, rent) {
    trustReportDashboard.classList.remove('hidden');

    // Populate metadata
    reportTitle.textContent = title;
    reportRent.textContent = rent.replace('₹', '');
    reportBhkArea.textContent = `2 BHK • Indiranagar (560038)`;

    // Configure Score Circle and Color
    const score = report.score;
    scoreNumber.textContent = score;
    
    // Set circle percentage
    scoreCirclePath.setAttribute('stroke-dasharray', `${score}, 100`);

    // Reset score color class
    const scoreContainer = document.querySelector('.score-radial-progress');
    scoreContainer.className = 'score-radial-progress'; // reset
    if (score >= 80) {
        scoreContainer.classList.add('score-high');
        verdictLabel.className = 'verdict-pill badge-safe';
        verdictLabel.innerHTML = '<i class="fa-solid fa-circle-check"></i> SAFE';
    } else if (score >= 50) {
        scoreContainer.classList.add('score-mid');
        verdictLabel.className = 'verdict-pill badge-caution';
        verdictLabel.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> CAUTION';
    } else {
        scoreContainer.classList.add('score-low');
        verdictLabel.className = 'verdict-pill badge-risk';
        verdictLabel.innerHTML = '<i class="fa-solid fa-skull-crossbones"></i> HIGH RISK';
    }

    // Populate Red Flags & Agent Findings
    reportFlagsList.innerHTML = '';
    report.flags.forEach(flag => {
        const item = document.createElement('div');
        item.className = 'finding-item';

        // Select correct class/icon per agent
        let agentIconClass = 'fa-eye';
        let agentColorClass = 'agent-photo';
        if (flag.agent === 'photo') { agentIconClass = 'fa-image'; agentColorClass = 'agent-photo'; }
        else if (flag.agent === 'price') { agentIconClass = 'fa-tags'; agentColorClass = 'agent-price'; }
        else if (flag.agent === 'commute') { agentIconClass = 'fa-route'; agentColorClass = 'agent-commute'; }
        else if (flag.agent === 'text') { agentIconClass = 'fa-comment-sms'; agentColorClass = 'agent-text'; }
        else if (flag.agent === 'web') { agentIconClass = 'fa-magnifying-glass-globe'; agentColorClass = 'agent-web'; }

        // Verdict tags
        let tagClass = 'tag-clean';
        if (flag.verdict === 'SUSPICIOUS') tagClass = 'tag-suspicious';
        else if (flag.verdict === 'BAIT') tagClass = 'tag-bait';
        else if (flag.verdict === 'LIE') tagClass = 'tag-lie';

        // Build evidence bullets
        let evidenceHTML = '';
        if (flag.evidence && flag.evidence.length > 0) {
            evidenceHTML = `
                <div class="evidence-list">
                    ${flag.evidence.map(ev => `
                        <div class="evidence-item">
                            <i class="fa-solid fa-circle-nodes"></i> ${ev}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        item.innerHTML = `
            <div class="agent-icon ${agentColorClass}"><i class="fa-solid ${agentIconClass}"></i></div>
            <div class="finding-details">
                <div class="finding-header">
                    <span class="agent-name">${flag.agent}-recon agent</span>
                    <span class="finding-verdict-tag ${tagClass}">${flag.verdict}</span>
                </div>
                <div class="finding-desc">${flag.detail}</div>
                ${evidenceHTML}
            </div>
        `;
        reportFlagsList.appendChild(item);
    });

    // Populate Questions
    reportQuestionsList.innerHTML = '';
    report.questions_to_ask.forEach(q => {
        const li = document.createElement('li');
        li.textContent = q;
        reportQuestionsList.appendChild(li);
    });

    // Terminal already streamed live during investigation; only replay if empty
    if (terminalBody.children.length <= 2) {
        runTerminalTrace(report.reasoning);
    }
}

// Live Terminal reasoning trace typwriter simulation
function runTerminalTrace(traceLines) {
    terminalBody.innerHTML = '';
    
    // Initial standard lines
    const headerLines = [
        "Initializing GharCheck multi-agent network...",
        "Authorizing secure handshake with specialized subagents...",
        "Awaiting pipeline instructions from main Planner..."
    ];

    let delay = 0;

    headerLines.forEach((line) => {
        setTimeout(() => {
            appendTerminalLine(line, 'muted');
        }, delay);
        delay += 300;
    });

    traceLines.forEach((line) => {
        setTimeout(() => {
            // Determine styling based on content
            let style = 'text';
            if (line.includes('escalat') || line.includes('deep scan') || line.includes('Re-dispatch')) {
                style = 'alert';
            } else if (line.includes('stolen') || line.includes('HIGH RISK') || line.includes('conflict') || line.includes('CONFLICT')) {
                style = 'critical';
            } else if (line.includes('resolved') || line.includes('Resolved') || line.includes('consistent')) {
                style = 'highlight';
            }
            appendTerminalLine(line, style);
            
            // Auto scroll terminal to bottom
            terminalBody.scrollTop = terminalBody.scrollHeight;
        }, delay);
        delay += 700; // time offset between successive agent trace reports
    });
}

// Append Line Helper for terminal
function appendTerminalLine(text, styleClass) {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    
    let spanClass = 'terminal-text';
    if (styleClass === 'muted') spanClass = 'terminal-prompt';
    else if (styleClass === 'alert') spanClass = 'terminal-alert';
    else if (styleClass === 'critical') spanClass = 'terminal-critical';
    else if (styleClass === 'highlight') spanClass = 'terminal-highlight';

    line.innerHTML = `
        <span class="terminal-prompt">$</span>
        <span class="${spanClass}">${text}</span>
    `;
    terminalBody.appendChild(line);
}

// Render error states
function showErrorState(message) {
    listingsFeed.innerHTML = `
        <div class="empty-state">
            <i class="fa-solid fa-triangle-exclamation" style="color:var(--clr-risk)"></i>
            <h3>Connection Error</h3>
            <p>${message}</p>
            <button onclick="performSearch()" class="btn btn-primary" style="margin-top: 1rem; padding: 0.5rem 1rem; font-size:0.8rem;">
                <i class="fa-solid fa-arrows-rotate"></i> Retry Connection
            </button>
        </div>
    `;
    resultsCount.textContent = 'Connection Error';
}
