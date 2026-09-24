/**
 * DataSense AI - Insight Evidence Cards UI
 * 
 * Feature 9: Insight Evidence Cards ("Why am I saying this?")
 * 
 * Connects AI claims directly to:
 * - Actual dataset values
 * - Step-by-step mathematical calculations
 * - Source columns
 * - Confidence rating & timestamp
 */

export class EvidenceModal {
  constructor() {
    this.container = null;
  }

  init() {
    if (!document.getElementById('evidence-modal')) {
      const modal = document.createElement('div');
      modal.id = 'evidence-modal';
      modal.className = 'modal-backdrop hidden';
      modal.innerHTML = `
        <div class="modal-card evidence-card-view">
          <div class="modal-header">
            <div class="evidence-badge-row">
              <span class="badge badge-indigo">EVIDENCE VERIFICATION</span>
              <span id="evidence-confidence" class="badge badge-emerald">Confidence: High</span>
            </div>
            <button class="btn-icon" id="close-evidence-modal" aria-label="Close modal">&times;</button>
          </div>
          <div class="modal-body">
            <h3 id="evidence-title" class="evidence-title">Insight Verification</h3>
            <p id="evidence-claim" class="evidence-claim-text"></p>
            
            <div class="evidence-divider"></div>

            <div class="evidence-grid">
              <div class="evidence-metric-box">
                <span class="evidence-metric-label">Baseline Metric</span>
                <span id="evidence-baseline" class="evidence-metric-val">₹1,25,000</span>
              </div>
              <div class="evidence-metric-box">
                <span class="evidence-metric-label">Observed Metric</span>
                <span id="evidence-observed" class="evidence-metric-val">₹97,500</span>
              </div>
              <div class="evidence-metric-box">
                <span class="evidence-metric-label">Net Shift</span>
                <span id="evidence-shift" class="evidence-metric-val text-rose">-22%</span>
              </div>
            </div>

            <div class="evidence-calc-section">
              <div class="section-label">MATHEMATICAL CALCULATION</div>
              <div class="math-proof-box">
                <code id="evidence-formula">
(97,500 - 125,000)
───────────────── × 100  =  -22.0%
     125,000
                </code>
              </div>
            </div>

            <div class="evidence-source-section">
              <div class="section-label">SOURCE TRACEABILITY</div>
              <div class="source-pills" id="evidence-sources">
                <span class="pill">Date</span>
                <span class="pill">Region</span>
                <span class="pill">Revenue</span>
              </div>
            </div>

            <div class="evidence-footer-note">
              <span class="verified-icon">✓</span>
              <span>Calculated deterministically by Python/JS engine. AI was solely used for plain-English communication.</span>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById('close-evidence-modal').addEventListener('click', () => this.hide());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.hide();
      });
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) this.hide();
      });
    }
  }

  show({
    title = 'Insight Evidence',
    claim = '',
    baseline = 'N/A',
    observed = 'N/A',
    shift = 'N/A',
    shiftClass = 'text-white',
    formula = '',
    sources = [],
    confidence = 'High'
  }) {
    this.init();
    const modal = document.getElementById('evidence-modal');
    document.getElementById('evidence-title').textContent = title;
    document.getElementById('evidence-claim').textContent = claim;
    document.getElementById('evidence-baseline').textContent = baseline;
    document.getElementById('evidence-observed').textContent = observed;
    
    const shiftEl = document.getElementById('evidence-shift');
    shiftEl.textContent = shift;
    shiftEl.className = `evidence-metric-val ${shiftClass}`;

    document.getElementById('evidence-formula').textContent = formula;
    
    const confEl = document.getElementById('evidence-confidence');
    confEl.textContent = `Confidence: ${confidence}`;
    confEl.className = `badge ${confidence === 'High' ? 'badge-emerald' : 'badge-amber'}`;

    const sourcesEl = document.getElementById('evidence-sources');
    sourcesEl.innerHTML = sources.map(s => `<span class="pill">${s}</span>`).join('');

    modal.classList.remove('hidden');
  }

  hide() {
    const modal = document.getElementById('evidence-modal');
    if (modal) modal.classList.add('hidden');
  }
}

export const evidenceModal = new EvidenceModal();
