/**
 * ResearchNexus - Mock Data Service (FastAPI REST API Adapter Layer)
 * Mimics asynchronous JSON responses from backend endpoint: /api/v1/...
 */

const MockAPI = (function() {
  'use strict';

  // 1. Departments Registry
  const departments = [
    { id: 'cs', name: 'Computer Science', code: 'CS', color: '#00F0FF', icon: 'fa-code-branch', papersCount: 1420 },
    { id: 'bio', name: 'Biomedical Eng', code: 'BIO', color: '#8A2BE2', icon: 'fa-dna', papersCount: 980 },
    { id: 'mech', name: 'Mechanical Eng', code: 'MECH', color: '#FFB300', icon: 'fa-cogs', papersCount: 1150 },
    { id: 'physics', name: 'Applied Physics', code: 'PHYS', color: '#00FA64', icon: 'fa-atom', papersCount: 840 },
    { id: 'chem', name: 'Chemistry & Nano', code: 'CHEM', color: '#3B82F6', icon: 'fa-flask', papersCount: 760 },
    { id: 'mat', name: 'Materials Science', code: 'MAT', color: '#EC4899', icon: 'fa-cubes', papersCount: 690 }
  ];

  // 2. Entity Types
  const entityTypes = [
    { id: 'paper', label: 'Research Papers', icon: 'fa-file-lines' },
    { id: 'dataset', label: 'Datasets', icon: 'fa-database' },
    { id: 'algorithm', label: 'Algorithms', icon: 'fa-diagram-project' },
    { id: 'author', label: 'Lead Authors', icon: 'fa-user-astronaut' },
    { id: 'code', label: 'Code Repositories', icon: 'fa-terminal' }
  ];

  // 3. Cytoscape Graph Nodes and Edges
  const graphElements = {
    nodes: [
      // Core Navier-Stokes Cluster (The Silo Problem)
      {
        data: {
          id: 'paper-bio-01',
          name: 'Microfluidic Hemodynamics in Stenotic Coronary Bifurcations',
          label: 'Hemodynamics (Bio)',
          type: 'paper',
          dept: 'bio',
          author: 'Dr. Elena Rostova',
          year: 2024,
          astMatch: '92% vs Mech-Eng #412',
          similarity: 0.92,
          doi: '10.1016/j.jbiomech.2024.1042',
          repo: 'github.com/cardiolab/hemo-solver',
          abstract: 'Finite-volume formulation solving 3D incompressible Navier-Stokes equations with non-Newtonian Casson viscosity model in patient-specific arterial bifurcations.',
          mathAstCode: 'def solve_navier_stokes(mesh, rho, mu_eff):\n    # Bio Casson fluid model\n    gamma_dot = compute_shear_rate(mesh.u)\n    mu = (np.sqrt(tau_0) + np.sqrt(mu_inf * gamma_dot))**2 / gamma_dot\n    return fv_discretize_momentum(mesh, mu)'
        }
      },
      {
        data: {
          id: 'paper-mech-01',
          name: 'Non-Newtonian Coolant Flow in Micro-Turbine Injectors',
          label: 'Turbine Flow (Mech)',
          type: 'paper',
          dept: 'mech',
          author: 'Prof. Arthur Vance',
          year: 2024,
          astMatch: '92% vs Bio-Eng #104',
          similarity: 0.92,
          doi: '10.1016/j.fluiddyn.2024.089',
          repo: 'github.com/vancelab/micro-injection-cfd',
          abstract: 'Computational fluid dynamics solver for non-Newtonian polymeric coolants traversing high-shear sub-millimeter nozzle channels utilizing identical discretized Navier-Stokes solvers.',
          mathAstCode: 'def solve_navier_stokes(mesh, rho, mu_eff):\n    # Polymer coolant shear-thinning\n    gamma_dot = calc_strain_tensor(mesh.velocity)\n    mu = (np.sqrt(yield_stress) + np.sqrt(mu_base * gamma_dot))**2 / gamma_dot\n    return fv_discretize_momentum(mesh, mu)'
        }
      },
      {
        data: {
          id: 'code-solver-01',
          name: 'Lib-NavierStokes-FV (Shared Solver Core)',
          label: 'Lib-NavierStokes (Code)',
          type: 'code',
          dept: 'cs',
          author: 'Open Source Nexus',
          year: 2023,
          astMatch: '98% Algorithmic Identity',
          similarity: 0.98,
          doi: 'Internal Archive',
          repo: 'github.com/nexus-uni/navier-stokes-core',
          abstract: 'Core high-performance C++/CUDA finite-volume kernel for pressure-velocity coupling in unstructured meshes.'
        }
      },
      // Quantum / Matrix Solver Cluster
      {
        data: {
          id: 'paper-phys-01',
          name: 'Tensor Network Renormalization in Quantum Spin Glasses',
          label: 'Quantum Spin (Phys)',
          type: 'paper',
          dept: 'physics',
          author: 'Dr. Hiroshi Tanaka',
          year: 2024,
          astMatch: '88% vs CS-Algo #78',
          similarity: 0.88,
          doi: '10.1103/PhysRevLett.132.040601',
          repo: 'github.com/tanaka-qphys/tensor-glass',
          abstract: 'Higher-order SVD algorithm for 2D disordered Hamiltonian contraction with bond dimension truncation.'
        }
      },
      {
        data: {
          id: 'algo-cs-01',
          name: 'Distributed Truncated SVD for Low-Rank Graph Embeddings',
          label: 'Truncated SVD (CS)',
          type: 'algorithm',
          dept: 'cs',
          author: 'Prof. Maya Lin',
          year: 2024,
          astMatch: '88% vs Phys #132',
          similarity: 0.88,
          doi: '10.1145/3637528.36719',
          repo: 'github.com/lin-ai-lab/distributed-svd',
          abstract: 'Randomized and rank-adaptive tensor contraction pipeline for trillion-edge sparse adjacency graphs.'
        }
      },
      // Spectroscopy / Material Chemistry Cluster
      {
        data: {
          id: 'paper-chem-01',
          name: 'Time-Resolved Raman Spectroscopy of 2D Transition Metal Dichalcogenides',
          label: 'Raman 2D TMDs (Chem)',
          type: 'paper',
          dept: 'chem',
          author: 'Dr. Sarah Al-Mansoor',
          year: 2024,
          astMatch: '91% vs MatSci #551',
          similarity: 0.91,
          doi: '10.1021/acs.nanolett.4c012',
          repo: 'github.com/almansoor-chem/tmd-spectro',
          abstract: 'Spectroscopic peak-deconvolution pipeline for ultrafast phonon decay dynamics in MoS2 monolayers.'
        }
      },
      {
        data: {
          id: 'paper-mat-01',
          name: 'Phonon Lifetime Measurement in CVD-Grown MoS2 Heterostructures',
          label: 'MoS2 Phonons (MatSci)',
          type: 'paper',
          dept: 'mat',
          author: 'Prof. Julian Cruz',
          year: 2024,
          astMatch: '91% vs Chem #4c0',
          similarity: 0.91,
          doi: '10.1038/s41563-024-01821-x',
          repo: 'github.com/cruz-matsci/raman-deconv-pipeline',
          abstract: 'Identical Lorentzian-Gaussian deconvolution fitting routines deployed on overlapping beamline datasets.'
        }
      },
      // Datasets & Supporting Nodes
      {
        data: {
          id: 'data-coronary-ct',
          name: 'OpenCoronary 4D CT Angiography Dataset (12,000 Scans)',
          label: 'Coronary 4D CT (Data)',
          type: 'dataset',
          dept: 'bio',
          author: 'University Medical Center',
          year: 2023,
          astMatch: '95% Schema Match',
          similarity: 0.85,
          doi: '10.5281/zenodo.7891234',
          repo: 'open-data.nexus.edu/bio/coronary4d',
          abstract: 'De-identified high-resolution volumetric arterial geometry captures with volumetric flow ground truth.'
        }
      },
      {
        data: {
          id: 'author-rostova',
          name: 'Dr. Elena Rostova (Biomechanics Dept)',
          label: 'Dr. E. Rostova (Author)',
          type: 'author',
          dept: 'bio',
          author: 'Dr. Elena Rostova',
          year: 2024,
          astMatch: 'h-index: 28 | 42 Papers',
          similarity: 0.75,
          doi: 'ORCID: 0000-0002-1825-0097',
          repo: 'orcid.org/0000-0002-1825-0097',
          abstract: 'Specializes in computational hemodynamics, vascular graft mechanics, and non-Newtonian rheology.'
        }
      },
      {
        data: {
          id: 'author-vance',
          name: 'Prof. Arthur Vance (Mechanical Fluid Lab)',
          label: 'Prof. A. Vance (Author)',
          type: 'author',
          dept: 'mech',
          author: 'Prof. Arthur Vance',
          year: 2024,
          astMatch: 'h-index: 34 | 68 Papers',
          similarity: 0.75,
          doi: 'ORCID: 0000-0001-9021-4412',
          repo: 'orcid.org/0000-0001-9021-4412',
          abstract: 'Specializes in micro-channel thermodynamics, aerospace injector fluid dynamics, and shear-thinning flows.'
        }
      }
    ],
    edges: [
      // Silo Navier-Stokes Bridge
      { data: { id: 'e-bio-mech', source: 'paper-bio-01', target: 'paper-mech-01', similarity: 0.92, label: '92% AST Match', type: 'redundancy' } },
      { data: { id: 'e-bio-code', source: 'paper-bio-01', target: 'code-solver-01', similarity: 0.85, label: 'Uses Kernel', type: 'citation' } },
      { data: { id: 'e-mech-code', source: 'paper-mech-01', target: 'code-solver-01', similarity: 0.86, label: 'Uses Kernel', type: 'citation' } },
      { data: { id: 'e-bio-author', source: 'author-rostova', target: 'paper-bio-01', similarity: 1.0, label: 'Lead Author', type: 'authorship' } },
      { data: { id: 'e-mech-author', source: 'author-vance', target: 'paper-mech-01', similarity: 1.0, label: 'Lead Author', type: 'authorship' } },
      { data: { id: 'e-bio-data', source: 'paper-bio-01', target: 'data-coronary-ct', similarity: 0.9, label: 'Training Data', type: 'dataset' } },

      // Quantum / Matrix Solver Bridge
      { data: { id: 'e-phys-cs', source: 'paper-phys-01', target: 'algo-cs-01', similarity: 0.88, label: '88% Math Match', type: 'redundancy' } },

      // Spectroscopy Bridge
      { data: { id: 'e-chem-mat', source: 'paper-chem-01', target: 'paper-mat-01', similarity: 0.91, label: '91% Method Match', type: 'redundancy' } }
    ]
  };

  // 4. Department Overlap Redundancy Matrix
  const redundancyMatrix = {
    departments: ['Biomedical', 'Mech. Eng', 'Comp. Sci', 'Physics', 'Chemistry', 'Material Sci'],
    matrix: [
      // Bio
      [ { score: null, label: 'Self' }, { score: 89, alert: true, count: 6 }, { score: 34, alert: false, count: 3 }, { score: 12, alert: false, count: 1 }, { score: 45, alert: false, count: 4 }, { score: 18, alert: false, count: 2 } ],
      // Mech
      [ { score: 89, alert: true, count: 6 }, { score: null, label: 'Self' }, { score: 15, alert: false, count: 1 }, { score: 5, alert: false, count: 0 }, { score: 28, alert: false, count: 2 }, { score: 72, alert: true, count: 5 } ],
      // CS
      [ { score: 34, alert: false, count: 3 }, { score: 15, alert: false, count: 1 }, { score: null, label: 'Self' }, { score: 88, alert: true, count: 8 }, { score: 8, alert: false, count: 0 }, { score: 22, alert: false, count: 2 } ],
      // Physics
      [ { score: 12, alert: false, count: 1 }, { score: 5, alert: false, count: 0 }, { score: 88, alert: true, count: 8 }, { score: null, label: 'Self' }, { score: 64, alert: true, count: 4 }, { score: 38, alert: false, count: 3 } ],
      // Chemistry
      [ { score: 45, alert: false, count: 4 }, { score: 28, alert: false, count: 2 }, { score: 8, alert: false, count: 0 }, { score: 64, alert: true, count: 4 }, { score: null, label: 'Self' }, { score: 91, alert: true, count: 7 } ],
      // Material Sci
      [ { score: 18, alert: false, count: 2 }, { score: 72, alert: true, count: 5 }, { score: 22, alert: false, count: 2 }, { score: 38, alert: false, count: 3 }, { score: 91, alert: true, count: 7 }, { score: null, label: 'Self' } ]
    ]
  };

  // 5. Redundancy Alert Cards
  const redundancyAlerts = [
    {
      id: 'ALERT-NAV-89',
      similarity: 89,
      status: 'CRITICAL_OVERLAP',
      deptA: 'Biomedical Engineering',
      deptB: 'Mechanical Engineering',
      studyA: 'Non-Newtonian Hemodynamics in Stenotic Coronary Arteries',
      authorA: 'Dr. Elena Rostova',
      emailA: 'e.rostova@university.edu',
      studyB: 'Polymer Coolant Flow in High-Shear Micro-Turbine Injectors',
      authorB: 'Prof. Arthur Vance',
      emailB: 'a.vance@university.edu',
      description: 'Both groups authored mathematically identical discretized 3D Navier-Stokes kernels with Casson yield-stress constitutive equations in C++/CUDA, unaware of each other.',
      grantEstimatedWaste: '$148,000 USD',
      potentialAction: 'Unify CFD Solver Repository & Co-Publish Cross-Disciplinary Benchmark',
      astDiff: {
        titleA: 'Biomedical (Hemodynamics_Casson.cu)',
        codeA: [
          '// Bio Lab: Arterial Blood Model',
          '__global__ void compute_casson_stress(float* gamma_dot, float* tau, float mu_inf, float tau_0, int n) {',
          '  int idx = blockDim.x * blockIdx.x + threadIdx.x;',
          '  if (idx < n) {',
          '    float g = gamma_dot[idx];',
          '    tau[idx] = powf(sqrtf(tau_0) + sqrtf(mu_inf * g), 2.0f);',
          '  }',
          '}'
        ],
        titleB: 'Mechanical (Turbine_Polymer.cu)',
        codeB: [
          '// Mech Lab: Polymeric Coolant Model',
          '__global__ void compute_yield_stress(float* shear_rate, float* stress, float mu_base, float y_stress, int n) {',
          '  int idx = blockDim.x * blockIdx.x + threadIdx.x;',
          '  if (idx < n) {',
          '    float g = shear_rate[idx];',
          '    stress[idx] = powf(sqrtf(y_stress) + sqrtf(mu_base * g), 2.0f);',
          '  }',
          '}'
        ]
      }
    },
    {
      id: 'ALERT-SPECTRO-91',
      similarity: 91,
      status: 'HIGH_METHODOLOGY_DUPLICATION',
      deptA: 'Chemistry & Nanotech',
      deptB: 'Materials Science',
      studyA: 'Time-Resolved Raman Peak Deconvolution in 2D TMD Monolayers',
      authorA: 'Dr. Sarah Al-Mansoor',
      emailA: 's.almansoor@university.edu',
      studyB: 'Phonon Lifetime Measurement in CVD-Grown MoS2 Heterostructures',
      authorB: 'Prof. Julian Cruz',
      emailB: 'j.cruz@university.edu',
      description: 'Identical Lorentzian-Gaussian spectral curve-fitting algorithms and synchrotron beamtime requests queued simultaneously for the upcoming fall cycle.',
      grantEstimatedWaste: '$92,500 USD (Beamtime Fees)',
      potentialAction: 'Combine Synchrotron Session Proposals & Share Raw Spectroscopy Datasets',
      astDiff: {
        titleA: 'Chemistry (raman_fit.py)',
        codeA: [
          'def deconvolve_lorentzian_peaks(freq, intensity, centers, gammas):',
          '    model = sum(A / (1.0 + ((freq - c) / g)**2) for A, c, g in zip(amps, centers, gammas))',
          '    res = scipy.optimize.least_squares(cost_fn, init_params, args=(freq, intensity))',
          '    return res.x'
        ],
        titleB: 'Materials Sci (phonon_deconv.py)',
        codeB: [
          'def fit_spectral_lineshape(wavenumber, counts, peak_locs, hwhm):',
          '    envelope = sum(amp / (1.0 + ((wavenumber - x0) / gamma)**2) for amp, x0, gamma in zip(A, peak_locs, hwhm))',
          '    opt = scipy.optimize.least_squares(residual, p0, args=(wavenumber, counts))',
          '    return opt.x'
        ]
      }
    },
    {
      id: 'ALERT-TENSOR-88',
      similarity: 88,
      status: 'ALGORITHMIC_CONVERGENCE',
      deptA: 'Applied Physics',
      deptB: 'Computer Science',
      studyA: 'Tensor Network Renormalization in Frustrated Quantum Spin Glasses',
      authorA: 'Dr. Hiroshi Tanaka',
      emailA: 'h.tanaka@university.edu',
      studyB: 'Rank-Adaptive Truncated SVD for Trillion-Edge Graph Embeddings',
      authorB: 'Prof. Maya Lin',
      emailB: 'm.lin@university.edu',
      description: 'The Randomized SVD truncation routine independently formulated by Dr. Tanaka precisely solves the distributed low-rank factorization bottleneck in Prof. Lin\'s AI lab.',
      grantEstimatedWaste: '$64,000 USD (Compute Cycles)',
      potentialAction: 'Joint NSF Grant Application for AI-Accelerated Quantum Many-Body Simulation',
      astDiff: {
        titleA: 'Physics (tensor_svd.cpp)',
        codeA: [
          'Tensor contract_and_truncate(const Tensor& T, int bond_dim, double eps) {',
          '    auto [U, S, V] = randomized_rsvd(T.matrix_view(), bond_dim);',
          '    return filter_singular_values(U, S, V, eps);',
          '}'
        ],
        titleB: 'Computer Science (graph_factorize.cpp)',
        codeB: [
          'Matrix reduce_sparse_rank(const SparseMatrix& A, int target_k, double tol) {',
          '    auto [Q, Sigma, W] = randomized_svd_core(A, target_k);',
          '    return truncate_spectrum(Q, Sigma, W, tol);',
          '}'
        ]
      }
    }
  ];

  // 6. System Metrics
  const systemMetrics = {
    papersIndexed: 54190,
    departmentsLinked: 12,
    redundanciesDetected: 348,
    grantsSavedUSD: '$4.2M',
    computeHoursConsolidated: '128,400 hrs'
  };

  // Public Mock API methods simulating async REST latency
  return {
    async getDepartments() {
      await new Promise(r => setTimeout(r, 60));
      return departments;
    },

    async getEntityTypes() {
      await new Promise(r => setTimeout(r, 40));
      return entityTypes;
    },

    async getGraphData(filters = {}) {
      await new Promise(r => setTimeout(r, 120));
      const { selectedDepts, selectedTypes, similarityThreshold = 0.5 } = filters;

      let filteredNodes = graphElements.nodes;
      if (selectedDepts && selectedDepts.length > 0) {
        filteredNodes = filteredNodes.filter(n => selectedDepts.includes(n.data.dept));
      }
      if (selectedTypes && selectedTypes.length > 0) {
        filteredNodes = filteredNodes.filter(n => selectedTypes.includes(n.data.type));
      }
      if (similarityThreshold > 0.5) {
        filteredNodes = filteredNodes.filter(n => (n.data.similarity || 1) >= similarityThreshold);
      }

      const validNodeIds = new Set(filteredNodes.map(n => n.data.id));
      const filteredEdges = graphElements.edges.filter(
        e => validNodeIds.has(e.data.source) && validNodeIds.has(e.data.target)
      );

      return {
        nodes: filteredNodes,
        edges: filteredEdges
      };
    },

    async getRedundancyMatrix() {
      await new Promise(r => setTimeout(r, 80));
      return redundancyMatrix;
    },

    async getRedundancyAlerts() {
      await new Promise(r => setTimeout(r, 90));
      return redundancyAlerts;
    },

    async getSystemMetrics() {
      await new Promise(r => setTimeout(r, 50));
      return systemMetrics;
    },

    async searchEntities(query) {
      if (!query || query.trim() === '') return [];
      const q = query.toLowerCase();
      return graphElements.nodes.filter(n => 
        n.data.name.toLowerCase().includes(q) ||
        n.data.author.toLowerCase().includes(q) ||
        n.data.dept.toLowerCase().includes(q)
      ).map(n => n.data);
    },

    async analyzeAndMatchPaper(fileData, rawText, department = 'all') {
      await new Promise(r => setTimeout(r, 1200));
      const sampleGenres = [
        { genre: 'Computational Fluid Dynamics', confidence: 0.94, keywords: ['Navier-Stokes', 'Casson Fluid', 'Finite Volume Method'] },
        { genre: 'Applied Deep Learning & Graph NN', confidence: 0.88, keywords: ['Message Passing', 'Graph Convolution', 'Representation Learning'] },
        { genre: 'Biomedical Microfluidics', confidence: 0.91, keywords: ['Hemodynamics', 'Stenosis', 'Arterial Shear Stress'] },
        { genre: 'Quantum Information & QEC', confidence: 0.85, keywords: ['Surface Codes', 'Syndrome Extraction', 'Decoherence'] }
      ];

      let selectedGenre = sampleGenres[0];
      if (rawText) {
        const lower = rawText.toLowerCase();
        if (lower.includes('graph') || lower.includes('neural') || lower.includes('embed')) {
          selectedGenre = sampleGenres[1];
        } else if (lower.includes('bio') || lower.includes('blood') || lower.includes('arter')) {
          selectedGenre = sampleGenres[2];
        } else if (lower.includes('quantum') || lower.includes('qubit') || lower.includes('spin')) {
          selectedGenre = sampleGenres[3];
        }
      }

      const matchedPapers = [
        {
          id: 'paper-mech-01',
          title: 'Non-Newtonian Coolant Flow in Micro-Turbine Injectors',
          department: 'Mechanical Engineering',
          deptCode: 'mech',
          author: 'Prof. Arthur Vance',
          similarityScore: 0.92,
          genreOverlap: 'High (CFD / Non-Newtonian Math Kernel)',
          equationsMatched: ['Navier-Stokes Momentum', 'Casson Viscosity Relation'],
          recommendedCollaboration: 'Joint grant submission for NSF Fluid Dynamics & Cardiovascular Modeling initiative.'
        },
        {
          id: 'paper-cs-01',
          title: 'Graph Neural Solvers for Partial Differential Equations',
          department: 'Computer Science',
          deptCode: 'cs',
          author: 'Dr. Sarah Lin',
          similarityScore: 0.78,
          genreOverlap: 'Moderate (Geometric Deep Learning / PDE Surrogate)',
          equationsMatched: ['Discretized Laplacian Operators', 'Mesh Invariant Embeddings'],
          recommendedCollaboration: 'Incorporate GNN physics surrogate to accelerate 3D volumetric blood simulation.'
        },
        {
          id: 'paper-physics-01',
          title: 'Phase-Field Modeling of Capillary Micro-Flows',
          department: 'Applied Physics',
          deptCode: 'physics',
          author: 'Dr. Marcus Thorne',
          similarityScore: 0.74,
          genreOverlap: 'Moderate (Continuum Mechanics / Surface Tension)',
          equationsMatched: ['Cahn-Hilliard Phase Boundary', 'Navier-Stokes Convection'],
          recommendedCollaboration: 'Share laser Doppler velocimetry experimental benchmark dataset.'
        }
      ];

      return {
        success: true,
        analyzedDocument: {
          title: fileData?.name || 'Uploaded Research Draft / Abstract',
          detectedGenre: selectedGenre.genre,
          genreConfidence: selectedGenre.confidence,
          keyMathematicalKernels: selectedGenre.keywords,
          estimatedEmbeddingDimensions: 768,
          vectorNorm: 1.0
        },
        topMatches: matchedPapers
      };
    },

    async ingestDocument(formData, onProgress) {
      const steps = [
        { stage: 'Parsing PDF & extracting LaTeX formulas', pct: 25 },
        { stage: 'Analyzing Python/C++ AST syntax trees', pct: 50 },
        { stage: 'Generating cross-disciplinary knowledge triplets', pct: 75 },
        { stage: 'Indexing 768-d vector embeddings in AlloyDB', pct: 100 }
      ];

      for (const step of steps) {
        await new Promise(r => setTimeout(r, 450));
        if (typeof onProgress === 'function') onProgress(step);
      }

      return {
        success: true,
        ingestionId: 'INGEST-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        nodesCreated: 14,
        edgesCreated: 32,
        potentialRedundancies: 2
      };
    },

    async triggerNewAnalysis(payload) {
      await new Promise(r => setTimeout(r, 1500));
      return {
        success: true,
        jobId: 'JOB-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        timestamp: new Date().toISOString(),
        newTripletsExtracted: 142,
        anomaliesFlagged: 3
      };
    }
  };
})();

// Export globally for browser script tags
window.MockAPI = MockAPI;
export default MockAPI;
export { MockAPI };
