// Script to inject environment variables into the window object at runtime
export function EnvScript() {
    // Only inject in production/docker where process.env is baked in
    return (
        <script
            dangerouslySetInnerHTML={{
                __html: `
          window.__ENV__ = {
            NEXT_PUBLIC_API_URL: '${process.env.NEXT_PUBLIC_API_URL || ""}',
            NEXT_PUBLIC_WS_URL: '${process.env.NEXT_PUBLIC_WS_URL || ""}'
          };
        `,
            }}
        />
    );
}

