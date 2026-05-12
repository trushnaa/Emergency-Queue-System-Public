/**
 * App.js — Hospital Emergency Queue System
 * Connects the MinHeap data structure to the UI
 */

// ─── Initialize ────────────────────────────────────────────
const heap = new MinHeap();
const treatedPatients = [];
let currentView = 'tree';

// DOM Elements
const patientForm = document.getElementById('patientForm');
const patientName = document.getElementById('patientName');
const patientAge = document.getElementById('patientAge');
const patientCondition = document.getElementById('patientCondition');
const addPatientBtn = document.getElementById('addPatientBtn');
const treatNextBtn = document.getElementById('treatNextBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const totalPatientsEl = document.getElementById('totalPatients');
const criticalCountEl = document.getElementById('criticalCount');
const treatedCountEl = document.getElementById('treatedCount');
const queueCountBadge = document.getElementById('queueCountBadge');
const treeCanvas = document.getElementById('treeCanvas');
const treeNodes = document.getElementById('treeNodes');
const treeLines = document.getElementById('treeLines');
const treeEmpty = document.getElementById('treeEmpty');
const treeView = document.getElementById('treeView');
const arrayView = document.getElementById('arrayView');
const arrayCanvas = document.getElementById('arrayCanvas');
const arrayEmpty = document.getElementById('arrayEmpty');
const queueList = document.getElementById('queueList');
const queueEmpty = document.getElementById('queueEmpty');
const nextPatientCard = document.getElementById('nextPatientCard');
const nextPatientInfo = document.getElementById('nextPatientInfo');
const logEntries = document.getElementById('logEntries');
const treatedList = document.getElementById('treatedList');
const toastContainer = document.getElementById('toastContainer');

// ─── Event Listeners ───────────────────────────────────────

patientForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = patientName.value.trim();
    const age = parseInt(patientAge.value);
    const triage = parseInt(document.querySelector('input[name="triage"]:checked').value);
    const condition = patientCondition.value.trim();

    if (!name) { showToast('Please enter a patient name', 'error'); return; }
    if (!age || age < 0) { showToast('Please enter a valid age', 'error'); return; }

    const patient = heap.insert(name, age, triage, condition);
    appendOperationLogs(heap.operationLog);
    updateAllViews();
    showToast(`${name} added to queue (P${triage})`, 'success');

    patientForm.reset();
    document.querySelector('input[name="triage"][value="3"]').checked = true;
    patientName.focus();
});

treatNextBtn.addEventListener('click', () => {
    const patient = heap.extractMin();
    if (patient) {
        treatedPatients.unshift(patient);
        appendOperationLogs(heap.operationLog);
        updateAllViews();
        showToast(`Treating: ${patient.name} (P${patient.priority})`, 'success');
    }
});

loadSampleBtn.addEventListener('click', loadSampleData);
clearAllBtn.addEventListener('click', () => {
    heap.clear();
    treatedPatients.length = 0;
    appendOperationLogs(heap.operationLog);
    updateAllViews();
    showToast('Queue cleared', 'info');
});

// View tabs
document.getElementById('viewTree').addEventListener('click', () => switchView('tree'));
document.getElementById('viewArray').addEventListener('click', () => switchView('array'));

// Info card toggle
document.getElementById('dsaInfoToggle').addEventListener('click', () => {
    document.getElementById('dsaInfoCard').classList.toggle('open');
});

// Treated section toggle
document.getElementById('treatedToggle').addEventListener('click', () => {
    treatedList.classList.toggle('hidden');
    document.querySelector('#treatedToggle .info-chevron').style.transform =
        treatedList.classList.contains('hidden') ? '' : 'rotate(180deg)';
});

// Clear log
document.getElementById('clearLogBtn').addEventListener('click', () => {
    logEntries.innerHTML = '';
});

// ─── View Switching ────────────────────────────────────────

function switchView(view) {
    currentView = view;
    document.querySelectorAll('.viz-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    treeView.classList.toggle('hidden', view !== 'tree');
    arrayView.classList.toggle('hidden', view !== 'array');
    updateVisualization();
}

// ─── Update All Views ──────────────────────────────────────

function updateAllViews() {
    updateStats();
    updateVisualization();
    updateQueueList();
    updateNextPatient();
    updateTreatedList();
    treatNextBtn.disabled = heap.isEmpty();
}

function updateStats() {
    totalPatientsEl.textContent = heap.size();
    criticalCountEl.textContent = heap.countByPriority(1) + heap.countByPriority(2);
    treatedCountEl.textContent = treatedPatients.length;
    queueCountBadge.textContent = heap.size();
}

// ─── Tree Visualization ────────────────────────────────────

function updateVisualization() {
    if (currentView === 'tree') renderTree();
    else renderArray();
}

function renderTree() {
    const arr = heap.getArray();
    treeNodes.innerHTML = '';
    treeLines.innerHTML = '';

    if (arr.length === 0) {
        treeEmpty.classList.remove('hidden');
        return;
    }
    treeEmpty.classList.add('hidden');

    const containerWidth = treeCanvas.clientWidth || 600;
    const levels = Math.floor(Math.log2(arr.length)) + 1;
    const levelHeight = 80;
    const totalHeight = levels * levelHeight + 40;
    treeCanvas.style.minHeight = totalHeight + 'px';

    // Calculate positions for each node
    const positions = [];
    for (let i = 0; i < arr.length; i++) {
        const level = Math.floor(Math.log2(i + 1));
        const posInLevel = i - (Math.pow(2, level) - 1);
        const nodesInLevel = Math.pow(2, level);
        const spacing = containerWidth / (nodesInLevel + 1);
        const x = spacing * (posInLevel + 1);
        const y = level * levelHeight + 50;
        positions.push({ x, y });
    }

    // Draw lines first
    const svgNS = 'http://www.w3.org/2000/svg';
    for (let i = 1; i < arr.length; i++) {
        const parentIdx = Math.floor((i - 1) / 2);
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', positions[parentIdx].x);
        line.setAttribute('y1', positions[parentIdx].y);
        line.setAttribute('x2', positions[i].x);
        line.setAttribute('y2', positions[i].y);
        treeLines.appendChild(line);
    }

    // Draw nodes
    arr.forEach((patient, i) => {
        const node = document.createElement('div');
        node.className = `tree-node p${patient.priority}`;
        node.style.left = positions[i].x + 'px';
        node.style.top = positions[i].y + 'px';
        node.innerHTML = `
            <span class="node-priority">P${patient.priority}</span>
            <span class="node-name">${patient.name}</span>
        `;
        node.title = `${patient.name} | Age: ${patient.age} | P${patient.priority} | ${patient.condition}`;
        treeNodes.appendChild(node);
    });

    // Set SVG size
    treeLines.setAttribute('width', containerWidth);
    treeLines.setAttribute('height', totalHeight);
}

function renderArray() {
    const arr = heap.getArray();
    arrayCanvas.innerHTML = '';

    if (arr.length === 0) {
        arrayEmpty.classList.remove('hidden');
        return;
    }
    arrayEmpty.classList.add('hidden');

    arr.forEach((patient, i) => {
        const cell = document.createElement('div');
        cell.className = 'array-cell';
        cell.innerHTML = `
            <div class="cell-box p${patient.priority}">
                <span class="cell-priority">P${patient.priority}</span>
                <span class="cell-name">${patient.name}</span>
            </div>
            <span class="cell-index">[${i}]</span>
        `;
        cell.title = `Index ${i}: ${patient.name} | Age: ${patient.age} | P${patient.priority}`;
        arrayCanvas.appendChild(cell);
    });
}

// ─── Queue List ────────────────────────────────────────────

function updateQueueList() {
    const arr = heap.getArray();

    // Sort by priority then timestamp for display
    const sorted = [...arr].sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.timestamp - b.timestamp;
    });

    if (sorted.length === 0) {
        queueList.innerHTML = '';
        queueList.appendChild(queueEmpty.cloneNode(true));
        return;
    }

    queueList.innerHTML = sorted.map(p => `
        <div class="queue-item p${p.priority}">
            <div class="qi-priority">P${p.priority}</div>
            <div class="qi-info">
                <div class="qi-name">${p.name}</div>
                <div class="qi-details">Age ${p.age} · ${p.condition}</div>
            </div>
            <div class="qi-time">${formatTime(p.timestamp)}</div>
        </div>
    `).join('');
}

function updateNextPatient() {
    const next = heap.peek();
    if (next) {
        nextPatientCard.classList.remove('hidden');
        nextPatientInfo.innerHTML = `
            <div class="np-name">${next.name} — P${next.priority}</div>
            <div class="np-details">Age ${next.age} · ${next.condition} · Arrived ${formatTime(next.timestamp)}</div>
        `;
    } else {
        nextPatientCard.classList.add('hidden');
    }
}

function updateTreatedList() {
    if (treatedPatients.length === 0) {
        treatedList.innerHTML = '<p style="font-size:0.78rem;color:var(--text-muted);padding:4px 0;">No patients treated yet.</p>';
        return;
    }
    treatedList.innerHTML = treatedPatients.map(p => `
        <div class="treated-item">
            <span class="ti-badge" style="background:var(--p${p.priority}-bg);color:var(--p${p.priority});">P${p.priority}</span>
            <span class="ti-name">${p.name}</span>
            <span style="font-size:0.7rem;color:var(--text-muted);">Age ${p.age}</span>
        </div>
    `).join('');
}

// ─── Operation Log ─────────────────────────────────────────

function appendOperationLogs(logs) {
    logs.forEach(log => {
        const entry = document.createElement('div');
        entry.className = `log-entry log-${log.type}`;
        entry.innerHTML = `
            <span class="log-time">${new Date().toLocaleTimeString()}</span>
            <span class="log-msg">${log.message}</span>
        `;
        logEntries.appendChild(entry);
    });
    logEntries.scrollTop = logEntries.scrollHeight;
}

// ─── Toast Notifications ───────────────────────────────────

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span> ${message}`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ─── Utilities ─────────────────────────────────────────────

function formatTime(ts) {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ─── Sample Data ───────────────────────────────────────────

function loadSampleData() {
    const samples = [
        { name: 'Rahul Sharma', age: 45, priority: 1, condition: 'Cardiac Arrest' },
        { name: 'Priya Patel', age: 28, priority: 3, condition: 'Fractured Arm' },
        { name: 'Amit Kumar', age: 62, priority: 2, condition: 'Severe Breathing Difficulty' },
        { name: 'Sneha Gupta', age: 8, priority: 2, condition: 'High Fever + Seizures' },
        { name: 'Vikram Singh', age: 34, priority: 4, condition: 'Mild Sprain' },
        { name: 'Anita Reddy', age: 55, priority: 1, condition: 'Stroke Symptoms' },
        { name: 'Ravi Joshi', age: 22, priority: 5, condition: 'Common Cold' },
        { name: 'Meera Nair', age: 40, priority: 3, condition: 'Abdominal Pain' },
    ];

    samples.forEach((s, i) => {
        setTimeout(() => {
            heap.insert(s.name, s.age, s.priority, s.condition);
            appendOperationLogs(heap.operationLog);
            updateAllViews();
        }, i * 200);
    });

    showToast(`Loading ${samples.length} sample patients...`, 'info');
}

// ─── Window Resize Handler ─────────────────────────────────
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => updateVisualization(), 150);
});

// ─── Initial Render ────────────────────────────────────────
updateAllViews();
