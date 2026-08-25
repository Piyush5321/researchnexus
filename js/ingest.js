/**
 * ResearchNexus - Multi-Stage Ingestion Controller
 * Coordinates the 4-stage ingestion pipeline modal:
 * 1. PyMuPDF Text & LaTeX Math Extraction
 * 2. Python/C++ Code AST Analysis
 * 3. Gemini 1.5 Pro Triplet Generation
 * 4. AlloyDB pgvector 768-d HNSW Indexing
 */

class IngestionController {
  constructor() {
    this.modal = document.getElementById('ingestModal');
    this.form = document.getElementById('ingestForm');
    this.fileInput = document.getElementById('ingestFileInput');
    this.repoInput = document.getElementById('ingestRepoUrl');
    this.deptSelect = document.getElementById('ingestDeptSelect');
    this.progressContainer = document.getElementById('ingestProgressContainer');
    this.progressBar = document.getElementById('ingestProgressBar');
    this.stageText = document.getElementById('ingestStageText');
    this.stepList = document.getElementById('ingestStepList');
    this.isUploading = false;
  }

  init() {
    if (!this.modal) return;
    this.bindEvents();
  }

  bindEvents() {
    const openBtns = document.querySelectorAll('[data-action="open-ingest"]');
    const closeBtn = document.getElementById('btnCloseIngest');

    openBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openModal();
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal && !this.isUploading) this.closeModal();
    });

    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.startIngestion();
      });
    }

    // Drag and drop setup
    const dropZone = document.getElementById('ingestDropZone');
    if (dropZone && this.fileInput) {
      dropZone.addEventListener('click', () => this.fileInput.click());

      this.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const fileName = e.target.files[0].name;
          const statusText = document.getElementById('ingestFileStatus');
          if (statusText) statusText.textContent = `Attached: ${fileName}`;
        }
      });

      ['dragenter', 'dragover'].forEach(name => {
        dropZone.addEventListener(name, (e) => {
          e.preventDefault();
          dropZone.classList.add('drag-over');
        });
      });

      ['dragleave', 'drop'].forEach(name => {
        dropZone.addEventListener(name, (e) => {
          e.preventDefault();
          dropZone.classList.remove('drag-over');
        });
      });

      dropZone.addEventListener('drop', (e) => {
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.fileInput.files = e.dataTransfer.files;
          const fileName = e.dataTransfer.files[0].name;
          const statusText = document.getElementById('ingestFileStatus');
          if (statusText) statusText.textContent = `Attached: ${fileName}`;
        }
      });
    }
  }

  openModal() {
    if (this.modal) {
      this.modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      this.resetProgress();
    }
  }

  closeModal() {
    if (this.modal && !this.isUploading) {
      this.modal.classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  }

  resetProgress() {
    if (this.progressContainer) this.progressContainer.classList.add('hidden');
    if (this.form) this.form.classList.remove('hidden');
    if (this.progressBar) this.progressBar.style.width = '0%';
    if (this.stageText) this.stageText.textContent = 'Initializing Pipeline...';
    if (this.stepList) {
      this.stepList.innerHTML = `
        <div class="step-item" id="step-1"><i class="fa-solid fa-circle-notch fa-spin"></i> 1. PyMuPDF Document & Math Extraction</div>
        <div class="step-item" id="step-2"><i class="fa-regular fa-circle"></i> 2. Python Code AST Syntax Analysis</div>
        <div class="step-item" id="step-3"><i class="fa-regular fa-circle"></i> 3. Gemini 1.5 Pro Triplet Generation</div>
        <div class="step-item" id="step-4"><i class="fa-regular fa-circle"></i> 4. AlloyDB HNSW Vector Embedding</div>
      `;
    }
  }

  async startIngestion() {
    const file = this.fileInput?.files?.[0];
    const repo = this.repoInput?.value?.trim();

    if (!file && !repo) {
      window.AppToast?.show('Please attach a PDF research paper or enter a Git repository URL.', 'warning');
      return;
    }

    this.isUploading = true;
    if (this.form) this.form.classList.add('hidden');
    if (this.progressContainer) this.progressContainer.classList.remove('hidden');

    const formData = new FormData();
    if (file) formData.append('file', file);
    if (repo) formData.append('repo_url', repo);
    formData.append('department', this.deptSelect?.value || 'cs');

    try {
      let stageIndex = 1;
      const result = await window.MockAPI.ingestDocument(formData, (progress) => {
        if (this.progressBar) this.progressBar.style.width = `${progress.pct}%`;
        if (this.stageText) this.stageText.textContent = progress.stage;

        const currentStepEl = document.getElementById(`step-${stageIndex}`);
        if (currentStepEl) {
          currentStepEl.innerHTML = `<i class="fa-solid fa-check" style="color: var(--accent-green);"></i> ${currentStepEl.textContent.substring(2)}`;
          currentStepEl.classList.add('completed');
        }

        stageIndex++;
        const nextStepEl = document.getElementById(`step-${stageIndex}`);
        if (nextStepEl) {
          nextStepEl.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin" style="color: var(--accent-cyan);"></i> ${nextStepEl.textContent.substring(2)}`;
        }
      });

      if (this.stageText) this.stageText.innerHTML = `<span style="color: var(--accent-green);"><i class="fa-solid fa-circle-check"></i> Ingestion & Graph Synchronization Complete</span>`;
      window.AppToast?.show(`Indexed ${result.nodesCreated} nodes and ${result.edgesCreated} cross-department edges!`, 'success');

      // Refresh graph if on dashboard
      if (window.liveGraph) {
        window.liveGraph.init();
      }

      setTimeout(() => {
        this.isUploading = false;
        this.closeModal();
      }, 1500);

    } catch (err) {
      console.error('[Ingest] Ingestion pipeline failed:', err);
      if (this.stageText) this.stageText.innerHTML = `<span style="color: var(--accent-red);"><i class="fa-solid fa-triangle-exclamation"></i> Ingestion Error: ${err.message}</span>`;
      this.isUploading = false;
    }
  }
}

window.IngestionController = IngestionController;
export default IngestionController;
