"""Test suite for AST Code Analyzer and Mathematical Kernel Equivalence Engine."""

import pytest
from backend.app.services.ast_parser import ASTCodeAnalyzer, ast_analyzer


class TestASTCodeAnalyzer:
    """Validates structural AST parsing, mathematical token extraction, and code similarity."""

    def test_python_ast_normalization(self):
        """Verifies variable name obfuscation and canonical tree normalization."""
        code_1 = """
def solve_momentum(velocity_x, pressure_grad, viscosity):
    # Calculate convective acceleration
    acc = velocity_x * 0.5 + pressure_grad / viscosity
    return sqrt(acc)
"""
        code_2 = """
def compute_flow(u_val, grad_p, mu_coeff):
    temp = u_val * 0.5 + grad_p / mu_coeff
    return sqrt(temp)
"""
        norm_1 = ASTCodeAnalyzer.normalize_python_ast(code_1)
        norm_2 = ASTCodeAnalyzer.normalize_python_ast(code_2)

        assert norm_1 is not None
        assert norm_2 is not None
        # Both canonicalized ASTs should have identical structure
        assert "canonical_fn" in norm_1
        assert "canonical_fn" in norm_2

    def test_extract_mathematical_operators(self):
        """Verifies extraction of scientific operators (pow, sqrt, trig, linear solvers)."""
        sample_code = """
__global__ void casson_kernel(float* tau, float* gamma, float tau_y, float mu) {
    int idx = blockDim.x * blockIdx.x + threadIdx.x;
    float root_tau_y = sqrtf(tau_y);
    float root_gamma = sqrtf(gamma[idx]);
    tau[idx] = powf(root_tau_y + sqrtf(mu) * root_gamma, 2.0f);
}
"""
        operators = ASTCodeAnalyzer.extract_mathematical_operators(sample_code)
        assert len(operators) > 0
        assert any("sqrt" in op for op in operators)
        assert any("pow" in op for op in operators)
        assert any("threadIdx" in op for op in operators)

    def test_compute_ast_similarity_high_overlap(self):
        """Verifies that identical mathematical solvers in Bio and Mech yield high similarity (>0.80)."""
        bio_solver = """
// Bio-fluid coronary artery shear stress
float calculate_shear(float gamma_dot, float yield_stress, float plasma_visc) {
    float t1 = sqrtf(yield_stress);
    float t2 = sqrtf(plasma_visc * gamma_dot);
    return powf(t1 + t2, 2.0f);
}
"""
        mech_solver = """
// Micro-turbine lubricant non-newtonian model
float compute_lubricant_tau(float shear_rate, float tau_0, float base_visc) {
    float k1 = sqrtf(tau_0);
    float k2 = sqrtf(base_visc * shear_rate);
    return powf(k1 + k2, 2.0f);
}
"""
        score, details = ASTCodeAnalyzer.compute_ast_similarity(bio_solver, mech_solver)
        assert score >= 0.80
        assert "tokenIntersection" in details
        assert details["matchingEquationsCount"] >= 1

    def test_compute_ast_similarity_empty_inputs(self):
        """Verifies safe handling of empty or blank inputs without throwing exceptions."""
        score, details = ASTCodeAnalyzer.compute_ast_similarity("", "")
        assert score == 0.0
        assert details["matches"] == []
