// Utils to access environment variables at RUNTIME (not build time)
// This is critical for Docker deployments where env vars are injected at startup

export const getApiUrl = () => {
    if (typeof window !== 'undefined' && window.__ENV__) {
        return window.__ENV__.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    }
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
};

export const getWsUrl = () => {
    if (typeof window !== 'undefined' && window.__ENV__) {
        return window.__ENV__.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000';
    }
    return process.env.NEXT_PUBLIC_WS_URL || 'ws://127.0.0.1:8000';
};

export const API_BASE_URL = getApiUrl();
export const WS_BASE_URL = getWsUrl();
