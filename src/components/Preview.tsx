import { generateImportMap, getAllLibs } from "@/lib/compiler";
import { useEffect, useRef, useState } from "react";
import themeRawCode from "./themeRaw.css?raw";

interface PreviewProps {
  code: string;
  compiledCode: string;
}

const twConfig: Record<string, any> = {
  theme: {
    container: {
      center: "true",
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
};
export const Preview: React.FC<PreviewProps> = ({ code, compiledCode }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [uiComponents, setUiComponents] = useState<string[]>([]);

  const [importMap, setImportMap] = useState<string>("");

  useEffect(() => {
    getAllLibs(code).then(async ({ thirdPartyLibs, uiLibs }) => {
      setDependencies(thirdPartyLibs);
      setUiComponents(uiLibs);
      const { importMap } = await generateImportMap(thirdPartyLibs, uiLibs);
      setImportMap(importMap);
    });
  }, [code]);

  useEffect(() => {
    if (!iframeRef.current) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          ${importMap}
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            ${themeRawCode}
            * {
              border-color: hsl(var(--border));
            }

            body {
              background-color: hsl(var(--background));
              color: hsl(var(--foreground));
            }
          </style>
          <script>
            tailwind.config = ${JSON.stringify(twConfig)};
          </script>
        </head>
        <body>
          <div id="root"></div>
          <script type="module">
            import React from 'react';
            import { createRoot } from 'react-dom/client';

            const executeCode = async () => {
              try {
                const codeStr = ${JSON.stringify(compiledCode)};
                
                const codeModule = new Blob(
                  [codeStr],
                  { type: 'text/javascript' }
                );
                
                const moduleUrl = URL.createObjectURL(codeModule);
                const moduleExports = await import(moduleUrl);
                URL.revokeObjectURL(moduleUrl);

                let MyComponent = moduleExports.default;

                if (!MyComponent) {
                  MyComponent = Object.values(moduleExports).find(
                    (exported) => typeof exported === 'function'
                  );
                }

                if (!MyComponent) {
                  throw new Error("Make sure to export a default component or a function");
                }

                const root = createRoot(document.getElementById('root'));
                root.render(React.createElement(MyComponent));
              } catch (err) {
                const errorElement = document.createElement('div');
                errorElement.style.color = 'red';
                errorElement.style.padding = '1rem';
                errorElement.style.fontFamily = 'monospace';
                errorElement.textContent = err.message;
                document.body.appendChild(errorElement);
              }
            };

            executeCode();
          </script>
        </body>
      </html>
    `;

    iframeRef.current.srcdoc = html;
  }, [compiledCode, dependencies, uiComponents]);

  return (
    <iframe
      ref={iframeRef}
      title="preview"
      sandbox="allow-scripts allow-same-origin"
      className="w-full h-full"
    />
  );
};
