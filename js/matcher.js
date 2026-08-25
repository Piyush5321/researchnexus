/**
 * ResearchNexus - Document Genre Analyzer & Related Paper Matcher
 * Analyzes uploaded papers/abstracts, extracts genre/domain, runs pgvector nearest-neighbor
 * search against institutional graph nodes, and renders ranked collaboration opportunities.
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
      window.AppToast?.show('Please provide a research PDF or paste an abstract.', 'warning');
      return;
    }

    this.isProcessing = true;
    if (this.loadingIndicator) this.loadingIndicator.classList.remove('hidden');
    if (this.resultsContainer) this.resultsContainer.innerHTML = '';

    try {
      let result;
      // Check if MockAPI or live REST
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
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 32px; color: var(--accent-red); margin-bottom: 12px;"></i>
            <h4 style="color: #fff; margin-bottom: 8px;">Analysis Failed</h4>
            <p style="color: var(--text-secondary); font-size: 13px;">${err.message || 'Unable to process document'}</p>
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
      .map(k => `<span class="badge" style="background: rgba(0, 240, 255, 0.1); border-color: rgba(0, 240, 255, 0.3); color: var(--accent-cyan);"><i class="fa-solid fa-microchip" style="font-size: 10px;"></i> ${k}</span>`)
      .join(' ');

    let matchesHtml = '';
    matches.forEach(item => {
      const matchPct = Math.round((item.similarityScore || 0.8) * 100);
      matchesHtml += `
        <div class="match-item glass-card" style="padding: 16px; margin-bottom: 14px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.08);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
            <div>
              <span class="badge badge-${item.deptCode || 'cs'}" style="margin-right: 8px;">
                <i class="fa-solid fa-building-columns"></i> ${item.department}
              </span>
              <span class="badge" style="background: rgba(138, 43, 226, 0.15); border-color: rgba(138, 43, 226, 0.4); color: var(--accent-violet);">
                <i class="fa-solid fa-code-compare"></i> ${item.genreOverlap}
              </span>
            </div>
            <div style="text-align: right;">
              <span style="font-family: var(--font-mono); font-size: 18px; font-weight: 700; color: var(--accent-cyan);">${matchPct}%</span>
              <div style="font-size: 10px; color: var(--text-muted);">Vector Cosine Sim</div>
            </div>
          </div>

          <h4 style="color: #FFFFFF; font-size: 15px; margin-bottom: 6px; font-weight: 600;">${item.title}</h4>
          <p style="color: var(--text-secondary); font-size: 12px; margin-bottom: 10px;">
            <i class="fa-solid fa-user-astronaut" style="color: var(--accent-cyan);"></i> Lead: <strong style="color: #fff;">${item.author}</strong>
          </p>

          <div style="background: rgba(0, 0, 0, 0.3); border-radius: 8px; padding: 10px; margin-bottom: 12px;">
            <div style="font-size: 11px; color: var(--accent-amber); font-weight: 600; margin-bottom: 4px;">
              <i class="fa-solid fa-lightbulb"></i> Recommended Cross-Department Collaboration:
            </div>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.4;">${item.recommendedCollaboration}</p>
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button class="btn btn-secondary btn-sm" onclick="window.FocusGraphNode('${item.id}')">
              <i class="fa-solid fa-crosshairs"></i> Focus in Graph
            </button>
            <button class="btn btn-primary btn-sm" onclick="window.OpenCollaborationBrief('${item.id}', '${item.title}', '${item.author}')">
              <i class="fa-solid fa-envelope-open-text"></i> Connect Researchers
            </button>
          </div>
        </div>
      `;
    });

    this.resultsContainer.innerHTML = `
      <div class="glass-panel" style="padding: 20px; border-radius: 14px; margin-bottom: 20px; border-color: rgba(0, 240, 255, 0.2);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted);">AI Classification Result</div>
            <h3 style="color: #fff; font-size: 18px; margin: 4px 0 0 0;">${doc.detectedGenre}</h3>
          </div>
          <span class="badge" style="background: rgba(0, 255, 102, 0.15); border-color: rgba(0, 255, 102, 0.4); color: var(--accent-green); font-size: 12px;">
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
        <h4 style="color: #fff; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; margin: 0;">
          <i class="fa-solid fa-network-wired" style="color: var(--accent-cyan);"></i> Cross-Disciplinary Matches (${matches.length})
        </h4>
        <span style="font-size: 11px; color: var(--text-muted);">AlloyDB pgvector Cosine Rank</span>
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
  if (window.liveGraph) {
    window.liveGraph.focusNodeById(nodeId);
    window.AppToast?.show(`Centered graph on matched node: ${nodeId}`, 'info');
  }
};

window.PaperMatcherController = PaperMatcherController;
export default PaperMatcherController;
