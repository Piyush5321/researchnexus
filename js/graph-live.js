/**
 * ResearchNexus - Cytoscape Knowledge Graph Live Controller
 * Handles graph initialization, layout physics, dynamic filtering,
 * 1st-degree connection isolation, and inspection drawer syncing.
 */

class GraphLiveController {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.cy = null;
    this.allElements = { nodes: [], edges: [] };
    this.activeFilters = {
      departments: new Set(['cs', 'bio', 'mech', 'physics', 'chem', 'mat']),
      types: new Set(['paper', 'dataset', 'algorithm', 'author', 'code']),
      minSimilarity: 0.5,
      searchQuery: ''
    };
    this.selectedNodeId = null;
  }

  async init() {
    if (!this.container || typeof cytoscape === 'undefined') {
      console.warn('[GraphLive] Cytoscape or container not found.');
      return;
    }

    try {
      // Fetch initial data
      const data = await window.MockAPI.getGraphElements();
      this.allElements = data;

      this.cy = cytoscape({
        container: this.container,
        elements: [
          ...data.nodes.map(n => ({ group: 'nodes', data: n.data })),
          ...data.edges.map(e => ({ group: 'edges', data: e.data }))
        ],
        style: this.getGraphStyles(),
        layout: {
          name: 'cose',
          animate: true,
          animationDuration: 800,
          refresh: 20,
          fit: true,
          padding: 50,
          randomize: false,
          nodeRepulsion: 8000,
          idealEdgeLength: 120,
          edgeElasticity: 100,
          gravity: 80,
          numIter: 1000
        },
        minZoom: 0.2,
        maxZoom: 3.0,
        wheelSensitivity: 0.2
      });

      this.bindEvents();
      console.log('[GraphLive] Initialized successfully with', data.nodes.length, 'nodes');
    } catch (err) {
      console.error('[GraphLive] Initialization failed:', err);
    }
  }

  getGraphStyles() {
    return [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'color': '#E2E8F0',
          'font-size': '11px',
          'font-family': 'JetBrains Mono, monospace',
          'text-valign': 'bottom',
          'text-margin-y': 6,
          'background-color': '#00F0FF',
          'width': 34,
          'height': 34,
          'border-width': 2,
          'border-color': '#ffffff',
          'border-opacity': 0.4,
          'transition-property': 'background-color, line-color, target-arrow-color, opacity, width, height',
          'transition-duration': '0.25s'
        }
      },
      // Department Colors
      { selector: 'node[dept = "cs"]', style: { 'background-color': '#00F0FF', 'border-color': '#00F0FF' } },
      { selector: 'node[dept = "bio"]', style: { 'background-color': '#8A2BE2', 'border-color': '#8A2BE2' } },
      { selector: 'node[dept = "mech"]', style: { 'background-color': '#FFB300', 'border-color': '#FFB300' } },
      { selector: 'node[dept = "physics"]', style: { 'background-color': '#00FA64', 'border-color': '#00FA64' } },
      { selector: 'node[dept = "chem"]', style: { 'background-color': '#3B82F6', 'border-color': '#3B82F6' } },
      { selector: 'node[dept = "mat"]', style: { 'background-color': '#EC4899', 'border-color': '#EC4899' } },
      
      // Node shapes by entity type
      { selector: 'node[type = "paper"]', style: { 'shape': 'ellipse', 'width': 36, 'height': 36 } },
      { selector: 'node[type = "dataset"]', style: { 'shape': 'round-rectangle', 'width': 32, 'height': 32 } },
      { selector: 'node[type = "algorithm"]', style: { 'shape': 'diamond', 'width': 36, 'height': 36 } },
      { selector: 'node[type = "author"]', style: { 'shape': 'hexagon', 'width': 38, 'height': 38 } },
      { selector: 'node[type = "code"]', style: { 'shape': 'tag', 'width': 30, 'height': 30 } },

      // Highlight / Selected
      {
        selector: 'node.highlighted',
        style: {
          'border-width': 4,
          'border-color': '#FFFFFF',
          'border-opacity': 1,
          'shadow-blur': 25,
          'shadow-color': '#00F0FF',
          'shadow-opacity': 0.9,
          'z-index': 999
        }
      },
      {
        selector: 'node.dimmed',
        style: {
          'opacity': 0.15
        }
      },
      // Edges
      {
        selector: 'edge',
        style: {
          'width': 'mapData(weight, 0.5, 1.0, 1.5, 4.5)',
          'line-color': 'rgba(255, 255, 255, 0.2)',
          'curve-style': 'bezier',
          'target-arrow-shape': 'triangle',
          'target-arrow-color': 'rgba(255, 255, 255, 0.3)',
          'arrow-scale': 0.8,
          'transition-property': 'line-color, opacity, width',
          'transition-duration': '0.25s'
        }
      },
      // Cross-department duplicate edge (Glowing Redundancy Line)
      {
        selector: 'edge[relation = "POTENTIAL_DUPLICATE"]',
        style: {
          'line-color': '#FF0055',
          'line-style': 'dashed',
          'target-arrow-color': '#FF0055',
          'width': 3.5,
          'opacity': 0.9
        }
      },
      {
        selector: 'edge.highlighted',
        style: {
          'line-color': '#00F0FF',
          'target-arrow-color': '#00F0FF',
          'opacity': 1,
          'width': 4,
          'z-index': 999
        }
      },
      {
        selector: 'edge.dimmed',
        style: {
          'opacity': 0.08
        }
      }
    ];
  }

  bindEvents() {
    if (!this.cy) return;

    // Node click -> Isolate 1st degree & populate drawer
    this.cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      this.selectNode(node);
    });

    // Canvas background click -> Reset highlight
    this.cy.on('tap', (evt) => {
      if (evt.target === this.cy) {
        this.resetSelection();
      }
    });

    // Hover tooltip effects
    this.cy.on('mouseover', 'node', (evt) => {
      this.container.style.cursor = 'pointer';
    });
    this.cy.on('mouseout', 'node', () => {
      this.container.style.cursor = 'default';
    });
  }

  selectNode(node) {
    if (!this.cy) return;
    this.selectedNodeId = node.id();

    // 1st-degree neighborhood isolation
    const neighborhood = node.closedNeighborhood();
    this.cy.elements().removeClass('highlighted').addClass('dimmed');
    neighborhood.removeClass('dimmed').addClass('highlighted');

    // Sync inspection slide-out panel
    this.syncInspectorDrawer(node.data());
  }

  focusNodeById(nodeId) {
    if (!this.cy) return;
    const node = this.cy.getElementById(nodeId);
    if (node && node.length > 0) {
      this.selectNode(node);
      this.cy.animate({
        center: { eles: node },
        zoom: 1.5,
        duration: 600
      });
    }
  }

  resetSelection() {
    if (!this.cy) return;
    this.selectedNodeId = null;
    this.cy.elements().removeClass('highlighted').removeClass('dimmed');
    this.closeInspectorDrawer();
  }

  syncInspectorDrawer(nodeData) {
    const drawer = document.getElementById('inspectorDrawer');
    if (!drawer) return;

    drawer.classList.add('open');

    // Populate data fields
    const titleEl = document.getElementById('inspectorTitle');
    const deptEl = document.getElementById('inspectorDept');
    const authorEl = document.getElementById('inspectorAuthor');
    const typeEl = document.getElementById('inspectorType');
    const astEl = document.getElementById('inspectorAstMatch');
    const abstractEl = document.getElementById('inspectorAbstract');
    const codeSnippetEl = document.getElementById('inspectorCodeSnippet');
    const matchBarEl = document.getElementById('inspectorMatchBar');

    if (titleEl) titleEl.textContent = nodeData.name || nodeData.label || 'Research Entity';
    if (deptEl) deptEl.textContent = (nodeData.dept || '').toUpperCase();
    if (authorEl) authorEl.textContent = nodeData.author || 'Institutional Faculty';
    if (typeEl) typeEl.textContent = (nodeData.type || 'paper').toUpperCase();
    if (astEl) astEl.textContent = nodeData.astMatch || 'AST Align: 88%';
    if (abstractEl) abstractEl.textContent = nodeData.abstract || 'No abstract indexed.';

    if (matchBarEl) {
      const matchPct = parseInt(nodeData.astMatch) || Math.round((nodeData.similarity || 0.85) * 100);
      matchBarEl.style.width = `${matchPct}%`;
      const scoreTxt = document.getElementById('inspectorScoreText');
      if (scoreTxt) scoreTxt.textContent = `${matchPct}% AST Verification Match`;
    }

    if (codeSnippetEl) {
      codeSnippetEl.textContent = nodeData.mathAstCode || '# Mathematical kernel AST extracted from repository\ndef kernel_computation(x, y):\n    return np.dot(x, y)';
    }
  }

  closeInspectorDrawer() {
    const drawer = document.getElementById('inspectorDrawer');
    if (drawer) drawer.classList.remove('open');
  }

  // Filter application
  applyFilters(newFilters = {}) {
    this.activeFilters = { ...this.activeFilters, ...newFilters };
    if (!this.cy) return;

    this.cy.batch(() => {
      this.cy.nodes().forEach(node => {
        const d = node.data();
        const deptMatch = this.activeFilters.departments.has(d.dept);
        const typeMatch = this.activeFilters.types.has(d.type);
        const simMatch = (d.similarity || 1.0) >= this.activeFilters.minSimilarity;
        const searchMatch = !this.activeFilters.searchQuery || 
          (d.name && d.name.toLowerCase().includes(this.activeFilters.searchQuery)) ||
          (d.author && d.author.toLowerCase().includes(this.activeFilters.searchQuery));

        if (deptMatch && typeMatch && simMatch && searchMatch) {
          node.show();
        } else {
          node.hide();
        }
      });
    });
  }

  // Canvas Actions
  zoomIn() { if (this.cy) this.cy.zoom(this.cy.zoom() * 1.25); }
  zoomOut() { if (this.cy) this.cy.zoom(this.cy.zoom() * 0.8); }
  fitToScreen() { if (this.cy) this.cy.fit(50); }
  reLayout(layoutName = 'cose') {
    if (!this.cy) return;
    this.cy.layout({ name: layoutName, animate: true, duration: 600 }).run();
  }
}

// Global initialization
window.GraphLiveController = GraphLiveController;
export default GraphLiveController;
