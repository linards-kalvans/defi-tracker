// Utils to access environment variables at RUNTIME (not build time)
// This is critical for Docker deployments where env vars are injected at startup

export const getApiUrl = () => {
    // 1. Browser runtime: Read from window.__ENV__ injected by EnvScript
    if (typeof window !== 'undefined' && window.__ENV__) {
        return window.__ENV__.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    }
    // 2. Server runtime (SSR): Read from process.env (RUNTIME_ prefix avoids inlining)
    if (typeof window === 'undefined') {
        return process.env.RUNTIME_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    }
    // 3. Fallback (Build time or local dev)
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
};

export const getWsUrl = () => {
    // 1. Browser runtime
    if (typeof window !== 'undefined' && window.__ENV__) {
        return window.__ENV__.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000';
    }
    // 2. Server runtime (SSR)
    if (typeof window === 'undefined') {
        return process.env.RUNTIME_WS_URL || process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000';
    }
    // 3. Fallback
    return process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000';
};

// DO NOT export constants for base URLs anymore.
// Exporting them as constants causes them to be evaluated ONCE at module load time.
// If this module loads on the client before window.__ENV__ is set, it will capture the wrong value forever.
// Always call getApiUrl() and getWsUrl() directly in components.

