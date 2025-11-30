import { unstable_noStore as noStore } from 'next/cache';

// Script to inject environment variables into the window object at runtime
// In standalone mode (Docker), "NEXT_PUBLIC_" vars are inlined at build time as empty strings.
// To read the ACTUAL runtime env vars, we must read variables that are NOT prefixed with NEXT_PUBLIC_
// or use a different strategy. Here we read "RUNTIME_..." vars which won't be inlined.
export function EnvScript() {
    // Prevent static optimization of this component
    // This ensures it runs on the server at request time, every time
    noStore();

    // We read from process.env on the server.
    // Crucial: These must match what we pass in docker-compose
    const apiUrl = process.env.RUNTIME_API_URL || process.env.NEXT_PUBLIC_API_URL;
    const wsUrl = process.env.RUNTIME_WS_URL || process.env.NEXT_PUBLIC_WS_URL;

    return (
        <script
            dangerouslySetInnerHTML={{
                __html: `
          window.__ENV__ = {
            NEXT_PUBLIC_API_URL: '${apiUrl || ""}',
            NEXT_PUBLIC_WS_URL: '${wsUrl || ""}'
          };
        `,
            }}
        />
    );
}
