/**
 * ResearchNexus - Cytoscape.js Knowledge Graph Controller
 * Handles interactive WebGL canvas rendering, luminous node styling, physics clustering,
 * filtering, live graph synchronization, and inspection drawer syncing.
 */

(function () {
  'use strict';

  let cy = null;
  let currentFilters = {
    selectedDepts: ['cs', 'bio', 'mech', 'physics', 'chem', 'mat'],
    selectedTypes: ['paper', 'dataset', 'algorithm', 'author', 'code'],
    similarityThreshold: 0.50
  };

  const departmentColorMap = {
    cs: '#00F0FF',
    bio: '#8A2BE2',
    mech: '#FFB300',
    physics: '#00FA64',
    chem: '#3B82F6',
    mat: '#EC4899'
  };

  const departmentNames = {
    cs: 'Computer Science',
    bio: 'Biomedical Eng',
    mech: 'Mechanical Eng',
    physics: 'Applied Physics',
    chem: 'Chemistry & Nano',
    mat: 'Materials Science'
  };

  // 1. Initialize Cytoscape Instance
  async function initCytoscapeGraph() {
    const container = document.getElementById('cy');
    if (!container || typeof cytoscape === 'undefined') return;

    // Fetch initial graph payload
    const graphData = await window.MockAPI.getGraphData(currentFilters);

    cy = cytoscape({
      container: container,
      elements: [...graphData.nodes, ...graphData.edges],
      boxSelectionEnabled: false,
      autounselectify: false,
      minZoom: 0.2,
      maxZoom: 3.5,
      wheelSensitivity: 0.25,
      style: [
        // Core Node Styling
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#F1F5F9',
            'font-family': 'JetBrains Mono, monospace',
            'font-size': '11px',
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': 7,
            'text-background-opacity': 0.9,
            'text-background-color': '#070A11',
            'text-background-padding': '4px',
            'text-background-shape': 'roundrectangle',
            'text-border-opacity': 0.7,
            'text-border-width': 1,
            'text-border-color': '#1E293B',
            'background-color': '#00F0FF',
            'width': 34,
            'height': 34,
            'border-width': 2.5,
            'border-color': '#FFFFFF',
            'border-opacity': 0.85,
            'overlay-padding': '8px',
            'transition-property': 'background-color, line-color, target-arrow-color, opacity, border-width, width, height',
            'transition-duration': '0.3s'
          }
        },
        // Department Coloring & Glow Effects
        { selector: 'node[dept = "cs"]', style: { 'background-color': '#00F0FF', 'border-color': '#7DF4FF', 'text-border-color': 'rgba(0, 240, 255, 0.4)' } },
        { selector: 'node[dept = "bio"]', style: { 'background-color': '#8A2BE2', 'border-color': '#DCB8FF', 'text-border-color': 'rgba(138, 43, 226, 0.4)' } },
        { selector: 'node[dept = "mech"]', style: { 'background-color': '#FFB300', 'border-color': '#FFE082', 'text-border-color': 'rgba(255, 179, 0, 0.4)' } },
        { selector: 'node[dept = "physics"]', style: { 'background-color': '#00FA64', 'border-color': '#B9F6CA', 'text-border-color': 'rgba(0, 250, 100, 0.4)' } },
        { selector: 'node[dept = "chem"]', style: { 'background-color': '#3B82F6', 'border-color': '#93C5FD', 'text-border-color': 'rgba(59, 130, 246, 0.4)' } },
        { selector: 'node[dept = "mat"]', style: { 'background-color': '#EC4899', 'border-color': '#FBCFE8', 'text-border-color': 'rgba(236, 72, 153, 0.4)' } },

        // Entity Shape Differentiation
        { selector: 'node[type = "paper"]', style: { 'shape': 'ellipse', 'width': 36, 'height': 36 } },
        { selector: 'node[type = "dataset"]', style: { 'shape': 'round-rectangle', 'width': 38, 'height': 28 } },
        { selector: 'node[type = "algorithm"]', style: { 'shape': 'diamond', 'width': 38, 'height': 38 } },
        { selector: 'node[type = "author"]', style: { 'shape': 'hexagon', 'width': 40, 'height': 40, 'border-width': 3 } },
        { selector: 'node[type = "code"]', style: { 'shape': 'barrel', 'width': 34, 'height': 30 } },

        // Edge Styling - Modern Cyberpunk Neon Curves
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': 'rgba(255, 255, 255, 0.22)',
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': 'rgba(255, 255, 255, 0.35)',
            'arrow-scale': 0.85,
            'label': 'data(label)',
            'font-family': 'JetBrains Mono, monospace',
            'font-size': '9px',
            'color': '#94A3B8',
            'text-background-opacity': 0.9,
            'text-background-color': '#070A11',
            'text-background-padding': '3px',
            'text-rotation': 'autorotate',
            'transition-property': 'line-color, target-arrow-color, width, opacity',
            'transition-duration': '0.3s'
          }
        },
        // Cross-Department Redundancy Overlap Edges (Glowing Electric Cyan/Red)
        {
          selector: 'edge[type = "redundancy"]',
          style: {
            'line-color': '#00F0FF',
            'line-style': 'dashed',
            'line-dash-pattern': [6, 4],
            'width': 3,
            'target-arrow-color': '#00F0FF',
            'color': '#00F0FF',
            'opacity': 0.95
          }
        },
        {
          selector: 'edge[type = "citation"]',
          style: {
            'line-color': '#8A2BE2',
            'width': 2.2,
            'target-arrow-color': '#8A2BE2',
            'color': '#DCB8FF'
          }
        },
        {
          selector: 'edge[type = "authorship"]',
          style: {
            'line-color': 'rgba(244, 114, 182, 0.5)',
            'width': 1.8,
            'target-arrow-color': '#F472B6',
            'color': '#F472B6'
          }
        },
        {
          selector: 'edge[type = "dataset"]',
          style: {
            'line-color': 'rgba(0, 250, 100, 0.5)',
            'width': 2,
            'target-arrow-color': '#00FA64',
            'color': '#00FA64'
          }
        },

        // Interactive Focus / Selection States
        {
          selector: '.highlighted',
          style: {
            'border-width': 4.5,
            'border-color': '#FFFFFF',
            'opacity': 1,
            'z-index': 999
          }
        },
        {
          selector: 'node.highlighted',
          style: {
            'width': 44,
            'height': 44
          }
        },
        {
          selector: 'edge.highlighted',
          style: {
            'width': 4,
            'line-color': '#00F0FF',
            'target-arrow-color': '#00F0FF',
            'opacity': 1
          }
        },
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.12
          }
        }
      ],
      layout: getLayoutConfig('cose')
    });

    // 2. Node Click Event - Focus & Inspect
    cy.on('tap', 'node', function (evt) {
      const node = evt.target;
      const nodeData = node.data();

      // Highlight connections
      cy.elements().removeClass('highlighted dimmed');
      const neighborhood = node.neighborhood().add(node);
      cy.elements().not(neighborhood).addClass('dimmed');
      neighborhood.addClass('highlighted');

      // Populate & Open Inspection Slide-Out Panel
      openInspectionPanel(nodeData);
    });

    // Hover Tooltip Simulation
    cy.on('mouseover', 'node', function (evt) {
      const node = evt.target;
      node.style('border-width', '4px');
      container.style.cursor = 'pointer';
    });

    cy.on('mouseout', 'node', function (evt) {
      const node = evt.target;
      if (!node.hasClass('highlighted')) {
        node.style('border-width', '2.5px');
      }
      container.style.cursor = 'default';
    });

    // Click on canvas background to reset highlights
    cy.on('tap', function (evt) {
      if (evt.target === cy) {
        cy.elements().removeClass('highlighted dimmed');
        closeInspectionPanel();
      }
    });

    // Setup Graph Control UI buttons & HUD counters
    setupGraphControls();
    updateGraphHudStats();
  }

  function getLayoutConfig(layoutName) {
    switch (layoutName) {
      case 'concentric':
        return {
          name: 'concentric',
          concentric: function (node) {
            return node.degree();
          },
          levelWidth: function () {
            return 2;
          },
          padding: 60,
          animate: true,
          animationDuration: 600
        };
      case 'circle':
        return {
          name: 'circle',
          padding: 60,
          animate: true,
          animationDuration: 600
        };
      case 'grid':
        return {
          name: 'grid',
          padding: 50,
          animate: true,
          animationDuration: 500
        };
      case 'cose':
      default:
        return {
          name: 'cose',
          idealEdgeLength: 130,
          nodeOverlap: 25,
          refresh: 20,
          fit: true,
          padding: 60,
          randomize: false,
          componentSpacing: 110,
          nodeRepulsion: 650000,
          edgeElasticity: 100,
          nestingFactor: 5,
          gravity: 70,
          numIter: 1000,
          initialTemp: 200,
          coolingFactor: 0.95,
          minTemp: 1.0,
          animate: true,
          animationDuration: 600
        };
    }
  }

  // Update live HUD stats on graph canvas
  function updateGraphHudStats() {
    if (!cy) return;
    const nodeCount = cy.nodes().length;
    const edgeCount = cy.edges().length;
    const redundancyCount = cy.edges('[type = "redundancy"]').length;

    const hudEl = document.getElementById('graph-live-hud-stats');
    if (hudEl) {
      hudEl.innerHTML = `
        <span class="badge badge-cyan"><i class="fa-solid fa-circle-nodes"></i> ${nodeCount} Nodes</span>
        <span class="badge badge-violet"><i class="fa-solid fa-arrows-split-up-and-left"></i> ${edgeCount} Edges</span>
        <span class="badge badge-amber"><i class="fa-solid fa-bolt"></i> ${redundancyCount} Redundancies</span>
      `;
    }
  }

  // 3. Right Inspection Slide-Out Panel Logic
  function openInspectionPanel(data) {
    const drawer = document.getElementById('inspection-drawer');
    if (!drawer) return;

    const titleEl = drawer.querySelector('#inspect-title');
    const authorEl = drawer.querySelector('#inspect-author');
    const deptEl = drawer.querySelector('#inspect-dept');
    const typeEl = drawer.querySelector('#inspect-type');
    const doiEl = drawer.querySelector('#inspect-doi');
    const abstractEl = drawer.querySelector('#inspect-abstract');
    const astMatchBar = drawer.querySelector('#inspect-ast-bar');
    const astMatchLabel = drawer.querySelector('#inspect-ast-label');
    const codeSnippetEl = drawer.querySelector('#inspect-code-snippet');
    const repoLinkEl = drawer.querySelector('#inspect-repo-link');
    const overlapsListEl = drawer.querySelector('#inspect-related-overlaps');

    if (titleEl) titleEl.textContent = data.name || 'Untitled Entity';
    if (authorEl) authorEl.textContent = data.author || 'Institutional Contributor';
    if (doiEl) doiEl.textContent = data.doi || 'DOI: 10.1145/nexus.2024.01';
    if (abstractEl) abstractEl.textContent = data.abstract || 'No abstract preview available for this node.';

    if (deptEl) {
      deptEl.textContent = departmentNames[data.dept] || (data.dept ? data.dept.toUpperCase() : 'DEPT');
      deptEl.style.color = departmentColorMap[data.dept] || '#00F0FF';
      deptEl.style.borderColor = departmentColorMap[data.dept] || '#00F0FF';
      deptEl.style.backgroundColor = `${departmentColorMap[data.dept] || '#00F0FF'}15`;
    }

    if (typeEl) {
      typeEl.textContent = data.type ? data.type.toUpperCase() : 'ENTITY';
    }

    if (repoLinkEl) {
      repoLinkEl.textContent = data.repo ? `https://${data.repo}` : 'Internal Nexus Data Vault';
      repoLinkEl.href = data.repo ? `https://${data.repo}` : '#';
    }

    // AST Match Score Progress Bar
    const scoreVal = Math.round((data.similarity || 0.85) * 100);
    if (astMatchBar) {
      astMatchBar.style.width = '0%';
      setTimeout(() => {
        astMatchBar.style.width = `${scoreVal}%`;
      }, 100);
    }
    if (astMatchLabel) {
      astMatchLabel.textContent = `${scoreVal}% Algorithmic Ground-Truth`;
    }

    if (codeSnippetEl) {
      if (data.mathAstCode) {
        codeSnippetEl.parentElement.style.display = 'block';
        codeSnippetEl.textContent = data.mathAstCode;
      } else {
        codeSnippetEl.parentElement.style.display = 'none';
      }
    }

    // Direct Related Overlaps in Graph
    if (overlapsListEl && cy) {
      const node = cy.getElementById(data.id);
      if (node && node.length > 0) {
        const neighbors = node.neighborhood('node');
        if (neighbors.length > 0) {
          overlapsListEl.innerHTML = neighbors.map(n => {
            const nData = n.data();
            return `
              <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 8px 12px; margin-bottom: 6px; cursor: pointer;" onclick="window.GraphEngine.focusNode('${nData.id}')">
                <div>
                  <div style="font-weight: 600; font-size: 12px; color: #fff;">${nData.name}</div>
                  <div style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">${nData.author || 'Author'} • ${nData.dept ? nData.dept.toUpperCase() : ''}</div>
                </div>
                <span class="badge badge-cyan" style="font-size: 10px;">Focus <i class="fa-solid fa-chevron-right" style="font-size: 8px;"></i></span>
              </div>
            `;
          }).join('');
        } else {
          overlapsListEl.innerHTML = '<div style="font-size: 11px; color: var(--text-dim);">No direct 1st-degree connected entities.</div>';
        }
      }
    }

    // Slide in
    drawer.classList.add('active');
  }

  function closeInspectionPanel() {
    const drawer = document.getElementById('inspection-drawer');
    if (drawer) {
      drawer.classList.remove('active');
    }
  }

  // 4. Graph Filters & Controls
  function setupGraphControls() {
    // Zoom Controls
    const zoomInBtn = document.getElementById('btn-zoom-in');
    const zoomOutBtn = document.getElementById('btn-zoom-out');
    const fitBtn = document.getElementById('btn-fit-view');
    const resetLayoutBtn = document.getElementById('btn-reset-layout');
    const exportBtn = document.getElementById('btn-export-graph');
    const closeDrawerBtn = document.getElementById('btn-close-drawer');
    const layoutSelector = document.getElementById('graph-layout-selector');

    if (zoomInBtn) zoomInBtn.addEventListener('click', () => cy && cy.zoom(cy.zoom() * 1.25));
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => cy && cy.zoom(cy.zoom() * 0.8));
    if (fitBtn) fitBtn.addEventListener('click', () => cy && cy.fit(undefined, 50));

    if (resetLayoutBtn) {
      resetLayoutBtn.addEventListener('click', () => {
        if (!cy) return;
        const layout = cy.layout(getLayoutConfig('cose'));
        layout.run();
        if (window.showToast) window.showToast('Physics layout recalibrated & centered', 'cyan');
      });
    }

    if (layoutSelector) {
      layoutSelector.addEventListener('change', (e) => {
        if (!cy) return;
        const chosen = e.target.value;
        const layout = cy.layout(getLayoutConfig(chosen));
        layout.run();
        if (window.showToast) window.showToast(`Switched layout mode: ${chosen.toUpperCase()}`, 'violet');
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (!cy) return;
        const png64 = cy.png({ full: true, bg: '#070A11', scale: 2 });
        const downloadLink = document.createElement('a');
        downloadLink.href = png64;
        downloadLink.download = `research-nexus-knowledge-graph-${Date.now()}.png`;
        downloadLink.click();
        if (window.showToast) window.showToast('High-resolution Knowledge Graph exported as PNG', 'green');
      });
    }

    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener('click', closeInspectionPanel);
    }

    // Similarity Range Slider Listener
    const thresholdSlider = document.getElementById('similarity-threshold-slider');
    const thresholdDisplay = document.getElementById('similarity-threshold-val');
    if (thresholdSlider) {
      thresholdSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        currentFilters.similarityThreshold = val;
        if (thresholdDisplay) {
          thresholdDisplay.textContent = `${Math.round(val * 100)}%`;
        }
        applyFilters();
      });
    }

    // Department Filter Checkboxes
    document.querySelectorAll('.filter-dept-checkbox').forEach((chk) => {
      chk.addEventListener('change', () => {
        const checked = Array.from(document.querySelectorAll('.filter-dept-checkbox:checked')).map(
          (c) => c.value
        );
        currentFilters.selectedDepts = checked;
        applyFilters();
      });
    });

    // Entity Type Filter Checkboxes
    document.querySelectorAll('.filter-type-checkbox').forEach((chk) => {
      chk.addEventListener('change', () => {
        const checked = Array.from(document.querySelectorAll('.filter-type-checkbox:checked')).map(
          (c) => c.value
        );
        currentFilters.selectedTypes = checked;
        applyFilters();
      });
    });
  }

  async function applyFilters() {
    if (!cy) return;
    const graphData = await window.MockAPI.getGraphData(currentFilters);
    cy.elements().remove();
    cy.add([...graphData.nodes, ...graphData.edges]);
    cy.layout(getLayoutConfig('cose')).run();
    updateGraphHudStats();
  }

  // Expose methods to global scope
  window.GraphEngine = {
    init: initCytoscapeGraph,
    openInspection: openInspectionPanel,
    closeInspection: closeInspectionPanel,
    focusNode: function (nodeId) {
      if (!cy) return;
      const target = cy.getElementById(nodeId);
      if (target && target.length > 0) {
        cy.elements().removeClass('highlighted dimmed');
        const neighborhood = target.neighborhood().add(target);
        cy.elements().not(neighborhood).addClass('dimmed');
        neighborhood.addClass('highlighted');
        cy.animate({
          center: { eles: target },
          zoom: 1.45,
          duration: 500
        });
        openInspectionPanel(target.data());
      }
    },
    insertLiveNode: function (nodeData, edgeData) {
      if (!cy) return;
      cy.add([
        { group: 'nodes', data: nodeData },
        { group: 'edges', data: edgeData }
      ]);
      const target = cy.getElementById(nodeData.id);
      if (target && target.length > 0) {
        cy.elements().removeClass('highlighted dimmed');
        const neighborhood = target.neighborhood().add(target);
        cy.elements().not(neighborhood).addClass('dimmed');
        neighborhood.addClass('highlighted');
        cy.animate({
          center: { eles: target },
          zoom: 1.4,
          duration: 600
        });
        openInspectionPanel(nodeData);
      }
      updateGraphHudStats();
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('cy')) {
      initCytoscapeGraph();
    }
  });
})();
