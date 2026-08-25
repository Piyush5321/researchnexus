/**
 * ResearchNexus - Multi-Modal Document Ingestion Controller
 * Handles PDF drag-drop, LaTeX math parsing progress, AST extraction,
 * and AlloyDB vector database ingestion pipelines.
 */

class IngestionController {
  constructor() {
    this.modal = document.getElementById('ingestModal');
    this.form = document.getElementById('ingestForm');
    this.fileInput = document.getElementById('ingestFileInput');
    this.dropZone = document.getElementById('ingestDropZone');
    this.progressContainer = document.getElementById('ingestProgressContainer');
    this.progressBar = document.getElementById('ingestProgressBar');
    this.progressStatus = document.getElementById('ingestProgressStatus');
    this.summaryContainer = document.getElementById('ingestSummary');
    this.isIngesting = false;
  }

  init() {
    if (!this.modal) return;
    this.bindEvents();
  }

  bindEvents() {
    const openBtn = document.getElementById('btnOpenIngest');
    const closeBtn = document.getElementById('btnCloseIngest');

    if (openBtn) {
      openBtn.addEventListener('click', () => this.openModal());
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });

    if (this.dropZone && this.fileInput) {
      this.dropZone.addEventListener('click', () => this.fileInput.click());

      this.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const fileName = e.target.files[0].name;
          const statusText = document.getElementById('ingestFileStatus');
          if (statusText) statusText.textContent = `File Ready: ${fileName} (${(e.target.files[0].size / 1024 / 1024).toFixed(2)} MB)`;
        }
      });

      ['dragenter', 'dragover'].forEach(name => {
        this.dropZone.addEventListener(name, (e) => {
          e.preventDefault();
          this.dropZone.classList.add('drag-over');
        });
      });

      ['dragleave', 'drop'].forEach(name => {
        this.dropZone.addEventListener(name, (e) => {
          e.preventDefault();
          this.dropZone.classList.remove('drag-over');
        });
      });

      this.dropZone.addEventListener('drop', (e) => {
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.fileInput.files = e.dataTransfer.files;
          const fileName = e.dataTransfer.files[0].name;
          const statusText = document.getElementById('ingestFileStatus');
          if (statusText) statusText.textContent = `File Ready: ${fileName}`;
        }
      });
    }

    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.startIngestion();
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

  async startIngestion() {
    if (this.isIngesting) return;
    const file = this.fileInput?.files?.[0];
    if (!file) {
      window.AppToast?.show('Please select a paper PDF to ingest.', 'warning');
      return;
    }

    this.isIngesting = true;
    if (this.progressContainer) this.progressContainer.classList.remove('hidden');
    if (this.summaryContainer) this.summaryContainer.classList.add('hidden');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('department', document.getElementById('ingestDeptSelect')?.value || 'cs');
    formData.append('author', document.getElementById('ingestAuthorInput')?.value || '');

    try {
      const result = await window.MockAPI.ingestDocument(formData, (progress) => {
        if (this.progressBar) this.progressBar.style.width = `${progress.pct}%`;
        if (this.progressStatus) this.progressStatus.textContent = progress.stage;
      });

      this.showSummary(result);
      window.AppToast?.show('Document successfully ingested and indexed into Knowledge Graph!', 'success');
    } catch (err) {
      console.error('[Ingest] Error:', err);
      if (this.progressStatus) this.progressStatus.textContent = `Ingestion failed: ${err.message}`;
    } finally {
      this.isIngesting = false;
    }
  }

  showSummary(result) {
    if (!this.summaryContainer) return;
    this.summaryContainer.classList.remove('hidden');
    this.summaryContainer.innerHTML = `
      <div class="glass-panel" style="padding: 20px; border-radius: 12px; border-color: rgba(0, 250, 100, 0.3); text-align: center;">
        <i class="fa-solid fa-circle-check" style="font-size: 36px; color: var(--neon-green); margin-bottom: 12px;"></i>
        <h4 style="color: #fff; margin-bottom: 6px;">Ingestion Pipeline Complete</h4>
        <p style="font-size: 12px; color: var(--text-dim); margin-bottom: 16px;">Reference Job ID: <strong style="color: var(--neon-cyan);">${result.ingestionId}</strong></p>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;">
          <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">
            <div style="font-size: 18px; font-weight: 700; color: var(--neon-cyan);">${result.nodesCreated}</div>
            <div style="font-size: 10px; color: var(--text-muted);">Nodes Extracted</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">
            <div style="font-size: 18px; font-weight: 700; color: var(--neon-violet-light);">${result.edgesCreated}</div>
            <div style="font-size: 10px; color: var(--text-muted);">Knowledge Edges</div>
          </div>
          <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">
            <div style="font-size: 18px; font-weight: 700; color: var(--alert-amber);">${result.potentialRedundancies}</div>
            <div style="font-size: 10px; color: var(--text-muted);">Redundancies Flagged</div>
          </div>
        </div>

        <button class="btn btn-primary btn-sm" style="width: 100%;" onclick="window.AppIngest.closeModal()">
          <i class="fa-solid fa-check"></i> Done & View Updated Graph
        </button>
      </div>
    `;
  }
}

window.IngestionController = IngestionController;
export default IngestionController;
