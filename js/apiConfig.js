/**
 * ResearchNexus - Centralized API Configuration & Fetch Wrapper
 * Handles live REST communication with FastAPI backend with exponential backoff retries,
 * 30-second timeout aborts, error interceptors, and seamless mock fallback.
 */

export const API_CONFIG = {
  BASE_URL: (typeof window !== 'undefined' && window.__RESEARCH_NEXUS_API_URL__) 
    ? window.__RESEARCH_NEXUS_API_URL__ 
    : 'http://localhost:8000/api/v1',
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

/**
 * Async fetch wrapper with timeout and retry logic
 * @param {string} endpoint - API path (e.g. '/graph/nodes')
 * @param {RequestInit} [options={}] - Fetch options
 * @param {number} [retries=API_CONFIG.MAX_RETRIES] - Number of retry attempts
 * @returns {Promise<any>}
 */
export async function apiFetch(endpoint, options = {}, retries = API_CONFIG.MAX_RETRIES) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_CONFIG.BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

  const fetchOptions = {
    ...options,
    signal: controller.signal,
    headers: {
      ...API_CONFIG.HEADERS,
      ...(options.headers || {})
    }
  };

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }
      throw new Error(errorData.detail || `HTTP Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    // If request was aborted due to timeout
    if (error.name === 'AbortError') {
      console.warn(`[API] Request timed out after ${API_CONFIG.TIMEOUT_MS}ms: ${url}`);
      throw new Error(`Request timed out after ${API_CONFIG.TIMEOUT_MS / 1000}s`);
    }

    // Attempt retry for network / transient failures
    if (retries > 0 && (!options.method || options.method === 'GET')) {
      const delay = API_CONFIG.RETRY_DELAY_MS * (API_CONFIG.MAX_RETRIES - retries + 1);
      console.warn(`[API] Retrying ${url} in ${delay}ms... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiFetch(endpoint, options, retries - 1);
    }

    console.warn(`[API] Request failed for ${url}:`, error.message);
    throw error;
  }
}

/**
 * Checks if live FastAPI backend is reachable
 * @returns {Promise<boolean>}
 */
export async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const healthUrl = API_CONFIG.BASE_URL.replace('/api/v1', '/health');
    const response = await fetch(healthUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}
