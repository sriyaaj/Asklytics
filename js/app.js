/**
 * DataSense AI - Main Application Controller
 * 
 * Embodies the Core Principle:
 * "Python/deterministic logic calculates. AI explains. The user decides."
 * 
 * Coordinates all 16 features:
 * 1. CSV Upload & Preview
 * 2. AI-Assisted Cleaning & Resolution (Detect -> Explain -> Suggest -> User Approves -> Apply)
 * 3. Data Quality Check
 * 4. Data Health Score (0-100 deterministic rule breakdown)
 * 5. Automatic KPI Dashboard
 * 6. Intelligent Chart Generation (Chart.js)
 * 7. Plain-English AI Insights (Groq LLM / fallback)
 * 8. Ask Your Data (Single query bar with Insufficient Data safeguard)
 * 9. Insight Evidence Cards ("Why am I saying this?")
 * 10. Action Recommendation Engine
 * 11. Statistical Anomaly Detection (Z-score & IQR)
 * 12. Scenario Simulator (What-If laboratory)
 * 13. Report Comparison (Option A: Datasets, Option B: Periods)
 * 14. Comparison Insights (IMPROVEMENT, DECLINE, ATTENTION tags)
 * 15. Audience-Based Reports (Executive, Analyst, Teacher, Sales Manager, General)
 * 16. PDF Report Export & Methodology Transparency
 */

import { cleanerEngine } from './engine/cleaner.js';
import { analyzerEngine } from './engine/analyzer.js';
import { simulatorEngine } from './engine/simulator.js';
import { comparatorEngine } from './engine/comparator.js';
import { chartService } from './ui/charts.js';
import { evidenceModal } from './ui/evidence.js';
import { groqService } from './services/groq.js';

class DataSenseApp {
  constructor() {
    this.state = {
      filename: 'sales_data.csv',
      rawRecords: [],
      records: [],
      columns: [],
      schema: null,
      healthScore: null,
      qualityAudit: null,
      kpis: [],
      anomalies: [],
      insights: [],
      recommendations: [],
      currentTab: 'tab-overview',
      currentAudience: 'Executive',
      lastQueryResponse: null
    };
  }

  async init() {
    this.bindEvents();
    this.updateGroqStatusUI();
    // Load initial sample dataset (Sales Data)
    await this.loadSampleDataset('sales');
  }

  /**
   * Bind all UI events
   */
  bindEvents() {
    // 1. Tab Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });

    // 2. Sample Dataset Quick Selectors
    document.querySelectorAll('.btn-sample').forEach(btn => {
      btn.addEventListener('click', async () => {
        document.querySelectorAll('.btn-sample').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const sampleKey = btn.getAttribute('data-sample');
        await this.loadSampleDataset(sampleKey);
      });
    });

    // 3. File Upload / Dropzone
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');

    if (dropzone && fileInput) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });

      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files?.length > 0) {
          this.handleFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files?.length > 0) {
          this.handleFile(e.target.files[0]);
        }
      });
    }

    // 4. Cleaning Actions (Undo, Redo, Apply All)
    document.getElementById('btn-undo')?.addEventListener('click', () => this.handleUndo());
    document.getElementById('btn-redo')?.addEventListener('click', () => this.handleRedo());
    document.getElementById('btn-apply-all-clean')?.addEventListener('click', () => this.handleApplyAllCleaning());

    // 5. Ask Your Data
    const askInput = document.getElementById('ask-input');
    const askBtn = document.getElementById('btn-ask-submit');
    const closeQuery = document.getElementById('close-query-panel');
    const queryEvidenceBtn = document.getElementById('btn-query-evidence');

    askBtn?.addEventListener('click', () => this.executeAskQuery(askInput.value));
    askInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.executeAskQuery(askInput.value);
    });
    closeQuery?.addEventListener('click', () => {
      document.getElementById('query-result-panel').classList.add('hidden');
    });
    queryEvidenceBtn?.addEventListener('click', () => this.showQueryEvidence());

    // Keyboard shortcut '/' to focus ask input
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== askInput) {
        e.preventDefault();
        askInput.focus();
        askInput.select();
      }
    });

    // 6. Health Card modal trigger
    document.getElementById('health-card-trigger')?.addEventListener('click', () => this.showHealthModal());
    document.getElementById('close-health-modal')?.addEventListener('click', () => {
      document.getElementById('health-modal').classList.add('hidden');
    });

    // 7. Scenario Simulator Sliders
    const priceSlider = document.getElementById('sim-slider-price');
    const qtySlider = document.getElementById('sim-slider-qty');
    const retSlider = document.getElementById('sim-slider-returns');

    const updateSimUI = () => this.runSimulation();

    priceSlider?.addEventListener('input', (e) => {
      document.getElementById('sim-val-price').textContent = `${Number(e.target.value) >= 0 ? '+' : ''}${e.target.value}%`;
      updateSimUI();
    });
    qtySlider?.addEventListener('input', (e) => {
      document.getElementById('sim-val-qty').textContent = `${Number(e.target.value) >= 0 ? '+' : ''}${e.target.value}%`;
      updateSimUI();
    });
    retSlider?.addEventListener('input', (e) => {
      document.getElementById('sim-val-returns').textContent = `-${e.target.value}%`;
      updateSimUI();
    });
    document.getElementById('btn-run-simulation')?.addEventListener('click', updateSimUI);
    document.getElementById('btn-show-sim-calc')?.addEventListener('click', () => this.showSimulationCalculation());

    // 8. Audience Selector
    document.querySelectorAll('.btn-audience').forEach(btn => {
      btn.addEventListener('click', async () => {
        document.querySelectorAll('.btn-audience').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.currentAudience = btn.getAttribute('data-audience');
        await this.renderAudienceReport();
      });
    });

    // 9. Groq Configuration Modal
    const groqBtn = document.getElementById('btn-groq-config');
    const groqModal = document.getElementById('groq-modal');
    const closeGroq = document.getElementById('close-groq-modal');
    const saveGroq = document.getElementById('btn-save-groq-key');
    const clearGroq = document.getElementById('btn-clear-groq-key');
    const groqKeyInput = document.getElementById('groq-api-key-input');
    const groqModelSelect = document.getElementById('groq-model-select');

    groqBtn?.addEventListener('click', () => {
      groqKeyInput.value = groqService.getApiKey();
      groqModelSelect.value = groqService.getModel();
      groqModal.classList.remove('hidden');
    });
    closeGroq?.addEventListener('click', () => groqModal.classList.add('hidden'));
    saveGroq?.addEventListener('click', () => {
      groqService.setApiKey(groqKeyInput.value);
      groqService.setModel(groqModelSelect.value);
      groqModal.classList.add('hidden');
      this.updateGroqStatusUI();
      // Re-trigger insights generation with new key
      this.renderInsightsAndActions();
    });
    clearGroq?.addEventListener('click', () => {
      groqService.setApiKey('');
      groqKeyInput.value = '';
      this.updateGroqStatusUI();
    });

    // 10. PDF Export / Print
    document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
      window.print();
    });
  }

  updateGroqStatusUI() {
    const dot = document.getElementById('groq-status-dot');
    const btn = document.getElementById('btn-groq-config');
    if (groqService.hasApiKey()) {
      if (dot) dot.style.background = '#10B981';
      if (btn) btn.title = `Connected to Groq (${groqService.getModel()})`;
    } else {
      if (dot) dot.style.background = '#F59E0B';
      if (btn) btn.title = 'No API key set - using built-in deterministic AI logic';
    }
  }

  switchTab(tabId) {
    this.state.currentTab = tabId;
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === tabId);
    });

    // If switching to dashboard, re-render charts to fit container size
    if (tabId === 'tab-dashboard') {
      setTimeout(() => {
        chartService.renderSmartCharts(this.state.records, this.state.columns, this.state.schema);
      }, 50);
    }
  }

  /**
   * Load Sample Dataset
   */
  async loadSampleDataset(key) {
    let path = 'data/sample_sales.csv';
    let filename = 'sales_data.csv';

    if (key === 'students') {
      path = 'data/sample_students.csv';
      filename = 'students_performance.csv';
    } else if (key === 'customers') {
      path = 'data/sample_customers.csv';
      filename = 'customer_churn.csv';
    }

    try {
      const resp = await fetch(path);
      const csvText = await resp.text();
      this.parseAndSetDataset(csvText, filename);
    } catch (e) {
      console.error('Failed to load sample dataset from path:', path, e);
    }
  }

  /**
   * Handle uploaded CSV file
   */
  handleFile(file) {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a valid .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      this.parseAndSetDataset(text, file.name);
    };
    reader.readAsText(file);
  }

  /**
   * Parse CSV content and initialize analytical pipeline
   */
  parseAndSetDataset(csvText, filename) {
    let parsedRows = [];

    if (window.Papa) {
      const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      parsedRows = result.data;
    } else {
      // Fallback CSV parser
      const lines = csvText.trim().split('\n');
      if (lines.length > 1) {
        const headers = lines[0].split(',').map(h => h.trim());
        parsedRows = lines.slice(1).map(line => {
          const vals = line.split(',');
          const obj = {};
          headers.forEach((h, idx) => {
            obj[h] = vals[idx] ? vals[idx].trim() : '';
          });
          return obj;
        });
      }
    }

    if (!parsedRows || parsedRows.length === 0) {
      alert('Unable to parse data from CSV. Please check the file formatting.');
      return;
    }

    const columns = Object.keys(parsedRows[0]);
    this.state.filename = filename;
    this.state.rawRecords = JSON.parse(JSON.stringify(parsedRows));
    this.state.records = JSON.parse(JSON.stringify(parsedRows));
    this.state.columns = columns;

    // Reset cleaner history
    cleanerEngine.history = [];
    cleanerEngine.redoStack = [];

    // Run Full Pipeline
    this.runAnalyticalPipeline();
  }

  /**
   * Run Complete Analytical Pipeline
   * Raw Data -> Cleaning Scan -> Quality Audit -> Health Score -> KPIs -> Charts -> Insights -> Anomalies -> Simulator
   */
  async runAnalyticalPipeline() {
    const { records, columns, filename } = this.state;

    // 1. Schema detection
    this.state.schema = analyzerEngine.detectSchema(records, columns);

    // 2. Scan for Cleaning Suggestions
    const suggestions = cleanerEngine.scanDataset(records, columns);
    document.getElementById('cleaning-badge').textContent = suggestions.filter(s => s.status === 'pending').length;

    // 3. Quality Audit & Health Score
    this.state.qualityAudit = analyzerEngine.runQualityAudit(records, columns);
    this.state.healthScore = analyzerEngine.calculateHealthScore(records, columns);

    // 4. KPIs
    this.state.kpis = analyzerEngine.computeKPIs(records, columns);

    // 5. Anomaly Detection
    this.state.anomalies = analyzerEngine.detectAnomalies(records, columns);
    document.getElementById('anomaly-badge').textContent = this.state.anomalies.length;

    // 6. Action Recommendations
    this.state.recommendations = analyzerEngine.generateRecommendations();

    // 7. Update Baseline for Simulator
    simulatorEngine.setBaselineFromData(records, columns);

    // Render all views
    this.renderOverview();
    this.renderCleaningTab();
    this.renderHealthAndQuality();
    this.renderDashboard();
    await this.renderInsightsAndActions();
    this.renderAnomalies();
    this.runSimulation();
    this.renderComparison();
    await this.renderAudienceReport();
  }

  /**
   * Render Tab 1: Overview & Data Preview
   */
  renderOverview() {
    const { filename, records, columns, schema } = this.state;
    document.getElementById('meta-filename').textContent = filename;
    document.getElementById('meta-domain-tag').textContent = `Domain: ${schema.domain} Analytics`;
    document.getElementById('meta-records').textContent = records.length.toLocaleString();
    document.getElementById('meta-columns').textContent = columns.length;

    const isClean = cleanerEngine.cleaningSuggestions.every(s => s.status !== 'pending');
    const cleanEl = document.getElementById('meta-clean-status');
    cleanEl.textContent = isClean ? 'Cleaned & Verified' : 'Pending Cleaning';
    cleanEl.className = `meta-stat-val ${isClean ? 'text-emerald' : 'text-amber'}`;

    // Table Header
    const thead = document.getElementById('preview-thead');
    thead.innerHTML = `<tr>${columns.map(c => `<th>${c} <span style="font-size:10px;color:var(--text-dim);">(${schema.columns[c].type})</span></th>`).join('')}</tr>`;

    // Table First 10 Rows
    const tbody = document.getElementById('preview-tbody');
    const previewRows = records.slice(0, 10);
    tbody.innerHTML = previewRows.map(row => {
      return `<tr>${columns.map(col => `<td>${row[col] !== undefined && row[col] !== null ? row[col] : '<em style="color:var(--text-dim);">empty</em>'}</td>`).join('')}</tr>`;
    }).join('');
  }

  /**
   * Render Tab 2: AI-Assisted Cleaning & Resolution
   */
  renderCleaningTab() {
    const container = document.getElementById('cleaning-suggestions-container');
    const suggestions = cleanerEngine.cleaningSuggestions;

    if (!suggestions || suggestions.length === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1;background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:30px;text-align:center;">
          <h4 style="font-size:15px;color:var(--accent-emerald);margin-bottom:6px;">✓ Clean Dataset</h4>
          <p style="color:var(--text-muted);font-size:13px;">No duplicates, casing issues, or unstandardized currency strings were detected.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = suggestions.map(sug => {
      const isApplied = sug.status === 'applied';
      const isAck = sug.status === 'acknowledged';

      let reasonItems = sug.reasons.map(r => `<li><span style="color:var(--accent-emerald);">✓</span> ${r}</li>`).join('');

      return `
        <div class="suggestion-card ${isApplied || isAck ? 'applied' : ''}" id="card-${sug.id}">
          <div>
            <div class="sug-header">
              <span class="sug-title">${sug.title}</span>
              <span class="badge ${sug.confidence >= 95 ? 'badge-emerald' : 'badge-amber'}">${sug.badge}</span>
            </div>

            <div class="sug-body">
              <p class="sug-desc">${sug.description}</p>
              <ul class="sug-reasons">
                ${reasonItems}
              </ul>
            </div>
          </div>

          <div>
            <div style="font-size:11.5px;color:var(--text-dim);margin-bottom:8px;">
              Suggested action: <strong style="color:var(--text-main);">${sug.action}</strong>
            </div>
            
            <div class="sug-actions">
              ${isApplied ? `
                <span class="badge badge-emerald">✓ Applied</span>
              ` : `
                <button class="btn btn-sm btn-primary" onclick="window.dataSenseApp.applySuggestion('${sug.id}')">
                  ${sug.type === 'fuzzy_duplicate' ? 'Merge' : 'Accept & Apply'}
                </button>
                <button class="btn btn-sm btn-outline" onclick="window.dataSenseApp.dismissSuggestion('${sug.id}')">
                  ${sug.type === 'fuzzy_duplicate' ? 'Keep Separate' : 'Dismiss'}
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  applySuggestion(sugId) {
    const updated = cleanerEngine.applySuggestion(sugId, this.state.records, this.state.columns);
    this.state.records = updated;
    this.refreshAfterCleaning();
  }

  dismissSuggestion(sugId) {
    const sug = cleanerEngine.cleaningSuggestions.find(s => s.id === sugId);
    if (sug) sug.status = 'dismissed';
    this.renderCleaningTab();
  }

  handleApplyAllCleaning() {
    const updated = cleanerEngine.applyAll(this.state.records, this.state.columns);
    this.state.records = updated;
    this.refreshAfterCleaning();
  }

  handleUndo() {
    const prev = cleanerEngine.undo(this.state.records);
    if (prev) {
      this.state.records = prev;
      this.refreshAfterCleaning();
    } else {
      alert('No previous actions to undo.');
    }
  }

  handleRedo() {
    const next = cleanerEngine.redo(this.state.records);
    if (next) {
      this.state.records = next;
      this.refreshAfterCleaning();
    } else {
      alert('No actions to redo.');
    }
  }

  refreshAfterCleaning() {
    // Re-run quality audit and health scoring
    this.state.qualityAudit = analyzerEngine.runQualityAudit(this.state.records, this.state.columns);
    this.state.healthScore = analyzerEngine.calculateHealthScore(this.state.records, this.state.columns);
    this.state.kpis = analyzerEngine.computeKPIs(this.state.records, this.state.columns);
    this.state.anomalies = analyzerEngine.detectAnomalies(this.state.records, this.state.columns);
    simulatorEngine.setBaselineFromData(this.state.records, this.state.columns);

    this.renderOverview();
    this.renderCleaningTab();
    this.renderHealthAndQuality();
    this.renderDashboard();
    this.renderAnomalies();
    this.runSimulation();
    this.renderComparison();
  }

  /**
   * Render Tab 3: Data Quality Check & Health Score
   */
  renderHealthAndQuality() {
    const h = this.state.healthScore;
    const q = this.state.qualityAudit;

    if (h) {
      document.getElementById('health-score-number').textContent = h.score;
      document.getElementById('val-completeness').textContent = `${h.completeness}%`;
      document.getElementById('val-consistency').textContent = `${h.consistency}%`;
      document.getElementById('val-validity').textContent = `${h.validity}%`;
      document.getElementById('val-duplicates').textContent = `${h.duplicates}%`;

      document.getElementById('bar-completeness').style.width = `${h.completeness}%`;
      document.getElementById('bar-consistency').style.width = `${h.consistency}%`;
      document.getElementById('bar-validity').style.width = `${h.validity}%`;
      document.getElementById('bar-duplicates').style.width = `${h.duplicates}%`;
    }

    if (q) {
      const qContainer = document.getElementById('quality-checklist-container');
      qContainer.innerHTML = q.checklist.map(item => `
        <div class="quality-item">
          <span class="q-icon ${item.status}">${item.status === 'pass' ? '✓' : (item.status === 'warn' ? '⚠' : 'ℹ')}</span>
          <div>
            <div style="font-weight:600;color:var(--text-main);">${item.title}</div>
            <div style="font-size:11.5px;color:var(--text-dim);">${item.detail}</div>
          </div>
        </div>
      `).join('');
    }
  }

  showHealthModal() {
    const h = this.state.healthScore;
    if (!h) return;
    document.getElementById('modal-h-comp').textContent = `${h.completeness}% (Weight: 30%)`;
    document.getElementById('modal-h-cons').textContent = `${h.consistency}% (Weight: 25%)`;
    document.getElementById('modal-h-val').textContent = `${h.validity}% (Weight: 25%)`;
    document.getElementById('modal-h-dupe').textContent = `${h.duplicates}% (Weight: 20%)`;
    document.getElementById('health-modal').classList.remove('hidden');
  }

  /**
   * Render Tab 4: Automatic KPI Dashboard
   */
  renderDashboard() {
    const kpiContainer = document.getElementById('kpi-cards-container');
    const kpis = this.state.kpis;

    kpiContainer.innerHTML = kpis.map((k, idx) => `
      <div class="kpi-card">
        <div>
          <div class="kpi-top">
            <span class="kpi-label">${k.label}</span>
            <span class="badge ${k.trend === 'up' ? 'badge-emerald' : (k.trend === 'down' ? 'badge-rose' : 'badge-indigo')}">
              ${k.trend === 'up' ? '▲ Positive' : (k.trend === 'down' ? '▼ Alert' : '● Verified')}
            </span>
          </div>
          <div class="kpi-value">${k.value}</div>
        </div>
        <div class="kpi-footer">
          <span>${k.subtext}</span>
          <button class="btn btn-sm btn-outline" onclick="window.dataSenseApp.showKpiEvidence(${idx})">Evidence</button>
        </div>
      </div>
    `).join('');

    // Trigger charts rendering
    chartService.renderSmartCharts(this.state.records, this.state.columns, this.state.schema);
  }

  showKpiEvidence(kpiIdx) {
    const kpi = this.state.kpis[kpiIdx];
    if (!kpi) return;

    evidenceModal.show({
      title: `KPI Verification: ${kpi.label}`,
      claim: `${kpi.label} calculated at ${kpi.value} across the active dataset.`,
      baseline: 'Total Matrix Size',
      observed: `${this.state.records.length} Records`,
      shift: kpi.value,
      shiftClass: 'text-white',
      formula: kpi.evidence,
      sources: this.state.columns.slice(0, 4),
      confidence: 'High'
    });
  }

  /**
   * Render Tab 5: Plain-English AI Insights & Action Recommendations
   */
  async renderInsightsAndActions() {
    const insightsContainer = document.getElementById('insights-container');
    const recsContainer = document.getElementById('recs-container');

    insightsContainer.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Analyzing verified facts...</div>';

    // Call Groq Service (or deterministic fallback)
    const insights = await groqService.generateInsights(analyzerEngine.verifiedFacts, this.state.schema.domain);
    this.state.insights = insights;

    insightsContainer.innerHTML = insights.map((ins, idx) => `
      <div class="insight-card">
        <div class="insight-top">
          <span class="badge ${ins.category === 'Growth' ? 'badge-emerald' : (ins.category === 'Risk' ? 'badge-rose' : 'badge-indigo')}">${ins.category}</span>
          <span style="font-size:11px;color:var(--text-dim);">Confidence: ${ins.confidence}</span>
        </div>
        <h4 class="insight-headline">${ins.headline}</h4>
        <p class="insight-summary">${ins.summary}</p>
        <button class="btn btn-sm btn-outline" onclick="window.dataSenseApp.showInsightEvidence(${idx})">Why am I saying this?</button>
      </div>
    `).join('');

    // Action recommendations
    recsContainer.innerHTML = this.state.recommendations.map(r => `
      <div class="rec-card">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
          <span class="badge badge-indigo">${r.tag}</span>
          <span style="font-size:11px;color:var(--accent-cyan);font-weight:600;">Impact: ${r.impact}</span>
        </div>
        <div class="rec-finding">${r.finding}</div>
        <div class="rec-action">→ Suggested action: ${r.action}</div>
      </div>
    `).join('');
  }

  showInsightEvidence(idx) {
    const ins = this.state.insights[idx];
    if (!ins) return;

    evidenceModal.show({
      title: `Insight Evidence: ${ins.headline}`,
      claim: ins.summary,
      baseline: 'Historical / Cohort Average',
      observed: 'Observed Metric Shift',
      shift: 'Verified Finding',
      shiftClass: ins.category === 'Growth' ? 'text-emerald' : 'text-rose',
      formula: `Verified deterministic fact: ${JSON.stringify(analyzerEngine.verifiedFacts[ins.evidenceKey] || analyzerEngine.verifiedFacts, null, 2)}`,
      sources: this.state.columns.slice(0, 3),
      confidence: ins.confidence
    });
  }

  /**
   * Render Tab 6: Anomaly Detection
   */
  renderAnomalies() {
    const container = document.getElementById('anomalies-container');
    const anomalies = this.state.anomalies;

    if (!anomalies || anomalies.length === 0) {
      container.innerHTML = `
        <div style="background:var(--bg-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:24px;text-align:center;">
          <h4 style="color:var(--accent-emerald);font-size:14px;">No Statistical Anomalies Detected</h4>
          <p style="color:var(--text-muted);font-size:12.5px;margin-top:4px;">All records fall within 2.3 standard deviations of their series distribution.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = anomalies.map((a, idx) => `
      <div class="anomaly-card ${a.priority === 'HIGH' ? 'high' : 'attention'}">
        <div class="anomaly-details">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span class="badge ${a.priority === 'HIGH' ? 'badge-rose' : 'badge-amber'}">${a.priority} PRIORITY</span>
            <span style="font-size:12px;font-weight:600;color:var(--text-dim);">${a.column} Anomaly</span>
          </div>
          <h4>${a.entity}</h4>
          <p class="anomaly-desc">${a.description}</p>
        </div>

        <div style="text-align:right;">
          <div style="font-size:18px;font-weight:700;font-family:var(--font-mono);color:${a.priority === 'HIGH' ? 'var(--accent-rose)' : 'var(--accent-amber)'};">${a.diffPct}</div>
          <div style="font-size:11px;color:var(--text-dim);margin-bottom:8px;">vs normal avg (${a.formattedBaseline})</div>
          <button class="btn btn-sm btn-outline" onclick="window.dataSenseApp.showAnomalyEvidence(${idx})">View Evidence</button>
        </div>
      </div>
    `).join('');
  }

  showAnomalyEvidence(idx) {
    const a = this.state.anomalies[idx];
    if (!a) return;

    evidenceModal.show({
      title: `Statistical Anomaly Proof: ${a.entity}`,
      claim: a.description,
      baseline: a.formattedBaseline,
      observed: a.formattedValue,
      shift: a.diffPct,
      shiftClass: a.priority === 'HIGH' ? 'text-rose' : 'text-amber',
      formula: a.calculation,
      sources: [a.column, 'Standard Deviation (σ)', 'Mean (μ)'],
      confidence: 'High'
    });
  }

  /**
   * Feature 8: Ask Your Data
   */
  async executeAskQuery(queryText) {
    if (!queryText || queryText.trim() === '') return;
    const panel = document.getElementById('query-result-panel');
    const answerEl = document.getElementById('query-answer-text');
    const badgeEl = document.getElementById('query-badge');

    panel.classList.remove('hidden');
    answerEl.innerHTML = '<span style="color:var(--text-muted);">Calculating verified facts and formulating plain-English response...</span>';

    // 1. First run deterministic answerer
    const deterministicResp = analyzerEngine.answerQuery(queryText, this.state.records, this.state.columns);

    // 2. If Groq API key is present and question is not an immediate refusal, enhance explanation with LLM
    let finalAnswer = deterministicResp.answer;
    let evidence = deterministicResp.evidence;

    if (groqService.hasApiKey() && !deterministicResp.insufficientData) {
      const groqResp = await groqService.askData(queryText, {
        domain: this.state.schema.domain,
        records: this.state.records.length,
        columns: this.state.columns
      }, analyzerEngine.verifiedFacts);

      if (groqResp?.answer) {
        finalAnswer = groqResp.answer;
        evidence = groqResp.evidence || evidence;
      }
    }

    this.state.lastQueryResponse = {
      query: queryText,
      answer: finalAnswer,
      evidence,
      insufficientData: deterministicResp.insufficientData
    };

    if (deterministicResp.insufficientData) {
      badgeEl.textContent = 'Insufficient Data Safeguard';
      badgeEl.className = 'badge badge-amber';
    } else {
      badgeEl.textContent = 'Verified Calculation';
      badgeEl.className = 'badge badge-emerald';
    }

    answerEl.innerHTML = finalAnswer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n\n/g, '<br><br>');
  }

  showQueryEvidence() {
    const q = this.state.lastQueryResponse;
    if (!q) return;

    evidenceModal.show({
      title: `Query Evidence: "${q.query}"`,
      claim: q.answer.replace(/\*\*/g, ''),
      baseline: `${this.state.records.length} Analyzed Records`,
      observed: q.insufficientData ? 'Dimension Gap' : 'Target Match',
      shift: q.insufficientData ? 'Safeguard Triggered' : 'Confirmed',
      shiftClass: q.insufficientData ? 'text-amber' : 'text-emerald',
      formula: q.evidence,
      sources: this.state.columns.slice(0, 4),
      confidence: q.insufficientData ? '100% Guardrail' : 'High'
    });
  }

  /**
   * Feature 12: Scenario Simulator
   */
  runSimulation() {
    const pricePct = Number(document.getElementById('sim-slider-price')?.value || 5);
    const quantityPct = Number(document.getElementById('sim-slider-qty')?.value || -2);
    const returnReductionPct = Number(document.getElementById('sim-slider-returns')?.value || 10);

    const result = simulatorEngine.simulate({ pricePct, quantityPct, returnReductionPct });
    this.state.lastSimulation = result;

    document.getElementById('sim-est-revenue').textContent = `₹${result.simulatedRevenue.toLocaleString('en-IN')}`;

    const deltaBadge = document.getElementById('sim-est-delta');
    const isPos = result.revenueDiff >= 0;
    deltaBadge.textContent = `${isPos ? '+' : '-'}₹${Math.abs(result.revenueDiff).toLocaleString('en-IN')} (${result.revenueDiffPct}%)`;
    deltaBadge.className = `sim-delta-badge ${isPos ? 'pos' : 'neg'}`;

    document.getElementById('sim-est-returns').textContent = `₹${result.recoveredReturnVal.toLocaleString('en-IN')}`;

    const considerEl = document.getElementById('sim-consideration-text');
    considerEl.textContent = result.considerations.join(' ') || 'Standard demand response assumed.';
  }

  showSimulationCalculation() {
    const sim = this.state.lastSimulation;
    if (!sim) return;

    evidenceModal.show({
      title: 'What-If Simulation Mathematical Proof',
      claim: 'Projected financial outcome based on user-defined assumption multipliers.',
      baseline: `₹${sim.baseRevenue.toLocaleString('en-IN')}`,
      observed: `₹${sim.simulatedRevenue.toLocaleString('en-IN')}`,
      shift: `${sim.revenueDiff >= 0 ? '+' : ''}${sim.revenueDiffPct}%`,
      shiftClass: sim.revenueDiff >= 0 ? 'text-emerald' : 'text-rose',
      formula: sim.mathSteps.join('\n'),
      sources: ['Base Revenue', 'Price Assumption', 'Quantity Multiplier', 'Return Recovery'],
      confidence: sim.confidence
    });
  }

  /**
   * Feature 13 & 14: Report Comparison
   */
  renderComparison() {
    const { labelA, labelB, recordsA, recordsB } = comparatorEngine.splitByPeriods(this.state.records, this.state.columns);
    const result = comparatorEngine.compareRecordSets(recordsA, recordsB, this.state.columns, labelA, labelB);

    document.getElementById('comp-label-a').textContent = result.labelA;
    document.getElementById('comp-label-b').textContent = result.labelB;

    const tbody = document.getElementById('comp-tbody');
    tbody.innerHTML = result.metrics.map((m, idx) => `
      <tr>
        <td>
          <span style="font-weight:600;">${m.name}</span>
          <span class="badge ${m.type === 'IMPROVEMENT' ? 'badge-emerald' : (m.type === 'DECLINE' ? 'badge-rose' : 'badge-amber')}" style="margin-left:6px;">
            ${m.type}
          </span>
        </td>
        <td>${m.unit}${m.valA.toLocaleString('en-IN')}</td>
        <td>${m.unit}${m.valB.toLocaleString('en-IN')}</td>
        <td style="font-family:var(--font-mono);">${m.delta > 0 ? '+' : ''}${m.delta.toLocaleString('en-IN')} ${m.unit}</td>
        <td style="font-family:var(--font-mono);font-weight:600;" class="${m.pct >= 0 ? 'text-emerald' : 'text-rose'}">
          ${m.pct > 0 ? '+' : ''}${m.pct}%
        </td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="window.dataSenseApp.showComparisonEvidence(${idx})">Why?</button>
        </td>
      </tr>
    `).join('');

    document.getElementById('comp-narrative').textContent = result.narrative;
  }

  showComparisonEvidence(idx) {
    const m = comparatorEngine.comparisonResults?.metrics[idx];
    if (!m) return;

    evidenceModal.show({
      title: `Comparison Evidence: ${m.name}`,
      claim: `${m.name} shifted by ${m.pct}% between evaluated periods.`,
      baseline: `${m.unit}${m.valA.toLocaleString('en-IN')}`,
      observed: `${m.unit}${m.valB.toLocaleString('en-IN')}`,
      shift: `${m.pct}%`,
      shiftClass: m.pct >= 0 ? 'text-emerald' : 'text-rose',
      formula: m.evidence,
      sources: ['Period 1', 'Period 2', m.name],
      confidence: 'High'
    });
  }

  /**
   * Feature 15: Audience-Based Reports
   */
  async renderAudienceReport() {
    const box = document.getElementById('audience-report-content');
    box.innerHTML = '<div style="color:var(--text-muted);font-size:13px;">Formulating specialized report...</div>';

    const reportText = await groqService.generateAudienceReport(
      this.state.currentAudience,
      analyzerEngine.verifiedFacts,
      this.state.healthScore ? this.state.healthScore.score : 86
    );

    // Format markdown-like text to clean HTML
    const formatted = reportText
      .replace(/^### (.*$)/gim, '<h3 style="font-size:18px;margin-bottom:8px;color:var(--accent-cyan);">$1</h3>')
      .replace(/^#### (.*$)/gim, '<h4 style="font-size:15px;margin:16px 0 6px;color:var(--text-main);">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^- (.*$)/gim, '<li style="margin-left:20px;color:var(--text-muted);margin-bottom:4px;">$1</li>');

    box.innerHTML = formatted;
  }
}

// Instantiate and expose globally for inline HTML event handlers
window.dataSenseApp = new DataSenseApp();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.dataSenseApp.init());
} else {
  window.dataSenseApp.init();
}
