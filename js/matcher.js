/**
 * ResearchNexus - Document Genre Analyzer & Related Paper Matcher
 * Analyzes uploaded research papers/PDFs, extracts genre/domain, runs pgvector nearest-neighbor
 * search against institutional graph nodes, and renders ranked relevance explanations and synergy actions.
 */

class PaperMatcherController {
  constructor() {
    this.modal = document.getElementById('matcherModal');
    this.form = document.getElementById('matcherForm');
    this.fileInput = document.getElementById('matcherFileInput');
    this.textInput = document.getElementById('matcherTextInput');
    this.deptSelect = document.getElementById('matcherDeptSelect');
    this.resultsContainer = document.getElementById('matcherResults');
    this.loadingIndicator = document.getElementById('matcherLoading');
    this.isProcessing = false;
  }

  init() {
    if (!this.modal) return;
    this.bindEvents();
  }

  bindEvents() {
    const openBtn = document.getElementById('btnOpenMatcher');
    const closeBtn = document.getElementById('btnCloseMatcher');

    if (openBtn) {
      openBtn.addEventListener('click', () => this.openModal());
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    // Modal background click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });

    // Form submit
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAnalysis();
      });
    }

    // Drag and drop zone
    const dropZone = document.getElementById('matcherDropZone');
    if (dropZone && this.fileInput) {
      dropZone.addEventListener('click', () => this.fileInput.click());
      
      this.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const fileName = e.target.files[0].name;
          const statusText = document.getElementById('matcherFileStatus');
          if (statusText) statusText.textContent = `Selected: ${fileName}`;
        }
      });

      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropZone.classList.add('drag-over');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
          e.preventDefault();
          dropZone.classList.remove('drag-over');
        });
      });

      dropZone.addEventListener('drop', (e) => {
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.fileInput.files = e.dataTransfer.files;
          const fileName = e.dataTransfer.files[0].name;
          const statusText = document.getElementById('matcherFileStatus');
          if (statusText) statusText.textContent = `Selected: ${fileName}`;
        }
      });
    }
  }

  openModal() {
    if (this.modal) {
      this.modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal() {
    if (this.modal) {
      this.modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }

  async handleAnalysis() {
    if (this.isProcessing) return;
    const file = this.fileInput?.files?.[0];
    const text = this.textInput?.value?.trim();
    const dept = this.deptSelect?.value || 'all';

    if (!file && !text) {
      if (window.showToast) window.showToast('Please provide a research PDF or paste an abstract.', 'warning');
      return;
    }

    this.isProcessing = true;
    if (this.loadingIndicator) this.loadingIndicator.classList.remove('hidden');
    if (this.resultsContainer) this.resultsContainer.innerHTML = '';

    try {
      let result;
      if (window.MockAPI) {
        result = await window.MockAPI.analyzeAndMatchPaper(file, text, dept);
      }

      if (this.loadingIndicator) this.loadingIndicator.classList.add('hidden');
      this.renderResults(result);
    } catch (err) {
      console.error('[Matcher] Analysis failed:', err);
      if (this.loadingIndicator) this.loadingIndicator.classList.add('hidden');
      if (this.resultsContainer) {
        this.resultsContainer.innerHTML = `
          <div class="glass-panel" style="padding: 24px; text-align: center; border-color: rgba(255, 0, 85, 0.4);">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 32px; color: var(--alert-red); margin-bottom: 12px;"></i>
            <h4 style="color: #fff; margin-bottom: 8px;">Analysis Failed</h4>
            <p style="color: var(--text-muted); font-size: 13px;">${err.message || 'Unable to process document'}</p>
          </div>
        `;
      }
    } finally {
      this.isProcessing = false;
    }
  }

  renderResults(data) {
    if (!this.resultsContainer || !data) return;
    const doc = data.analyzedDocument;
    const matches = data.topMatches || [];

    const kernelsHtml = (doc.keyMathematicalKernels || [])
      .map(k => `<span class="badge badge-cyan" style="font-size: 11px;"><i class="fa-solid fa-microchip" style="font-size: 10px;"></i> ${k}</span>`)
      .join(' ');

    let matchesHtml = '';
    matches.forEach(item => {
      const matchPct = Math.round((item.similarityScore || 0.8) * 100);
      const isCritical = matchPct >= 90;
      
      matchesHtml += `
        <div class="match-item glass-card" style="padding: 16px; margin-bottom: 14px; border-radius: 12px; border: 1px solid var(--border-subtle); background: rgba(255, 255, 255, 0.02);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div>
              <span class="badge ${item.deptCode === 'bio' ? 'badge-violet' : item.deptCode === 'mech' ? 'badge-amber' : item.deptCode === 'chem' ? 'badge-cyan' : 'badge-green'}" style="margin-right: 8px; font-size: 11px;">
                <i class="fa-solid fa-building-columns"></i> ${item.department}
              </span>
              <span class="badge badge-cyan" style="font-size: 11px;">
                <i class="fa-solid fa-code-compare"></i> ${item.genreOverlap}
              </span>
            </div>
            <div style="text-align: right;">
              <span style="font-family: var(--font-mono); font-size: 20px; font-weight: 800; color: ${isCritical ? 'var(--neon-cyan)' : 'var(--neon-violet)'};">${matchPct}%</span>
              <div style="font-size: 10px; color: var(--text-dim); font-family: var(--font-mono);">Semantic Relevance</div>
            </div>
          </div>

          <h4 style="color: #FFFFFF; font-size: 15px; margin-bottom: 6px; font-weight: 700;">${item.title}</h4>
          <p style="color: var(--text-muted); font-size: 12px; margin-bottom: 8px;">
            <i class="fa-solid fa-user-astronaut" style="color: var(--neon-cyan);"></i> Lead Researcher: <strong style="color: #fff;">${item.author}</strong>
          </p>

          <!-- Why This Is Relevant to This Paper Section -->
          <div style="background: rgba(0, 240, 255, 0.05); border-left: 3px solid var(--neon-cyan); border-radius: 4px 8px 8px 4px; padding: 10px 14px; margin-bottom: 10px;">
            <div style="font-size: 11px; color: var(--neon-cyan); font-weight: 700; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
              <i class="fa-solid fa-diagram-project"></i> Relevance Breakdown:
            </div>
            <p style="font-size: 12px; color: #E2E8F0; margin: 0; line-height: 1.5;">${item.whyRelevant}</p>
          </div>

          <!-- Matched Equations -->
          ${item.equationsMatched && item.equationsMatched.length > 0 ? `
            <div style="background: rgba(0, 0, 0, 0.35); border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; font-family: var(--font-mono); font-size: 11px; color: var(--neon-green);">
              <span style="color: var(--text-muted);"><i class="fa-solid fa-square-root-variable"></i> Overlapping Equations: </span>${item.equationsMatched.join(' • ')}
            </div>
          ` : ''}

          <div style="background: rgba(255, 179, 0, 0.06); border: 1px solid rgba(255, 179, 0, 0.2); border-radius: 6px; padding: 8px 12px; margin-bottom: 12px;">
            <div style="font-size: 11px; color: var(--neon-amber); font-weight: 700; margin-bottom: 2px;">
              <i class="fa-solid fa-lightbulb"></i> Recommended Action:
            </div>
            <p style="font-size: 11px; color: var(--text-muted); margin: 0; line-height: 1.4;">${item.recommendedCollaboration}</p>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-ghost" style="padding: 6px 12px; font-size: 11px;" onclick="window.FocusGraphNode('${item.id}')">
              <i class="fa-solid fa-crosshairs"></i> Focus in Graph
            </button>
            <button class="btn btn-primary" style="padding: 6px 14px; font-size: 11px;" onclick="window.ConnectResearchers('${item.id}', '${item.title.replace(/'/g, "\\'")}', '${item.author}')">
              <i class="fa-solid fa-envelope-open-text"></i> Connect Researchers
            </button>
          </div>
        </div>
      `;
    });

    this.resultsContainer.innerHTML = `
      <div class="glass-panel" style="padding: 20px; border-radius: 14px; margin-bottom: 20px; border: 1px solid rgba(0, 240, 255, 0.25); background: rgba(0, 240, 255, 0.03);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <div style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-dim); font-family: var(--font-mono);">Automated Domain Classification</div>
            <h3 style="color: #fff; font-size: 18px; margin: 4px 0 0 0; font-weight: 700;">${doc.detectedGenre}</h3>
          </div>
          <span class="badge badge-green" style="font-size: 12px;">
            <i class="fa-solid fa-circle-check"></i> ${Math.round(doc.genreConfidence * 100)}% Confidence
          </span>
        </div>

        <div style="margin-bottom: 10px;">
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px;">Identified Mathematical & Algorithmic Kernels:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${kernelsHtml}
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <h4 style="color: #fff; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; font-weight: 700;">
          <i class="fa-solid fa-network-wired" style="color: var(--neon-cyan);"></i> Relevant Institutional Research Matches (${matches.length})
        </h4>
        <span style="font-size: 11px; color: var(--text-dim); font-family: var(--font-mono);">Ranked by 768-D Vector Cosine & AST Math</span>
      </div>

      <div class="matches-list">
        ${matchesHtml}
      </div>
    `;
  }
}

// Global hook to focus node in graph
window.FocusGraphNode = function(nodeId) {
  const matcher = window.AppMatcher;
  if (matcher) matcher.closeModal();
  if (window.GraphEngine) {
    window.GraphEngine.focusNode(nodeId);
    if (window.showToast) window.showToast(`Centered Knowledge Graph on matched node: ${nodeId}`, 'cyan');
  } else {
    window.location.href = `dashboard.html?focus=${nodeId}`;
  }
};

window.ConnectResearchers = function(nodeId, title, author) {
  if (window.showToast) {
    window.showToast(`Opening collaboration brief with ${author} regarding ${title}...`, 'green');
  }
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop active';
  modal.innerHTML = `
    <div class="modal-dialog" style="max-width: 580px;">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 10px;">
          <i class="fa-solid fa-paper-plane" style="color: var(--neon-cyan);"></i>
          <span class="modal-title">Initiate Cross-Disciplinary Collaboration</span>
        </div>
        <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
          Direct institutional synergy proposal automatically pre-populated with matched mathematical formulations:
        </div>
        <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; font-family: var(--font-mono); font-size: 11px; color: #E2E8F0; margin-bottom: 14px; line-height: 1.6;">
          <strong>TO:</strong> ${author} &lt;faculty@university.edu&gt;<br>
          <strong>SUBJECT:</strong> Research Synergy & Code Unification: ${title}<br><br>
          Dear ${author},<br>
          Our automated AST pipeline identified a 90%+ mathematical kernel equivalence between our recent CFD/solver formulation and your published project "${title}". We propose establishing a unified codebase repository to prevent redundant compute cycles and co-author a joint grant proposal.
        </div>
      </div>
      <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
        <button class="btn btn-ghost" onclick="this.closest('.modal-backdrop').remove()">Cancel</button>
        <button class="btn btn-primary" onclick="window.showToast('Synergy proposal dispatched to ${author}!', 'green'); this.closest('.modal-backdrop').remove();">
          <i class="fa-solid fa-check"></i> Send Synergy Dispatch
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

window.PaperMatcherController = PaperMatcherController;
export default PaperMatcherController;
export { PaperMatcherController };
