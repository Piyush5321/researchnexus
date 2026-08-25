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

  // 3. Auth Page Tab Switcher & Dynamic Dropdown
  function initAuthInteractions() {
    const roleTabs = document.querySelectorAll('.auth-role-tab');
    const authTypeTabs = document.querySelectorAll('.auth-type-tab');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const ssoBtn = document.getElementById('btn-sso-login');

    if (roleTabs.length > 0) {
      roleTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          roleTabs.forEach(t => t.classList.remove('tab-active'));
          tab.classList.add('tab-active');
          const role = tab.getAttribute('data-role');
          showToast(`Authenticated persona switched to: ${role.toUpperCase()}`, 'cyan');
        });
      });
    }

    if (authTypeTabs.length > 0) {
      authTypeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          authTypeTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          const isSignUp = tab.getAttribute('data-mode') === 'signup';
          if (authSubmitBtn) {
            authSubmitBtn.textContent = isSignUp ? 'Create University Account' : 'Sign in with SSO Credentials';
          }
        });
      });
    }

    if (authSubmitBtn) {
      authSubmitBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Verifying institutional credentials with campus IdP...', 'violet');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1200);
      });
    }

    if (ssoBtn) {
      ssoBtn.addEventListener('click', () => {
        showToast('Redirecting to University SAML 2.0 Identity Provider...', 'cyan');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1200);
      });
    }
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
      if (paneATitle) paneATitle.textContent = targetAlert.astDiff?.titleA || 'Lab A';
      if (paneBTitle) paneBTitle.textContent = targetAlert.astDiff?.titleB || 'Lab B';

      if (paneACode && targetAlert.astDiff?.codeA) {
        paneACode.innerHTML = targetAlert.astDiff.codeA.map((line, i) => `
          <div class="ast-line ${i >= 3 && i <= 6 ? 'ast-line-match' : ''}">
            <span style="color: var(--text-dim); margin-right: 8px; user-select: none;">${i + 1}</span>${escapeHtml(line)}
          </div>
        `).join('');
      }

      if (paneBCode && targetAlert.astDiff?.codeB) {
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

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Document Ready Initialization
  document.addEventListener('DOMContentLoaded', () => {
    initGlobalSearch();
    initAuthInteractions();
    initModals();
    initRedundancyPage();

    // Check URL parameters for focused node
    const urlParams = new URLSearchParams(window.location.search);
    const focusNodeId = urlParams.get('focus');
    if (focusNodeId && window.GraphEngine) {
      setTimeout(() => window.GraphEngine.focusNode(focusNodeId), 300);
    }
  });
})();
