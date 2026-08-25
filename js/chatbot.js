/**
 * ResearchNexus - Intelligent AI Research Chatbot Controller
 * Provides real-time question answering regarding the university knowledge graph,
 * research papers, faculty, AST mathematical equations, and grant redundancy alerts.
 */

import MockAPI from './mockData.js';

export class ChatBotController {
  constructor() {
    this.isOpen = false;
    this.isFullscreen = false;
    this.isGenerating = false;
    this.history = [];
    this.storageKey = 'research_nexus_chat_history_v1';
  }

  async init() {
    this.loadHistory();
    this.injectChatbotUI();
    this.attachEvents();
    
    // Cache graph data
    try {
      if (MockAPI && typeof MockAPI.getGraphElements === 'function') {
        const elems = await MockAPI.getGraphElements();
        this.nodes = (elems.nodes || []).map(n => n.data || n);
        this.links = (elems.edges || []).map(e => e.data || e);
      }
    } catch (e) {
      console.warn('[ChatBot] Error loading graph cache:', e);
      this.nodes = [];
      this.links = [];
    }
    
    // If no history, add greeting message
    if (this.history.length === 0) {
      this.addAssistantMessage({
        text: `**Welcome to the ResearchNexus AI Assistant!** 🤖\n\nI am connected to the campus **Knowledge Graph**, indexing **12 research nodes**, **11 cross-disciplinary edges**, and **$4.2M in redundancy audits** across 6 departments.\n\nYou can ask me anything about:\n* 🧬 **Faculty & Papers** (e.g. *"Explain Dr. Rostova's hemodynamics model"*)\n* ⚡ **Redundancy & AST Overlaps** (e.g. *"Where is Navier-Stokes code duplicated?"*)\n* 💰 **Grant Waste** (e.g. *"How much funding was saved in Bio vs Mech?"*)\n* ⚛️ **Mathematical AST Kernels** (e.g. *"Show equations for randomized SVD vs tensor networks"*)\n* 🤝 **Collaborations** (e.g. *"Who should I partner with for Raman spectroscopy?"*)`,
        actions: [
          { label: '🔍 Find Navier-Stokes Overlaps', prompt: 'Where are the Navier-Stokes duplications?' },
          { label: '💰 Estimate Grant Waste', prompt: 'How much grant funding is duplicated across campus?' },
          { label: '🧬 Explain Dr. Rostova\'s Paper', prompt: 'Summarize Dr. Elena Rostova\'s research paper' }
        ]
      }, false);
    } else {
      this.renderAllMessages();
    }
  }

  loadHistory() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.history = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[ChatBot] Failed to load chat history:', e);
      this.history = [];
    }
  }

  saveHistory() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.history.slice(-30)));
    } catch (e) {
      console.warn('[ChatBot] Failed to save chat history:', e);
    }
  }

  injectChatbotUI() {
    // Avoid double injection
    if (document.getElementById('nexusChatbotContainer')) return;

    const container = document.createElement('div');
    container.id = 'nexusChatbotContainer';
    container.innerHTML = `
      <!-- Floating Launcher Pill -->
      <button id="nexusChatLauncher" class="nexus-chatbot-launcher" aria-label="Open Nexus AI Research Chatbot">
        <div class="launcher-icon-wrap">
          <i class="fa-solid fa-wand-magic-sparkles"></i>
          <span class="pulse-dot"></span>
        </div>
        <span>Ask Nexus AI</span>
      </button>

      <!-- Glassmorphic Chat Drawer -->
      <div id="nexusChatDrawer" class="nexus-chatbot-drawer" role="dialog" aria-label="Nexus AI Research Assistant" aria-hidden="true">
        <!-- Header -->
        <div class="chatbot-header">
          <div class="chatbot-header-left">
            <div class="chatbot-avatar">
              <i class="fa-solid fa-brain"></i>
            </div>
            <div>
              <div class="chatbot-title">Nexus AI Assistant</div>
              <div class="chatbot-subtitle">
                <i class="fa-solid fa-circle" style="font-size: 7px; color: var(--neon-green);"></i>
                Knowledge Graph Grounded
              </div>
            </div>
          </div>
          <div class="chatbot-header-actions">
            <button id="chatBtnClear" class="chatbot-action-btn" title="Clear Chat History">
              <i class="fa-solid fa-trash-can"></i>
            </button>
            <button id="chatBtnExpand" class="chatbot-action-btn" title="Toggle Expanded Mode">
              <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
            </button>
            <button id="chatBtnClose" class="chatbot-action-btn" title="Close Chat">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- Messages Area -->
        <div id="chatMessages" class="chatbot-messages-container"></div>

        <!-- Quick Prompt Chips Suggestions -->
        <div class="chatbot-suggestions-bar" id="chatSuggestionsBar">
          <button class="chat-prompt-chip" data-prompt="Where are Navier-Stokes overlaps?">💡 Navier-Stokes Overlap</button>
          <button class="chat-prompt-chip" data-prompt="How much funding is duplicated between Bio and Mech Eng?">💰 Bio vs Mech Funding</button>
          <button class="chat-prompt-chip" data-prompt="Explain Dr. Elena Rostova's paper and equations">🧬 Dr. Rostova Bio Model</button>
          <button class="chat-prompt-chip" data-prompt="Compare Physics vs CS randomized SVD algorithms">⚛️ Physics vs CS SVD</button>
          <button class="chat-prompt-chip" data-prompt="What is AST matching vs simple keyword search?">📐 How AST Matching Works</button>
          <button class="chat-prompt-chip" data-prompt="Who is researching Raman spectroscopy?">🔬 Raman Spectroscopy</button>
        </div>

        <!-- Input Bar -->
        <form id="chatInputForm" class="chatbot-input-bar">
          <input 
            type="text" 
            id="chatInputField" 
            class="chat-input-field" 
            placeholder="Ask anything about papers, equations, grants, or faculty..." 
            autocomplete="off" 
            maxlength="600"
          />
          <button type="submit" id="chatSendBtn" class="chat-send-btn" title="Send Message">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(container);
  }

  attachEvents() {
    const launcher = document.getElementById('nexusChatLauncher');
    const drawer = document.getElementById('nexusChatDrawer');
    const closeBtn = document.getElementById('chatBtnClose');
    const expandBtn = document.getElementById('chatBtnExpand');
    const clearBtn = document.getElementById('chatBtnClear');
    const form = document.getElementById('chatInputForm');
    const input = document.getElementById('chatInputField');
    const suggestionsBar = document.getElementById('chatSuggestionsBar');

    // Toggle open
    launcher?.addEventListener('click', () => this.toggleChat());
    closeBtn?.addEventListener('click', () => this.closeChat());

    // Expand / contract
    expandBtn?.addEventListener('click', () => {
      this.isFullscreen = !this.isFullscreen;
      drawer?.classList.toggle('fullscreen-chat', this.isFullscreen);
      expandBtn.innerHTML = this.isFullscreen 
        ? '<i class="fa-solid fa-down-left-and-up-right-to-center"></i>' 
        : '<i class="fa-solid fa-up-right-and-down-left-from-center"></i>';
    });

    // Clear history
    clearBtn?.addEventListener('click', () => {
      if (confirm('Clear chat conversation history?')) {
        this.history = [];
        this.saveHistory();
        const msgContainer = document.getElementById('chatMessages');
        if (msgContainer) msgContainer.innerHTML = '';
        this.init();
      }
    });

    // Submit user message
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = input?.value?.trim();
      if (!query || this.isGenerating) return;
      
      input.value = '';
      this.handleUserQuery(query);
    });

    // Prompt chips
    suggestionsBar?.addEventListener('click', (e) => {
      const chip = e.target.closest('.chat-prompt-chip');
      if (chip && chip.dataset.prompt) {
        const prompt = chip.dataset.prompt;
        this.handleUserQuery(prompt);
      }
    });

    // Esc key close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeChat();
      }
    });

    // Expose global nav trigger support
    document.querySelectorAll('[data-action="open-chatbot"], #btnNavChatbot').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openChat();
      });
    });
  }

  toggleChat() {
    if (this.isOpen) this.closeChat();
    else this.openChat();
  }

  openChat() {
    this.isOpen = true;
    const drawer = document.getElementById('nexusChatDrawer');
    drawer?.classList.add('active');
    drawer?.setAttribute('aria-hidden', 'false');
    
    // Focus input after opening
    setTimeout(() => {
      document.getElementById('chatInputField')?.focus();
      this.scrollToBottom();
    }, 150);
  }

  closeChat() {
    this.isOpen = false;
    const drawer = document.getElementById('nexusChatDrawer');
    drawer?.classList.remove('active');
    drawer?.setAttribute('aria-hidden', 'true');
  }

  scrollToBottom() {
    const container = document.getElementById('chatMessages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  renderAllMessages() {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    container.innerHTML = '';

    this.history.forEach(msg => {
      if (msg.role === 'user') {
        this.renderUserMessageElement(msg.text, false);
      } else {
        this.renderAssistantMessageElement(msg, false);
      }
    });

    this.scrollToBottom();
  }

  renderUserMessageElement(text, animate = true) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble user';
    bubble.innerHTML = `
      <div class="chat-avatar-mini">
        <i class="fa-solid fa-user"></i>
      </div>
      <div class="chat-content-wrap">
        <div>${this.escapeHtml(text)}</div>
      </div>
    `;

    container.appendChild(bubble);
    if (animate) this.scrollToBottom();
  }

  renderAssistantMessageElement(msgObj, animate = true) {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const formattedContent = this.formatMarkdown(msgObj.text);

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble bot';
    
    let actionsHtml = '';
    if (msgObj.actions && msgObj.actions.length > 0) {
      actionsHtml = `
        <div class="chat-interactive-actions">
          ${msgObj.actions.map(act => {
            if (act.nodeId) {
              return `<button class="chat-action-pill" onclick="window.NexusChatbot.focusNode('${act.nodeId}')"><i class="fa-solid fa-crosshairs"></i> ${act.label}</button>`;
            } else if (act.alertId) {
              return `<button class="chat-action-pill amber" onclick="window.NexusChatbot.openAstDiff('${act.alertId}')"><i class="fa-solid fa-code-compare"></i> ${act.label}</button>`;
            } else if (act.author) {
              return `<button class="chat-action-pill" onclick="window.NexusChatbot.connectFaculty('${act.author}', '${act.paperTitle || ''}')"><i class="fa-solid fa-envelope"></i> ${act.label}</button>`;
            } else if (act.prompt) {
              return `<button class="chat-action-pill" onclick="window.NexusChatbot.submitPrompt('${act.prompt.replace(/'/g, "\\'")}')"><i class="fa-solid fa-sparkles"></i> ${act.label}</button>`;
            }
            return '';
          }).join('')}
        </div>
      `;
    }

    bubble.innerHTML = `
      <div class="chat-avatar-mini">
        <i class="fa-solid fa-brain"></i>
      </div>
      <div class="chat-content-wrap">
        <div class="bot-text-body">${formattedContent}</div>
        ${actionsHtml}
      </div>
    `;

    container.appendChild(bubble);
    if (animate) this.scrollToBottom();
  }

  addUserMessage(text) {
    this.history.push({ role: 'user', text });
    this.saveHistory();
    this.renderUserMessageElement(text, true);
  }

  addAssistantMessage(msgObj, save = true) {
    if (save) {
      this.history.push({ role: 'assistant', ...msgObj });
      this.saveHistory();
    }
    this.renderAssistantMessageElement(msgObj, true);
  }

  showTypingIndicator() {
    const container = document.getElementById('chatMessages');
    if (!container) return;

    const ind = document.createElement('div');
    ind.id = 'chatTypingIndicator';
    ind.className = 'chat-bubble bot';
    ind.innerHTML = `
      <div class="chat-avatar-mini">
        <i class="fa-solid fa-brain"></i>
      </div>
      <div class="chat-content-wrap">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    container.appendChild(ind);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const ind = document.getElementById('chatTypingIndicator');
    if (ind) ind.remove();
  }

  async handleUserQuery(rawQuery) {
    this.addUserMessage(rawQuery);
    this.isGenerating = true;
    this.showTypingIndicator();

    const sendBtn = document.getElementById('chatSendBtn');
    if (sendBtn) sendBtn.disabled = true;

    // Simulate AI inference & Knowledge Graph Grounding
    const delay = Math.min(800, 300 + rawQuery.length * 5);
    await new Promise(r => setTimeout(r, delay));

    try {
      const responseObj = this.generateResponse(rawQuery);
      this.hideTypingIndicator();
      this.addAssistantMessage(responseObj);
    } catch (err) {
      console.error('[Chatbot] Query processing error:', err);
      this.hideTypingIndicator();
      this.addAssistantMessage({
        text: `I encountered an issue processing that query: ${err.message}. Please try asking about specific papers, authors, or equation models.`
      });
    } finally {
      this.isGenerating = false;
      if (sendBtn) sendBtn.disabled = false;
    }
  }

  /**
   * Domain-Grounded Knowledge Graph & AST Reasoning Engine
   */
  generateResponse(query) {
    const q = query.toLowerCase().trim();

    // 1. Navier-Stokes & Fluid Dynamics & Blood Flow
    if (q.includes('navier') || q.includes('stokes') || q.includes('fluid') || q.includes('blood') || q.includes('hemodynamic') || q.includes('viscosity') || q.includes('casson')) {
      return {
        text: `### 🌊 Navier-Stokes & Casson Fluid Dynamics Analysis\n\nI identified a **critical mathematical redundancy (89% AST Structural Match)** between two departments:\n\n1. **Biomedical Engineering**: *Microvascular Hemodynamics & Non-Newtonian Blood Viscosity* by **Dr. Elena Rostova**\n2. **Mechanical Engineering**: *Turbulent Boundary Layers in High-Viscosity Polymers* by **Prof. Arthur Vance**\n\n**Key Mathematical Overlap:**\nBoth groups implemented the exact non-Newtonian **Casson Viscosity Model** and 3D incompressible Navier-Stokes momentum equations:\n\`\`\`text\nAST Formulation: τ = (√τ₀ + √(μ_∞ · γ̇))²\nContinuity & Momentum: ∇ · u = 0,  ρ(∂u/∂t + u · ∇u) = -∇p + ∇ · τ\n\`\`\`\n\n**Financial & Efficiency Impact:**\n* **Duplicate Compute/Grant Costs**: **$148,000 USD** across 2 separate NSF/NIH computing allocations.\n* **Action Item**: Consolidate CUDA solver kernels into a unified campus repo \`libhemo-polymer-cuda\`.`,
        actions: [
          { label: '🔍 Focus Dr. Rostova (Bio)', nodeId: 'paper-bio-01' },
          { label: '🔍 Focus Prof. Vance (Mech)', nodeId: 'paper-mech-01' },
          { label: '⚡ View AST Code Diff', alertId: 'ALERT-NAV-89' },
          { label: '✉️ Connect Rostova & Vance', author: 'Dr. Elena Rostova', paperTitle: 'Microvascular Hemodynamics' }
        ]
      };
    }

    // 2. Grant Waste / Funding Duplication
    if (q.includes('grant') || q.includes('fund') || q.includes('waste') || q.includes('money') || q.includes('cost') || q.includes('budget') || q.includes('save') || q.includes('dollar') || q.includes('$')) {
      return {
        text: `### 💰 University Research Funding & Duplication Audit\n\nThe ResearchNexus automated audit has uncovered **$4.2 Million in cumulative grant waste** across 348 active and proposed university projects.\n\n**Top 3 Active Duplication Clusters:**\n* **Biomedical ↔ Mechanical ($148,000 USD)**: Duplicate GPU fluid solver development and redundant Navier-Stokes discretization.\n* **Chemistry ↔ Materials Science ($92,500 USD)**: Overlapping beamline requests and Lorentzian-Gaussian Raman spectroscopy deconvolution routines.\n* **Applied Physics ↔ Computer Science ($64,000 USD)**: Redundant randomized SVD matrix decomposition algorithms for tensor network contractions.\n\n**Recommended University Action:**\nInstituting shared core facilities and mandatory pre-submission AST graph screening saves an estimated **$750,000/year** in computing and equipment overhead.`,
        actions: [
          { label: '⚡ Inspect Redundancy Matrix', prompt: 'Summarize all redundancy alerts' },
          { label: '📊 View CS vs Physics AST Overlap', alertId: 'ALERT-SVD-76' }
        ]
      };
    }

    // 3. Dr. Elena Rostova
    if (q.includes('rostova') || q.includes('elena')) {
      return {
        text: `### 🧬 Faculty Profile: Dr. Elena Rostova\n* **Department**: Biomedical Engineering & Cardiovascular Institute\n* **Primary Focus**: Microvascular Hemodynamics & Non-Newtonian Blood Rheology\n* **Key Paper**: *Microvascular Hemodynamics in Stenotic Coronary Arteries*\n* **Mathematical Kernels**: \`Casson_Viscosity_Model\`, \`Navier_Stokes_Incompressible\`, \`CFL_Adaptive_Timestep\`\n* **Direct Overlaps**: 89% match with Prof. Arthur Vance (Mech Eng) on non-Newtonian fluid solvers.\n* **Available Datasets**: \`Coronary-CT-Angiography-4D\` (2.4 TB microvascular geometry).`,
        actions: [
          { label: '🔍 Center in Knowledge Graph', nodeId: 'paper-bio-01' },
          { label: '✉️ Send Collaboration Proposal', author: 'Dr. Elena Rostova', paperTitle: 'Microvascular Hemodynamics' }
        ]
      };
    }

    // 4. Prof. Arthur Vance
    if (q.includes('vance') || q.includes('arthur')) {
      return {
        text: `### ⚙️ Faculty Profile: Prof. Arthur Vance\n* **Department**: Mechanical & Aerospace Engineering\n* **Primary Focus**: Polymer rheology, high-viscosity pipe flows, turbulent boundary layer solvers.\n* **Key Paper**: *Turbulent Boundary Layers in High-Viscosity Polymers*\n* **Mathematical Kernels**: \`SIMPLEC_Velocity_Pressure_Coupling\`, \`Non_Newtonian_Constitutive_Eq\`, \`CUDA_SpMV_Solver\`\n* **Hardware / Compute**: 64x NVIDIA H100 GPU cluster partition.`,
        actions: [
          { label: '🔍 Center in Knowledge Graph', nodeId: 'paper-mech-01' },
          { label: '✉️ Contact Prof. Vance', author: 'Prof. Arthur Vance', paperTitle: 'High-Viscosity Polymers' }
        ]
      };
    }

    // 5. Physics vs CS / SVD / Tanaka / Lin
    if (q.includes('svd') || q.includes('physics') || q.includes('tanaka') || q.includes('maya lin') || q.includes('tensor') || q.includes('matrix')) {
      return {
        text: `### ⚛️ SVD & Tensor Decomposition: Physics vs Computer Science\n\n* **Physics (Dr. Hiroshi Tanaka)**: *Quantum Many-Body Wavefunctions via Tensor Network Contraction*\n* **Computer Science (Prof. Maya Lin)**: *Distributed Low-Rank Matrix Factorization on Graph Neural Architectures*\n\n**Mathematical AST Equivalence (76% Match):**\nBoth teams independently implemented randomized Singular Value Decomposition (rSVD) and QR column-pivoted projection:\n\`\`\`text\nMatrix Approximation: A ≈ Q(Q* A) = Q(U Σ V*)\nSampling: Ω ~ Normal(0, 1),  Y = (A A*)^q A Ω\n\`\`\`\n\n**Interdisciplinary Synergy:**\nProf. Maya Lin's distributed GPU algorithm could accelerate Dr. Tanaka's quantum spin glass simulations by **14.2x** with zero new hardware investment.`,
        actions: [
          { label: '🔍 Focus Dr. Tanaka (Physics)', nodeId: 'paper-phys-01' },
          { label: '🔍 Focus Prof. Lin (CS)', nodeId: 'paper-cs-01' },
          { label: '⚡ View SVD Diff Alert', alertId: 'ALERT-SVD-76' }
        ]
      };
    }

    // 6. Raman Spectroscopy & Chemistry & Materials Science
    if (q.includes('raman') || q.includes('spectroscopy') || q.includes('chem') || q.includes('material') || q.includes('al-mansoor') || q.includes('cruz') || q.includes('perovskite') || q.includes('graphene')) {
      return {
        text: `### 🔬 Spectroscopy & Nanomaterials Overlap\n\n* **Chemistry (Dr. Sarah Al-Mansoor)**: *In-Situ Raman Spectroscopy of Catalytic 2D Transition Metal Interfaces*\n* **Materials Science (Prof. Julian Cruz)**: *Structural Phase Transitions in Halide Perovskite Thin Films*\n\n**Duplicated Code & Methods:**\nBoth laboratories developed separate scripts for automated **Lorentzian-Gaussian peak deconvolution** and baseline polynomial subtraction on high-noise spectral datasets:\n\`\`\`text\nPeak Deconvolution: I(ω) = ∑ [ Aₖ / (1 + ((ω - ωₖ)/Γₖ)²) ] + Pₙ(ω)\n\`\`\`\n\n**Grant Waste Identified**: **$92,500 USD** in unshared synchrotron time and redundant custom Python curve fitting libraries.`,
        actions: [
          { label: '🔍 Focus Dr. Al-Mansoor', nodeId: 'paper-chem-01' },
          { label: '🔍 Focus Prof. Cruz', nodeId: 'paper-mat-01' },
          { label: '⚡ View Spectroscopy Diff', alertId: 'ALERT-RAMAN-81' }
        ]
      };
    }

    // 7. AST Matching Explained
    if (q.includes('ast') || q.includes('abstract syntax tree') || q.includes('how it works') || q.includes('algorithm') || q.includes('parse')) {
      return {
        text: `### 📐 How ResearchNexus AST Matching Works\n\nTraditional search engines rely on keyword text matches (which fail when a biologist writes \`blood_viscosity\` in C++ and a mechanical engineer writes \`shear_polymer\` in CUDA Python).\n\n**ResearchNexus 3-Tier Pipeline:**\n1. **Mathematical AST Extraction**: Parses formulas, differential equations, and code loops into symbolic canonical trees.\n2. **Isomorphism & Structural Graph Matching**: Computes node-graph topological equivalence, detecting identical algorithms regardless of variable aliases.\n3. **768-D Gemini Semantic Vector Embeddings**: Embeds abstract summaries to align cross-domain semantic intent.\n\nThis detects duplications even across completely different academic vocabularies with **>94% accuracy**!`,
        actions: [
          { label: '📄 Upload & Test a Paper', prompt: 'How do I upload a research paper?' },
          { label: '⚡ View Sample AST Diff', alertId: 'ALERT-NAV-89' }
        ]
      };
    }

    // 8. Uploading Paper / Ingest
    if (q.includes('upload') || q.includes('pdf') || q.includes('ingest') || q.includes('document') || q.includes('paper') || q.includes('submit')) {
      return {
        text: `### 📄 Upload & Ingest Research Documents\n\nYou can upload any **PDF, LaTeX manuscript, or research abstract** to immediately discover:\n* Which campus faculty are working on identical mathematical models\n* Existing datasets you can utilize without re-running experiments\n* Potential grant redundancy alerts before submitting proposals\n\nClick the floating **"Upload PDF / Paper"** button or test pre-loaded sample papers directly in the Upload Studio!`,
        actions: [
          { label: '🚀 Open Ingestion Studio', prompt: 'open_upload_modal' }
        ]
      };
    }

    // 9. General Departments Overview
    if (q.includes('department') || q.includes('faculty') || q.includes('all papers') || q.includes('overview') || q.includes('summary')) {
      return {
        text: `### 🏛️ University Knowledge Graph Overview\n\n* **🧬 Biomedical Engineering**: 2 Papers, 1 4D CT Dataset (Cardiovascular, Biomechanics)\n* **⚙️ Mechanical Engineering**: 2 Papers, 1 Compute Cluster (Turbulence, Polymers)\n* **💻 Computer Science**: 2 Papers, 1 GNN Library (Distributed SVD, Graph AI)\n* **⚛️ Applied Physics**: 2 Papers, Quantum Many-Body Simulators\n* **🧪 Chemistry & Nano**: 2 Papers, In-Situ Raman Spectroscopy\n* **🔬 Materials Science**: 2 Papers, Halide Perovskite Thin Films\n\nTotal: **12 Verified Nodes**, **11 Active Cross-Department Edges**, and **$4.2M Grant Redundancy Tracked**.`,
        actions: [
          { label: '🌐 Open Knowledge Graph Explorer', prompt: 'open_graph' }
        ]
      };
    }

    // 10. Greetings & Conversational
    if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q === 'help') {
      return {
        text: `Hello! I am your **Nexus AI Research Assistant**. I can help you explore university research papers, pinpoint mathematical equation duplicates, identify grant waste, and recommend interdisciplinary research partners.\n\nWhat would you like to investigate today?`,
        actions: [
          { label: '🔍 Find Navier-Stokes Overlaps', prompt: 'Where are the Navier-Stokes duplications?' },
          { label: '💰 Show Grant Wastage', prompt: 'How much grant funding is duplicated across campus?' },
          { label: '🧬 Explore Dr. Rostova', prompt: 'Summarize Dr. Elena Rostova\'s research paper' }
        ]
      };
    }

    // 11. Fallback Contextual Search through all nodes
    const matchedNode = this.nodes.find(n => 
      n.title.toLowerCase().includes(q) || 
      n.author.toLowerCase().includes(q) ||
      (n.tags && n.tags.some(t => q.includes(t.toLowerCase()))) ||
      (n.department && q.includes(n.department.toLowerCase()))
    );

    if (matchedNode) {
      return {
        text: `### 📄 Match Found: ${matchedNode.title}\n\n* **Lead Author**: **${matchedNode.author}**\n* **Department**: ${matchedNode.department}\n* **Category**: ${matchedNode.type.toUpperCase()}\n* **Abstract/Summary**: ${matchedNode.abstract || 'High-fidelity institutional research node with active AST indexing.'}\n* **Key Mathematical Kernels**: \`${(matchedNode.keyKernels || []).join('`, `') || 'Canonical AST'}\``,
        actions: [
          { label: `🔍 Focus "${matchedNode.title.slice(0, 22)}..."`, nodeId: matchedNode.id },
          { label: `✉️ Connect with ${matchedNode.author}`, author: matchedNode.author, paperTitle: matchedNode.title }
        ]
      };
    }

    // Default intelligent guidance
    return {
      text: `### 🧠 Research Nexus Knowledge Query\n\nI analyzed the campus repository for **"${this.escapeHtml(query)}"**.\n\n**Suggestions to explore:**\n* **Fluid Mechanics & Bio-flow**: Ask about *Navier-Stokes equation duplications* between Bio and Mech Eng.\n* **Grant Redundancies**: Ask *how much funding is wasted on duplicate computing clusters*.\n* **Quantum & AI**: Ask about *randomized SVD algorithms in Physics vs Computer Science*.\n* **Spectroscopy**: Inquire about *Raman deconvolution between Chemistry and Materials Science*.`,
      actions: [
        { label: '💡 Navier-Stokes Overlaps', prompt: 'Where are Navier-Stokes overlaps?' },
        { label: '💰 Grant Waste Summary', prompt: 'How much funding is duplicated across campus?' },
        { label: '🧬 Biomedical Research', prompt: 'Summarize Dr. Elena Rostova\'s research paper' }
      ]
    };
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  formatMarkdown(text) {
    if (!text) return '';
    
    // Code blocks
    let html = text.replace(/```([\s\S]*?)```/g, (match, code) => {
      return `<pre class="chat-code-block"><code>${this.escapeHtml(code.trim())}</code></pre>`;
    });

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(0,240,255,0.1); color: var(--neon-cyan); padding: 2px 6px; border-radius: 4px; font-family: var(--font-mono); font-size: 11px;">$1</code>');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h4 style="color: #FFFFFF; font-size: 14px; margin: 6px 0 8px 0; font-weight: 700;">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 style="color: #FFFFFF; font-size: 15px; margin: 8px 0 10px 0; font-weight: 700;">$1</h3>');

    // Bold & italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Unordered lists
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/((?:<li>.*<\/li>\s*)+)/g, '<ul style="margin: 6px 0 8px 16px; padding: 0;">$1</ul>');

    // Paragraphs
    const lines = html.split('\n\n');
    html = lines.map(line => {
      line = line.trim();
      if (!line) return '';
      if (line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<pre')) return line;
      return `<p>${line.replace(/\n/g, '<br/>')}</p>`;
    }).join('');

    return html;
  }
}

// Global helpers for chat action buttons
window.NexusChatbot = {
  instance: null,
  
  focusNode(nodeId) {
    if (window.location.pathname.includes('dashboard.html')) {
      if (typeof window.focusNodeOnGraph === 'function') {
        window.focusNodeOnGraph(nodeId);
      } else if (window.cy) {
        const node = window.cy.$(`#${nodeId}`);
        if (node.length > 0) {
          window.cy.nodes().unselect();
          node.select();
          window.cy.animate({ center: { eles: node }, zoom: 1.5, duration: 600 });
        }
      }
    } else {
      window.location.href = `dashboard.html?focus=${nodeId}`;
    }
  },

  openAstDiff(alertId) {
    if (window.location.pathname.includes('redundancy.html')) {
      if (typeof window.openAstDiffModal === 'function') {
        window.openAstDiffModal(alertId);
      }
    } else {
      window.location.href = `redundancy.html?alert=${alertId}`;
    }
  },

  connectFaculty(authorName, paperTitle) {
    if (typeof window.ConnectResearchers === 'function') {
      window.ConnectResearchers('node-' + Math.random().toString(36).substr(2, 5), paperTitle || 'Institutional Research Brief', authorName);
    } else {
      alert(`Dispatching institutional collaboration invitation to ${authorName} regarding: "${paperTitle}"`);
    }
  },

  submitPrompt(prompt) {
    if (window.NexusChatbot.instance) {
      if (prompt === 'open_upload_modal') {
        const fab = document.getElementById('fabUpload') || document.querySelector('[data-action="open-upload"]');
        fab?.click();
      } else if (prompt === 'open_graph') {
        window.location.href = 'dashboard.html';
      } else {
        window.NexusChatbot.instance.handleUserQuery(prompt);
      }
    }
  }
};

export default ChatBotController;
