/**
 * ResearchNexus - Cytoscape.js Knowledge Graph Controller
 * Handles interactive WebGL canvas rendering, node clustering, filtering, and inspection drawer syncing
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

  // 1. Initialize Cytoscape Instance
  async function initCytoscapeGraph() {
    const container = document.getElementById('cy');
    if (!container || typeof cytoscape === 'undefined') return;

    // Fetch initial graph payload from decoupled MockAPI
    const graphData = await window.MockAPI.getGraphData(currentFilters);

    cy = cytoscape({
      container: container,
      elements: [...graphData.nodes, ...graphData.edges],
      boxSelectionEnabled: false,
      autounselectify: false,
      style: [
        // Core Node Styling
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#E2E8F0',
            'font-family': 'Inter, sans-serif',
            'font-size': '11px',
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'text-background-opacity': 0.8,
            'text-background-color': '#0B0F19',
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'text-border-opacity': 0.4,
            'text-border-width': 1,
            'text-border-color': '#2A364F',
            'background-color': '#00F0FF',
            'width': 28,
            'height': 28,
            'border-width': 2,
            'border-color': '#FFFFFF',
            'border-opacity': 0.9,
            'overlay-padding': '6px',
            'transition-property': 'background-color, line-color, target-arrow-color, opacity, border-width',
            'transition-duration': '0.25s'
          }
        },
        // Department Coloring
        { selector: 'node[dept = "cs"]', style: { 'background-color': '#00F0FF', 'border-color': '#7df4ff' } },
        { selector: 'node[dept = "bio"]', style: { 'background-color': '#8A2BE2', 'border-color': '#dcb8ff' } },
        { selector: 'node[dept = "mech"]', style: { 'background-color': '#FFB300', 'border-color': '#ffe082' } },
        { selector: 'node[dept = "physics"]', style: { 'background-color': '#00FA64', 'border-color': '#b9f6ca' } },
        { selector: 'node[dept = "chem"]', style: { 'background-color': '#3B82F6', 'border-color': '#93c5fd' } },
        { selector: 'node[dept = "mat"]', style: { 'background-color': '#EC4899', 'border-color': '#fbcfe8' } },

        // Entity Shape Differentiation
        { selector: 'node[type = "paper"]', style: { 'shape': 'ellipse', 'width': 30, 'height': 30 } },
        { selector: 'node[type = "dataset"]', style: { 'shape': 'round-rectangle', 'width': 32, 'height': 24 } },
        { selector: 'node[type = "algorithm"]', style: { 'shape': 'diamond', 'width': 32, 'height': 32 } },
        { selector: 'node[type = "author"]', style: { 'shape': 'hexagon', 'width': 34, 'height': 34 } },
        { selector: 'node[type = "code"]', style: { 'shape': 'barrel', 'width': 30, 'height': 26 } },

        // Edge Styling
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': 'rgba(255, 255, 255, 0.15)',
            'curve-style': 'bezier',
            'target-arrow-shape': 'triangle',
            'target-arrow-color': 'rgba(255, 255, 255, 0.25)',
            'arrow-scale': 0.8,
            'label': 'data(label)',
            'font-family': 'JetBrains Mono, monospace',
            'font-size': '9px',
            'color': '#94A3B8',
            'text-background-opacity': 0.85,
            'text-background-color': '#070A11',
            'text-background-padding': '2px',
            'text-rotation': 'autorotate'
          }
        },
        {
          selector: 'edge[type = "redundancy"]',
          style: {
            'line-color': '#00F0FF',
            'line-style': 'dashed',
            'line-dash-pattern': [6, 3],
            'width': 2.5,
            'target-arrow-color': '#00F0FF',
            'color': '#00F0FF'
          }
        },
        {
          selector: 'edge[type = "citation"]',
          style: {
            'line-color': '#8A2BE2',
            'width': 1.8,
            'target-arrow-color': '#8A2BE2',
            'color': '#dcb8ff'
          }
        },

        // Interactive Focus / Selection States
        {
          selector: '.highlighted',
          style: {
            'border-width': 4,
            'border-color': '#00F0FF',
            'opacity': 1,
            'z-index': 999
          }
        },
        {
          selector: '.dimmed',
          style: {
            'opacity': 0.15
          }
        }
      ],
      layout: {
        name: 'cose',
        idealEdgeLength: 120,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        padding: 50,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: 400000,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
      }
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

    // Click on canvas background to reset highlights
    cy.on('tap', function (evt) {
      if (evt.target === cy) {
        cy.elements().removeClass('highlighted dimmed');
        closeInspectionPanel();
      }
    });

    // Setup Graph Control UI buttons
    setupGraphControls();
  }

  // 3. Right Inspection Slide-Out Panel Logic
  function openInspectionPanel(data) {
    const drawer = document.getElementById('inspection-drawer');
    if (!drawer) return;

    // Fill Title and Header
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

    if (titleEl) titleEl.textContent = data.name || 'Untitled Entity';
    if (authorEl) authorEl.textContent = data.author || 'Institutional Contributor';
    if (doiEl) doiEl.textContent = data.doi || 'DOI: 10.1145/nexus.2024.01';
    if (abstractEl) abstractEl.textContent = data.abstract || 'No abstract preview available for this node.';
    
    if (deptEl) {
      deptEl.textContent = data.dept ? data.dept.toUpperCase() : 'DEPT';
      deptEl.style.color = departmentColorMap[data.dept] || '#00F0FF';
      deptEl.style.borderColor = departmentColorMap[data.dept] || '#00F0FF';
    }

    if (typeEl) {
      typeEl.textContent = data.type ? data.type.toUpperCase() : 'ENTITY';
    }

    if (repoLinkEl) {
      repoLinkEl.textContent = data.repo ? `https://${data.repo}` : 'Internal Nexus Data';
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
      astMatchLabel.textContent = `${scoreVal}% Ground-Truth Match`;
    }

    if (codeSnippetEl) {
      if (data.mathAstCode) {
        codeSnippetEl.parentElement.style.display = 'block';
        codeSnippetEl.textContent = data.mathAstCode;
      } else {
        codeSnippetEl.parentElement.style.display = 'none';
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

    if (zoomInBtn) zoomInBtn.addEventListener('click', () => cy && cy.zoom(cy.zoom() * 1.25));
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => cy && cy.zoom(cy.zoom() * 0.8));
    if (fitBtn) fitBtn.addEventListener('click', () => cy && cy.fit(undefined, 40));
    
    if (resetLayoutBtn) {
      resetLayoutBtn.addEventListener('click', () => {
        if (!cy) return;
        const layout = cy.layout({ name: 'cose', animate: true, animationDuration: 600 });
        layout.run();
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (!cy) return;
        const png64 = cy.png({ full: true, bg: '#0B0F19', scale: 2 });
        const downloadLink = document.createElement('a');
        downloadLink.href = png64;
        downloadLink.download = `research-nexus-graph-${Date.now()}.png`;
        downloadLink.click();
        if (window.showToast) window.showToast('Graph visualization exported as high-res PNG');
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
    cy.layout({ name: 'cose', animate: true, animationDuration: 500 }).run();
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
        cy.center(target);
        cy.zoom(1.4);
        openInspectionPanel(target.data());
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('cy')) {
      initCytoscapeGraph();
    }
  });
})();
