// Script to inject environment variables into the window object at runtime
// In standalone mode, process.env is only available if explicitly passed to the server
// However, standard env vars are available to the server process
export function EnvScript() {
    // Access env vars from the server-side process
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;

    // Only inject in production/docker where process.env is baked in
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
