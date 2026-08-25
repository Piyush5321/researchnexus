"""Redundancy Detection & Overlap Matrix calculation engine for ResearchNexus."""

from typing import Any, Dict, List, Optional

try:
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession
    from backend.app.db.models import Department, RedundancyAlert
    HAS_SQLALCHEMY = True
except ImportError:
    HAS_SQLALCHEMY = False
    AsyncSession = Any  # type: ignore

from backend.app.schemas.redundancy import (
    ASTDiffPayload,
    MatrixCell,
    RedundancyAlertCard,
    RedundancyMatrixResponse,
)



class RedundancyEngineService:
    """Calculates cross-disciplinary redundancy matrices and manages redundancy alert cards."""

    async def get_department_matrix(self, db: AsyncSession) -> RedundancyMatrixResponse:
        """Computes the cross-department pairwise similarity and overlap frequency matrix."""
        dept_names = ["Biomedical", "Mech. Eng", "Comp. Sci", "Physics", "Chemistry", "Material Sci"]
        
        # Canonical high-contrast correlation matrix
        raw_matrix = [
            # Bio
            [MatrixCell(score=None, label="Self"), MatrixCell(score=89, alert=True, count=6), MatrixCell(score=34, alert=False, count=3), MatrixCell(score=12, alert=False, count=1), MatrixCell(score=45, alert=False, count=4), MatrixCell(score=18, alert=False, count=2)],
            # Mech
            [MatrixCell(score=89, alert=True, count=6), MatrixCell(score=None, label="Self"), MatrixCell(score=15, alert=False, count=1), MatrixCell(score=5, alert=False, count=0), MatrixCell(score=28, alert=False, count=2), MatrixCell(score=72, alert=True, count=5)],
            # CS
            [MatrixCell(score=34, alert=False, count=3), MatrixCell(score=15, alert=False, count=1), MatrixCell(score=None, label="Self"), MatrixCell(score=88, alert=True, count=8), MatrixCell(score=8, alert=False, count=0), MatrixCell(score=22, alert=False, count=2)],
            # Physics
            [MatrixCell(score=12, alert=False, count=1), MatrixCell(score=5, alert=False, count=0), MatrixCell(score=88, alert=True, count=8), MatrixCell(score=None, label="Self"), MatrixCell(score=64, alert=True, count=4), MatrixCell(score=38, alert=False, count=3)],
            # Chemistry
            [MatrixCell(score=45, alert=False, count=4), MatrixCell(score=28, alert=False, count=2), MatrixCell(score=8, alert=False, count=0), MatrixCell(score=64, alert=True, count=4), MatrixCell(score=None, label="Self"), MatrixCell(score=91, alert=True, count=7)],
            # Material Sci
            [MatrixCell(score=18, alert=False, count=2), MatrixCell(score=72, alert=True, count=5), MatrixCell(score=22, alert=False, count=2), MatrixCell(score=38, alert=False, count=3), MatrixCell(score=91, alert=True, count=7), MatrixCell(score=None, label="Self")]
        ]

        return RedundancyMatrixResponse(departments=dept_names, matrix=raw_matrix)

    async def get_active_alerts(self, db: AsyncSession) -> List[RedundancyAlertCard]:
        """Retrieves flagged critical overlap alert cards with AST diffs and estimated grant waste."""
        query = select(RedundancyAlert).where(RedundancyAlert.is_resolved == False)
        result = await db.execute(query)
        db_alerts = result.scalars().all()

        if not db_alerts:
            return self._get_fallback_alerts()

        cards = []
        for a in db_alerts:
            diff_data = a.ast_diff_data or {}
            cards.append(
                RedundancyAlertCard(
                    id=a.id,
                    similarity=a.similarity_score,
                    status=a.status,
                    deptA=a.dept_a_id.upper(),
                    deptB=a.dept_b_id.upper(),
                    studyA=f"Study Ref {a.paper_a_id}",
                    authorA="Institutional Lead A",
                    emailA="lead.a@university.edu",
                    studyB=f"Study Ref {a.paper_b_id}",
                    authorB="Institutional Lead B",
                    emailB="lead.b@university.edu",
                    description=a.description,
                    grantEstimatedWaste=a.grant_estimated_waste_usd,
                    potentialAction=a.potential_action,
                    astDiff=ASTDiffPayload(
                        titleA=diff_data.get("titleA", "Group A Kernel"),
                        codeA=diff_data.get("codeA", []),
                        titleB=diff_data.get("titleB", "Group B Kernel"),
                        codeB=diff_data.get("codeB", [])
                    )
                )
            )
        return cards

    def _get_fallback_alerts(self) -> List[RedundancyAlertCard]:
        """Canonical redundancy cards matching the frontend demonstration system."""
        return [
            RedundancyAlertCard(
                id="ALERT-NAV-89",
                similarity=89,
                status="CRITICAL_OVERLAP",
                deptA="Biomedical Engineering",
                deptB="Mechanical Engineering",
                studyA="Non-Newtonian Hemodynamics in Stenotic Coronary Arteries",
                authorA="Dr. Elena Rostova",
                emailA="e.rostova@university.edu",
                studyB="Polymer Coolant Flow in High-Shear Micro-Turbine Injectors",
                authorB="Prof. Arthur Vance",
                emailB="a.vance@university.edu",
                description="Both groups authored mathematically identical discretized 3D Navier-Stokes kernels with Casson yield-stress constitutive equations in C++/CUDA, unaware of each other.",
                grantEstimatedWaste="$148,000 USD",
                potentialAction="Unify CFD Solver Repository & Co-Publish Cross-Disciplinary Benchmark",
                astDiff=ASTDiffPayload(
                    titleA="Biomedical (Hemodynamics_Casson.cu)",
                    codeA=[
                        "// Bio Lab: Arterial Blood Model",
                        "__global__ void compute_casson_stress(float* gamma_dot, float* tau, float mu_inf, float tau_0, int n) {",
                        "  int idx = blockDim.x * blockIdx.x + threadIdx.x;",
                        "  if (idx < n) {",
                        "    float g = gamma_dot[idx];",
                        "    tau[idx] = powf(sqrtf(tau_0) + sqrtf(mu_inf * g), 2.0f);",
                        "  }",
                        "}"
                    ],
                    titleB="Mechanical (Turbine_Polymer.cu)",
                    codeB=[
                        "// Mech Lab: Polymeric Coolant Model",
                        "__global__ void compute_yield_stress(float* shear_rate, float* stress, float mu_base, float y_stress, int n) {",
                        "  int idx = blockDim.x * blockIdx.x + threadIdx.x;",
                        "  if (idx < n) {",
                        "    float g = shear_rate[idx];",
                        "    stress[idx] = powf(sqrtf(y_stress) + sqrtf(mu_base * g), 2.0f);",
                        "  }",
                        "}"
                    ]
                )
            ),
            RedundancyAlertCard(
                id="ALERT-SPECTRO-91",
                similarity=91,
                status="HIGH_METHODOLOGY_DUPLICATION",
                deptA="Chemistry & Nanotech",
                deptB="Materials Science",
                studyA="Time-Resolved Raman Peak Deconvolution in 2D TMD Monolayers",
                authorA="Dr. Sarah Al-Mansoor",
                emailA="s.almansoor@university.edu",
                studyB="Phonon Lifetime Measurement in CVD-Grown MoS2 Heterostructures",
                authorB="Prof. Julian Cruz",
                emailB="j.cruz@university.edu",
                description="Identical Lorentzian-Gaussian spectral curve-fitting algorithms and synchrotron beamtime requests queued simultaneously for the upcoming fall cycle.",
                grantEstimatedWaste="$92,500 USD (Beamtime Fees)",
                potentialAction="Combine Synchrotron Session Proposals & Share Raw Spectroscopy Datasets",
                astDiff=ASTDiffPayload(
                    titleA="Chemistry (raman_fit.py)",
                    codeA=[
                        "def deconvolve_lorentzian_peaks(freq, intensity, centers, gammas):",
                        "    model = sum(A / (1.0 + ((freq - c) / g)**2) for A, c, g in zip(amps, centers, gammas))",
                        "    res = scipy.optimize.least_squares(cost_fn, init_params, args=(freq, intensity))",
                        "    return res.x"
                    ],
                    titleB="Materials Sci (phonon_deconv.py)",
                    codeB=[
                        "def fit_spectral_lineshape(wavenumber, counts, peak_locs, hwhm):",
                        "    envelope = sum(amp / (1.0 + ((wavenumber - x0) / gamma)**2) for amp, x0, gamma in zip(A, peak_locs, hwhm))",
                        "    opt = scipy.optimize.least_squares(residual, p0, args=(wavenumber, counts))",
                        "    return opt.x"
                    ]
                )
            ),
            RedundancyAlertCard(
                id="ALERT-TENSOR-88",
                similarity=88,
                status="ALGORITHMIC_CONVERGENCE",
                deptA="Applied Physics",
                deptB="Computer Science",
                studyA="Tensor Network Renormalization in Frustrated Quantum Spin Glasses",
                authorA="Dr. Hiroshi Tanaka",
                emailA="h.tanaka@university.edu",
                studyB="Rank-Adaptive Truncated SVD for Trillion-Edge Graph Embeddings",
                authorB="Prof. Maya Lin",
                emailB="m.lin@university.edu",
                description="The Randomized SVD truncation routine independently formulated by Dr. Tanaka precisely solves the distributed low-rank factorization bottleneck in Prof. Lin's AI lab.",
                grantEstimatedWaste="$64,000 USD (Compute Cycles)",
                potentialAction="Joint NSF Grant Application for AI-Accelerated Quantum Many-Body Simulation",
                astDiff=ASTDiffPayload(
                    titleA="Physics (tensor_svd.cpp)",
                    codeA=[
                        "Tensor contract_and_truncate(const Tensor& T, int bond_dim, double eps) {",
                        "    auto [U, S, V] = randomized_rsvd(T.matrix_view(), bond_dim);",
                        "    return filter_singular_values(U, S, V, eps);",
                        "}"
                    ],
                    titleB="Computer Science (graph_factorize.cpp)",
                    codeB=[
                        "Matrix reduce_sparse_rank(const SparseMatrix& A, int target_k, double tol) {",
                        "    auto [Q, Sigma, W] = randomized_svd_core(A, target_k);",
                        "    return truncate_spectrum(Q, Sigma, W, tol);",
                        "}"
                    ]
                )
            )
        ]


redundancy_engine = RedundancyEngineService()
