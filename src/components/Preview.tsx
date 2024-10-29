import { compileCode, generateImportMap, getAllLibs } from "@/lib/compiler";
import { useEffect, useRef, useState } from "react";

interface PreviewProps {
  code: string;
}

export const Preview: React.FC<PreviewProps> = ({ code }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [uiComponents, setUiComponents] = useState<string[]>([]);

  const [compiledCode, setCompiledCode] = useState<string>("");
  const [importMap, setImportMap] = useState<string>("");

  useEffect(() => {
    compileCode(code).then(({ code }) => {
      setCompiledCode(code);
    });
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
            :root {
              --background: 0 0% 100%;
              --foreground: 222.2 84% 4.9%;
              --card: 0 0% 100%;
              --card-foreground: 222.2 84% 4.9%;
              --popover: 0 0% 100%;
              --popover-foreground: 222.2 84% 4.9%;
              --primary: 222.2 47.4% 11.2%;
              --primary-foreground: 210 40% 98%;
              --secondary: 210 40% 96.1%;
              --secondary-foreground: 222.2 47.4% 11.2%;
              --muted: 210 40% 96.1%;
              --muted-foreground: 215.4 16.3% 46.9%;
              --accent: 210 40% 96.1%;
              --accent-foreground: 222.2 47.4% 11.2%;
              --destructive: 0 84.2% 60.2%;
              --destructive-foreground: 210 40% 98%;
              --border: 214.3 31.8% 91.4%;
              --input: 214.3 31.8% 91.4%;
              --ring: 222.2 84% 4.9%;
              --radius: 0.5rem;
            }

            .dark {
              --background: 222.2 84% 4.9%;
              --foreground: 210 40% 98%;
              --card: 222.2 84% 4.9%;
              --card-foreground: 210 40% 98%;
              --popover: 222.2 84% 4.9%;
              --popover-foreground: 210 40% 98%;
              --primary: 210 40% 98%;
              --primary-foreground: 222.2 47.4% 11.2%;
              --secondary: 217.2 32.6% 17.5%;
              --secondary-foreground: 210 40% 98%;
              --muted: 217.2 32.6% 17.5%;
              --muted-foreground: 215 20.2% 65.1%;
              --accent: 217.2 32.6% 17.5%;
              --accent-foreground: 210 40% 98%;
              --destructive: 0 62.8% 30.6%;
              --destructive-foreground: 210 40% 98%;
              --border: 217.2 32.6% 17.5%;
              --input: 217.2 32.6% 17.5%;
              --ring: 212.7 26.8% 83.9%;
            }

            * {
              border-color: hsl(var(--border));
            }

            body {
              background-color: hsl(var(--background));
              color: hsl(var(--foreground));
            }
          </style>
          <script>
            tailwind.config = {
              theme: {
                container: {
                  center: true,
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
                  },
                  borderRadius: {
                    lg: "var(--radius)",
                    md: "calc(var(--radius) - 2px)",
                    sm: "calc(var(--radius) - 4px)",
                  },
                  keyframes: {
                    "accordion-down": {
                      from: { height: 0 },
                      to: { height: "var(--radix-accordion-content-height)" },
                    },
                    "accordion-up": {
                      from: { height: "var(--radix-accordion-content-height)" },
                      to: { height: 0 },
                    },
                  },
                  animation: {
                    "accordion-down": "accordion-down 0.2s ease-out",
                    "accordion-up": "accordion-up 0.2s ease-out",
                  },
                },
              },
            }
          </script>
        </head>
        <body>
          <div id="root"></div>
          <script type="module">
            import React from 'react';
            import { createRoot } from 'react-dom/client';

            // 执行用户代码
            const executeCode = async () => {
              try {
                // 将代码字符串进行转义处理
                const codeStr = ${JSON.stringify(compiledCode)};
                
                // 将代码包装在异步模块中
                const codeModule = new Blob(
                  [codeStr],
                  { type: 'text/javascript' }
                );
                
                const moduleUrl = URL.createObjectURL(codeModule);
                const  { default: MyComponent } = await import(moduleUrl);
                URL.revokeObjectURL(moduleUrl);

                if (!MyComponent) {
                  throw new Error('请确保导出了 MyComponent 组件');
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
  }, [code, dependencies, uiComponents]);

  return (
    <iframe
      ref={iframeRef}
      title="preview"
      sandbox="allow-scripts allow-same-origin"
      className="w-full h-full"
    />
  );
};
