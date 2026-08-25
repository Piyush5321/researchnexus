/**
 * ResearchNexus - Global Application UI Controller
 * Modals, Tab Switching, AST Code Comparison Viewer, Global Search, and Toasts
 */

(function () {
  'use strict';

  // 1. Toast Notification System
  function showToast(message, type = 'cyan') {
    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-msg';

    let iconClass = 'fa-info-circle';
    let iconColor = 'var(--neon-cyan)';
    if (type === 'green') {
      iconClass = 'fa-circle-check';
      iconColor = 'var(--neon-green)';
    } else if (type === 'amber' || type === 'warning') {
      iconClass = 'fa-triangle-exclamation';
      iconColor = 'var(--alert-amber)';
    } else if (type === 'violet') {
      iconClass = 'fa-wand-magic-sparkles';
      iconColor = 'var(--neon-violet-light)';
    }

    toast.innerHTML = `
      <i class="fa-solid ${iconClass}" style="color: ${iconColor}; font-size: 16px;"></i>
      <span>${message}</span>
    `;

    stack.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
  window.showToast = showToast;
  window.AppToast = {
    show: (msg, type) => showToast(msg, type === 'success' ? 'green' : type === 'warning' ? 'amber' : type === 'error' ? 'amber' : 'cyan')
  };

  // 2. Global Semantic Search Bar with Autocomplete
  function initGlobalSearch() {
    const searchInput = document.getElementById('global-search-input');
    const dropdown = document.getElementById('global-search-dropdown');
    if (!searchInput || !dropdown) return;

    let debounceTimer;

    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();

      if (!query) {
        dropdown.classList.remove('active');
        dropdown.innerHTML = '';
        return;
      }

      debounceTimer = setTimeout(async () => {
        const results = await window.MockAPI.searchEntities(query);
        if (results.length === 0) {
          dropdown.innerHTML = `
            <div style="padding: 14px; text-align: center; color: var(--text-dim); font-size: 12px;">
              No matching cross-department entities found for "${query}"
            </div>
          `;
        } else {
          dropdown.innerHTML = results.map(r => `
            <div class="search-result-item" data-node-id="${r.id}">
              <div>
                <div style="font-weight: 600; font-size: 13px; color: var(--text-highlight);">${r.name}</div>
                <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">
                  ${r.author} • ${r.dept ? r.dept.toUpperCase() : 'DEPT'}
                </div>
              </div>
              <span class="badge badge-${r.dept === 'bio' ? 'violet' : r.dept === 'mech' ? 'amber' : 'cyan'}">
                ${r.type || 'entity'}
              </span>
            </div>
          `).join('');

          dropdown.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
              const nodeId = item.getAttribute('data-node-id');
              dropdown.classList.remove('active');
              searchInput.value = '';

              if (window.location.pathname.includes('dashboard.html')) {
                if (window.GraphEngine) window.GraphEngine.focusNode(nodeId);
              } else {
                window.location.href = `dashboard.html?focus=${nodeId}`;
              }
            });
          });
        }
        dropdown.classList.add('active');
      }, 200);
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  }

  // 3. Global Firebase Auth Navbar Sync & Persona Handler
  function initFirebaseAuthNavbar() {
    if (!window.FirebaseAuth) return;

    window.FirebaseAuth.onAuthChange((user, meta) => {
      const authNavLinks = document.querySelectorAll('a[href="auth.html"]');
      
      authNavLinks.forEach(link => {
        if (user) {
          const name = user.displayName || (meta && meta.displayName) || user.email.split('@')[0];
          link.innerHTML = `<i class="fa-solid fa-circle-user" style="color: var(--neon-cyan);"></i> <span>${escapeHtml(name)}</span>`;
          link.title = `Signed in as ${user.email} (Firebase Auth)`;
        } else {
          link.innerHTML = `<i class="fa-solid fa-key"></i> <span>Institutional Access</span>`;
          link.title = 'Sign in or create an account with Firebase';
        }
      });
    });
  }

  function initAuthInteractions() {
    initFirebaseAuthNavbar();
  }

  // 4. Modal Dialogs (AST Comparison & Connect Researchers)
  function initModals() {
    const astModal = document.getElementById('ast-comparison-modal');
    const connectModal = document.getElementById('connect-researchers-modal');
    const newAnalysisModal = document.getElementById('new-analysis-modal');

    // Close buttons
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('active'));
      });
    });

    // Close on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) backdrop.classList.remove('active');
      });
    });

    // Open AST Comparison Viewer
    window.openASTComparison = async function (alertId) {
      if (!astModal) return;
      const alerts = await window.MockAPI.getRedundancyAlerts();
      const targetAlert = alerts.find(a => a.id === alertId) || alerts[0];

      const modalTitle = astModal.querySelector('#ast-modal-title');
      const similarityBadge = astModal.querySelector('#ast-modal-similarity');
      const paneATitle = astModal.querySelector('#ast-pane-a-title');
      const paneBTitle = astModal.querySelector('#ast-pane-b-title');
      const paneACode = astModal.querySelector('#ast-pane-a-code');
      const paneBCode = astModal.querySelector('#ast-pane-b-code');

      if (modalTitle) modalTitle.textContent = `AST Comparison: ${targetAlert.deptA} vs. ${targetAlert.deptB}`;
      if (similarityBadge) similarityBadge.textContent = `${targetAlert.similarity}% Algorithmic Similarity`;
      if (paneATitle) paneATitle.textContent = targetAlert.astDiff.titleA;
      if (paneBTitle) paneBTitle.textContent = targetAlert.astDiff.titleB;

      if (paneACode) {
        paneACode.innerHTML = targetAlert.astDiff.codeA.map((line, i) => `
          <div class="ast-line ${i >= 3 && i <= 6 ? 'ast-line-match' : ''}">
            <span style="color: var(--text-dim); margin-right: 8px; user-select: none;">${i + 1}</span>${escapeHtml(line)}
          </div>
        `).join('');
      }

      if (paneBCode) {
        paneBCode.innerHTML = targetAlert.astDiff.codeB.map((line, i) => `
          <div class="ast-line ${i >= 3 && i <= 6 ? 'ast-line-match' : ''}">
            <span style="color: var(--text-dim); margin-right: 8px; user-select: none;">${i + 1}</span>${escapeHtml(line)}
          </div>
        `).join('');
      }

      astModal.classList.add('active');
    };

    // Open Connect Researchers Modal
    window.openConnectModal = async function (alertId) {
      if (!connectModal) return;
      const alerts = await window.MockAPI.getRedundancyAlerts();
      const targetAlert = alerts.find(a => a.id === alertId) || alerts[0];

      const authorAEl = connectModal.querySelector('#connect-author-a');
      const authorBEl = connectModal.querySelector('#connect-author-b');
      const proposalText = connectModal.querySelector('#connect-proposal-text');

      if (authorAEl) authorAEl.textContent = `${targetAlert.authorA} (${targetAlert.deptA})`;
      if (authorBEl) authorBEl.textContent = `${targetAlert.authorB} (${targetAlert.deptB})`;
      if (proposalText) {
        proposalText.value = `Subject: Research Synergy Opportunity - Discovered Algorithmic Overlap\n\nDear ${targetAlert.authorA} and ${targetAlert.authorB},\n\nThe University ResearchNexus Engine has identified a ${targetAlert.similarity}% computational methodology overlap between "${targetAlert.studyA}" and "${targetAlert.studyB}".\n\nWe propose an exploratory cross-departmental briefing to review unified solver kernels and discuss a joint multi-faculty grant application.\n\nInstitutional Registry Link: https://nexus.university.edu/ref/${targetAlert.id}`;
      }

      connectModal.classList.add('active');
    };

    // Send Collaboration Invitation
    const sendInviteBtn = document.getElementById('btn-send-invitation');
    if (sendInviteBtn) {
      sendInviteBtn.addEventListener('click', () => {
        showToast('Synergy invitation dispatched to respective department chairs!', 'green');
        if (connectModal) connectModal.classList.remove('active');
      });
    }

    // Run New Analysis Trigger
    const runAnalysisBtn = document.getElementById('btn-run-analysis');
    if (runAnalysisBtn) {
      runAnalysisBtn.addEventListener('click', async () => {
        if (!newAnalysisModal) return;
        newAnalysisModal.classList.add('active');

        const scanProgress = newAnalysisModal.querySelector('#scan-progress-bar');
        const scanStatus = newAnalysisModal.querySelector('#scan-status-text');

        if (scanStatus) scanStatus.textContent = 'Ingesting arXiv & Institutional Repositories (Multi-Modal Ingestion)...';
        if (scanProgress) scanProgress.style.width = '25%';

        setTimeout(() => {
          if (scanStatus) scanStatus.textContent = 'Extracting Knowledge Graph Triplets with AI Vector Embeddings...';
          if (scanProgress) scanProgress.style.width = '65%';
        }, 800);

        setTimeout(() => {
          if (scanStatus) scanStatus.textContent = 'Executing AlloyDB Hybrid Cosine & AST Structural Match...';
          if (scanProgress) scanProgress.style.width = '95%';
        }, 1500);

        setTimeout(async () => {
          await window.MockAPI.triggerNewAnalysis({});
          if (scanProgress) scanProgress.style.width = '100%';
          if (scanStatus) scanStatus.textContent = 'Analysis Complete: 3 New Redundancies Flagged!';
          showToast('Knowledge graph synced with 142 newly discovered triplets!', 'cyan');
          setTimeout(() => {
            newAnalysisModal.classList.remove('active');
          }, 700);
        }, 2200);
      });
    }
  }

  // 5. Redundancy Page Matrix Rendering Logic
  async function initRedundancyPage() {
    const matrixContainer = document.getElementById('matrix-heatmap-container');
    const alertsContainer = document.getElementById('redundancy-alerts-list');
    if (!matrixContainer || !alertsContainer) return;

    const data = await window.MockAPI.getRedundancyMatrix();
    const alerts = await window.MockAPI.getRedundancyAlerts();

    // Render Matrix Heatmap
    const depts = data.departments;
    const n = depts.length;

    let tableHtml = `
      <div style="display: grid; grid-template-columns: 140px repeat(${n}, 1fr); gap: 4px; min-width: 650px;">
        <div></div>
        ${depts.map(d => `<div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); text-align: center; padding-bottom: 8px; font-weight: 600;">${d}</div>`).join('')}
    `;

    for (let r = 0; r < n; r++) {
      tableHtml += `
        <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-dim); display: flex; align-items: center; justify-content: flex-end; padding-right: 12px; font-weight: 600;">
          ${depts[r]}
        </div>
      `;

      for (let c = 0; c < n; c++) {
        const cell = data.matrix[r][c];
        if (cell.score === null) {
          tableHtml += `<div style="background: rgba(255,255,255,0.02); border-radius: 6px; height: 58px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: var(--text-dim); font-family: var(--font-mono); border: 1px dashed rgba(255,255,255,0.06);">--</div>`;
        } else {
          let bgClass = 'heat-low';
          let borderCol = 'rgba(0, 250, 100, 0.2)';
          let textCol = 'var(--neon-green)';
          let bgRgba = 'rgba(0, 250, 100, 0.1)';

          if (cell.score > 70) {
            bgClass = 'heat-high';
            borderCol = 'rgba(138, 43, 226, 0.4)';
            textCol = 'var(--neon-violet-light)';
            bgRgba = 'rgba(138, 43, 226, 0.25)';
          } else if (cell.score > 25) {
            bgClass = 'heat-med';
            borderCol = 'rgba(0, 240, 255, 0.3)';
            textCol = 'var(--neon-cyan)';
            bgRgba = 'rgba(0, 240, 255, 0.12)';
          }

          tableHtml += `
            <div class="heatmap-cell" style="background: ${bgRgba}; border: 1px solid ${borderCol}; color: ${textCol}; height: 58px;" onclick="window.showToast('Matrix Intersection: ${depts[r]} &times; ${depts[c]} (${cell.score}% Overlap, ${cell.count} Studies)', 'cyan')">
              ${cell.score}%
              <div class="cell-tooltip">
                <strong style="color: #fff;">${depts[r]} &harr; ${depts[c]}</strong><br/>
                <span style="color: ${textCol}; font-weight: 700;">${cell.score}% Algorithmic Similarity</span><br/>
                ${cell.count} Overlapping Studies Flagged
              </div>
            </div>
          `;
        }
      }
    }
    tableHtml += `</div>`;
    matrixContainer.innerHTML = tableHtml;

    // Render Alert Cards
    alertsContainer.innerHTML = alerts.map(alert => `
      <div class="glass-card" style="padding: 20px; border-top: 3px solid ${alert.similarity > 90 ? 'var(--neon-violet)' : 'var(--neon-cyan)'};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <span class="badge ${alert.similarity > 90 ? 'badge-violet' : 'badge-cyan'}">
            <i class="fa-solid fa-triangle-exclamation"></i> ${alert.similarity}% SIMILARITY DETECTED
          </span>
          <span class="font-mono" style="font-size: 11px; color: var(--text-dim);">${alert.id}</span>
        </div>
        
        <h4 style="font-size: 16px; margin-bottom: 6px;">${alert.status.replace(/_/g, ' ')}</h4>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;">
          ${alert.description}
        </p>

        <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; font-size: 12px; font-family: var(--font-mono);">
          <div style="display: flex; justify-content: space-between; color: var(--text-dim); margin-bottom: 4px;">
            <span>${alert.deptA} (${alert.authorA})</span>
            <span style="color: var(--neon-cyan);">&harr;</span>
            <span>${alert.deptB} (${alert.authorB})</span>
          </div>
          <div style="color: var(--alert-amber); font-size: 11px;">
            <i class="fa-solid fa-piggy-bank"></i> Est. Duplicate Expenditure: ${alert.grantEstimatedWaste}
          </div>
        </div>

        <div style="height: 4px; width: 100%; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; margin-bottom: 16px;">
          <div style="height: 100%; width: ${alert.similarity}%; background: linear-gradient(90deg, var(--neon-cyan), var(--neon-violet)); box-shadow: 0 0 10px var(--neon-cyan);"></div>
        </div>

        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="btn btn-primary" style="padding: 8px 14px; font-size: 12px;" onclick="window.openConnectModal('${alert.id}')">
            <i class="fa-solid fa-user-group"></i> Connect Researchers
          </button>
          <button class="btn btn-ghost" style="padding: 8px 14px; font-size: 12px;" onclick="window.openASTComparison('${alert.id}')">
            <i class="fa-solid fa-code"></i> View AST Comparison
          </button>
        </div>
      </div>
    `).join('');
  }

  // 6. In-Page Research Document & PDF Upload Studio Controller
  function initUploadStudio() {
    // Universal Nav & FAB upload button handlers
    const navUploadBtn = document.getElementById('btnNavUpload');
    const fabUploadBtn = document.getElementById('fabUpload');
    const multiStageModalBtn = document.getElementById('btnTriggerMultiStageModal');

    const handleUploadClick = () => {
      const studioSection = document.getElementById('upload-studio');
      if (studioSection) {
        studioSection.scrollIntoView({ behavior: 'smooth' });
        const dropZone = document.getElementById('studioDropZone');
        if (dropZone) {
          dropZone.classList.add('drag-over');
          setTimeout(() => dropZone.classList.remove('drag-over'), 800);
        }
      } else if (window.AppMatcher) {
        window.AppMatcher.openModal();
      } else if (window.AppIngest) {
        window.AppIngest.openModal();
      } else {
        const modal = document.getElementById('matcherModal') || document.getElementById('ingestModal');
        if (modal) modal.classList.add('active');
      }
    };

    if (navUploadBtn) navUploadBtn.addEventListener('click', handleUploadClick);
    if (fabUploadBtn) fabUploadBtn.addEventListener('click', handleUploadClick);
    if (multiStageModalBtn) {
      multiStageModalBtn.addEventListener('click', () => {
        if (window.AppIngest) {
          window.AppIngest.openModal();
        } else {
          const ingestModal = document.getElementById('ingestModal');
          if (ingestModal) ingestModal.classList.add('active');
        }
      });
    }

    // Studio In-Page Drag & Drop and File Input Elements
    const dropZone = document.getElementById('studioDropZone');
    const fileInput = document.getElementById('studioFileInput');
    const fileInfo = document.getElementById('studioActiveFileInfo');
    const fileNameEl = document.getElementById('studioFileName');
    const fileSizeEl = document.getElementById('studioFileSize');
    const removeFileBtn = document.getElementById('btnRemoveFile');
    const textInput = document.getElementById('studioTextInput');
    const deptSelect = document.getElementById('studioDeptSelect');
    const executeBtn = document.getElementById('btnExecuteAnalysis');
    const sampleChips = document.querySelectorAll('.sample-chip');
    const pasteHelperBadge = document.getElementById('pasteHelperBadge');

    // State panels
    const idleState = document.getElementById('studioIdleState');
    const loadingState = document.getElementById('studioLoadingState');
    const activeResults = document.getElementById('studioActiveResults');
    const progressBar = document.getElementById('studioProgressBar');
    const stageText = document.getElementById('studioLoadingStageText');
    const resGenreBadge = document.getElementById('resGenreBadge');
    const resConfidence = document.getElementById('resConfidence');
    const resKernelsList = document.getElementById('resKernelsList');
    const resMatchesList = document.getElementById('resMatchesList');

    if (!dropZone || !executeBtn) return;

    let selectedFile = null;

    const samplePapersData = {
      bio: {
        title: 'stenotic_coronary_hemodynamics_3d.pdf',
        size: '3.4 MB',
        dept: 'bio',
        text: '3D finite-volume solver for incompressible Navier-Stokes with Casson non-Newtonian blood rheology in stenosed coronary bifurcations: \\tau = (\\sqrt{\\tau_0} + \\sqrt{\\mu_\\infty \\dot{\\gamma}})^2'
      },
      mech: {
        title: 'micro_turbine_polymer_coolant_solver.pdf',
        size: '2.8 MB',
        dept: 'mech',
        text: 'Navier-Stokes equation solver with shear-thinning Casson constitutive model for high-shear micro-nozzle injectors: \\sigma = (\\sqrt{\\sigma_y} + \\sqrt{\\mu_0 \\dot{\\gamma}})^2'
      },
      cs: {
        title: 'geometric_gnn_pde_surrogate_models.pdf',
        size: '4.1 MB',
        dept: 'cs',
        text: 'Message-passing Graph Neural Networks for parametric partial differential equation solving across discretized geometric manifolds with invariant Laplacian operators.'
      },
      physics: {
        title: 'cahn_hilliard_capillary_phase_field.pdf',
        size: '1.9 MB',
        dept: 'physics',
        text: 'Coupled Cahn-Hilliard and Navier-Stokes phase-field modeling of interfacial surface tension dynamics in micro-fluidic capillary channels.'
      }
    };

    function updateSelectedFileDisplay(name, sizeStr) {
      if (fileInfo && fileNameEl) {
        fileNameEl.textContent = name;
        if (fileSizeEl) fileSizeEl.textContent = `${sizeStr} • Ready for PyMuPDF Math Parsing`;
        fileInfo.style.display = 'flex';
        dropZone.style.display = 'none';
      }
    }

    function clearSelectedFile() {
      selectedFile = null;
      if (fileInput) fileInput.value = '';
      if (fileInfo) fileInfo.style.display = 'none';
      if (dropZone) dropZone.style.display = 'block';
      sampleChips.forEach(c => c.classList.remove('active'));
      if (pasteHelperBadge) pasteHelperBadge.textContent = '';
    }

    // Dropzone click & drag
    dropZone.addEventListener('click', () => {
      if (fileInput) fileInput.click();
    });

    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          selectedFile = e.target.files[0];
          const sizeKb = (selectedFile.size / 1024).toFixed(1);
          const sizeStr = selectedFile.size > 1048576 
            ? `${(selectedFile.size / 1048576).toFixed(1)} MB` 
            : `${sizeKb} KB`;
          updateSelectedFileDisplay(selectedFile.name, sizeStr);
          showToast(`Attached: ${selectedFile.name}`, 'cyan');
        }
      });
    }

    if (removeFileBtn) {
      removeFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearSelectedFile();
      });
    }

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
        selectedFile = e.dataTransfer.files[0];
        const sizeStr = selectedFile.size > 1048576 
          ? `${(selectedFile.size / 1048576).toFixed(1)} MB` 
          : `${(selectedFile.size / 1024).toFixed(1)} KB`;
        updateSelectedFileDisplay(selectedFile.name, sizeStr);
        showToast(`Document uploaded: ${selectedFile.name}`, 'cyan');
      }
    });

    // Sample chips
    sampleChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const sampleKey = chip.getAttribute('data-sample');
        const data = samplePapersData[sampleKey];
        if (!data) return;

        sampleChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        selectedFile = { name: data.title, size: 2500000 };
        updateSelectedFileDisplay(data.title, data.size);
        if (textInput) textInput.value = data.text;
        if (deptSelect) deptSelect.value = data.dept;
        if (pasteHelperBadge) pasteHelperBadge.textContent = `[Loaded ${data.dept.toUpperCase()} Preset]`;

        showToast(`Loaded sample research document: ${data.title}`, 'violet');
      });
    });

    // Execute Analysis & Ingestion Action
    executeBtn.addEventListener('click', async () => {
      const rawText = textInput ? textInput.value.trim() : '';
      if (!selectedFile && !rawText) {
        showToast('Please upload a PDF document, select a sample paper, or paste equations.', 'warning');
        return;
      }

      // UI states
      if (idleState) idleState.style.display = 'none';
      if (activeResults) activeResults.style.display = 'none';
      if (loadingState) loadingState.style.display = 'block';

      const deptVal = deptSelect ? deptSelect.value : 'all';

      // Simulation steps for realistic pipeline feedback
      const steps = [
        { text: '1/4: Parsing PDF & LaTeX equations via PyMuPDF...', pct: 25 },
        { text: '2/4: Extracting Python / CUDA AST compiler kernels...', pct: 50 },
        { text: '3/4: Generating 768-d pgvector embeddings with Gemini 1.5 Pro...', pct: 75 },
        { text: '4/4: Performing AlloyDB HNSW nearest-neighbor cross-search...', pct: 100 }
      ];

      for (const step of steps) {
        if (stageText) stageText.textContent = step.text;
        if (progressBar) progressBar.style.width = `${step.pct}%`;
        await new Promise(r => setTimeout(r, 400));
      }

      try {
        const result = await window.MockAPI.analyzeAndMatchPaper(selectedFile, rawText, deptVal);
        
        if (loadingState) loadingState.style.display = 'none';
        if (activeResults) activeResults.style.display = 'block';

        const doc = result.analyzedDocument;
        if (resGenreBadge) resGenreBadge.textContent = doc.detectedGenre;
        if (resConfidence) resConfidence.textContent = `${Math.round(doc.genreConfidence * 100)}% Confidence`;

        if (resKernelsList) {
          resKernelsList.innerHTML = (doc.keyMathematicalKernels || []).map(k => `
            <span class="badge badge-cyan" style="font-size: 11px;">
              <i class="fa-solid fa-microchip" style="font-size: 10px;"></i> ${k}
            </span>
          `).join('');
        }

        if (resMatchesList) {
          resMatchesList.innerHTML = (result.topMatches || []).map(match => {
            const matchPct = Math.round(match.similarityScore * 100);
            return `
              <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 14px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                  <div>
                    <span class="badge ${match.similarityScore > 0.85 ? 'badge-violet' : 'badge-cyan'}" style="font-size: 11px; margin-right: 6px;">
                      <i class="fa-solid fa-bolt"></i> ${matchPct}% Relevance
                    </span>
                    <span style="font-size: 11px; color: var(--text-dim); font-family: var(--font-mono);">${match.department}</span>
                  </div>
                  <span class="badge badge-amber" style="font-size: 10px;">${match.genreOverlap}</span>
                </div>
                
                <div style="font-weight: 700; font-size: 14px; color: #fff; margin-bottom: 2px;">${match.title}</div>
                <div style="font-size: 11px; color: var(--neon-cyan); font-family: var(--font-mono); margin-bottom: 8px;">
                  <i class="fa-solid fa-user-astronaut"></i> Lead Author: ${match.author}
                </div>

                <!-- Deep Relevance Breakdown -->
                <div style="background: rgba(0, 240, 255, 0.05); border-left: 3px solid var(--neon-cyan); border-radius: 4px; padding: 8px 12px; margin-bottom: 8px;">
                  <div style="font-size: 10px; color: var(--neon-cyan); font-weight: 700; text-transform: uppercase;">
                    <i class="fa-solid fa-diagram-project"></i> Relevance Explanation:
                  </div>
                  <div style="font-size: 11px; color: #E2E8F0; line-height: 1.4;">${match.whyRelevant}</div>
                </div>

                <!-- Overlapping Equations -->
                ${match.equationsMatched && match.equationsMatched.length > 0 ? `
                  <div style="background: rgba(0, 0, 0, 0.3); border-radius: 6px; padding: 6px 10px; margin-bottom: 8px; font-family: var(--font-mono); font-size: 10px; color: var(--neon-green);">
                    <span style="color: var(--text-muted);"><i class="fa-solid fa-square-root-variable"></i> Equations: </span>${match.equationsMatched.join(' • ')}
                  </div>
                ` : ''}

                <div style="font-size: 11px; color: var(--text-muted); line-height: 1.4; margin-bottom: 10px;">
                  <strong style="color: var(--neon-amber);"><i class="fa-solid fa-lightbulb"></i> Recommended Action:</strong> ${match.recommendedCollaboration}
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                  <a href="dashboard.html?focus=${match.id}" class="btn btn-ghost" style="padding: 5px 12px; font-size: 11px;">
                    <i class="fa-solid fa-crosshairs"></i> Focus in Graph
                  </a>
                  <button class="btn btn-primary" style="padding: 5px 14px; font-size: 11px;" onclick="window.ConnectResearchers('${match.id}', '${match.title.replace(/'/g, "\\'")}', '${match.author}')">
                    <i class="fa-solid fa-envelope-open-text"></i> Connect
                  </button>
                </div>
              </div>
            `;
          }).join('');
        }

        showToast('Document analysis complete! Identified relevant faculty and equations.', 'green');
      } catch (err) {
        console.error('[UploadStudio] Ingestion error:', err);
        if (loadingState) loadingState.style.display = 'none';
        if (idleState) idleState.style.display = 'block';
        showToast('Failed to process document: ' + err.message, 'warning');
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  window.escapeHtml = escapeHtml;

  // Global Keyboard Accessibility (Esc to close modals)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
    }
  });

  // Document Ready Initialization
  document.addEventListener('DOMContentLoaded', () => {
    initGlobalSearch();
    initAuthInteractions();
    initModals();
    initRedundancyPage();
    initUploadStudio();

    // Check URL parameters for focused node
    const urlParams = new URLSearchParams(window.location.search);
    const focusNodeId = urlParams.get('focus');
    if (focusNodeId && window.GraphEngine) {
      setTimeout(() => window.GraphEngine.focusNode(focusNodeId), 300);
    }
  });
})();


