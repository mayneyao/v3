// import { initialize, transform } from "esbuild";
import { initialize, transform } from "esbuild-wasm";

import { uiConfig } from "@/components/ui";
export const initializeCompiler = async () => {
  await initialize({
    worker: true,
    wasmURL: "https://unpkg.com/esbuild-wasm@0.24.0/esbuild.wasm",
  });
};

interface CompileOptions {
  uiLibCode?: string;
}

interface CompileResult {
  code: string;
  error: string | null;
  dependencies?: string[];
}

export const compileCode = async (
  sourceCode: string,
  options: CompileOptions = {}
): Promise<CompileResult> => {
  const { uiLibCode = "" } = options;

  try {
    const reactImportRegex =
      /import\s+(?:\*\s+as\s+)?React\s+from\s+['"]react['"]/;
    const hasReactImport = reactImportRegex.test(sourceCode);

    const reactBanner = hasReactImport ? "" : `import React from 'react';\n`;

    const jsxResult = await transform(sourceCode, {
      loader: "tsx",
      target: "esnext",
      jsxFactory: "React.createElement",
      jsxFragment: "React.Fragment",
      banner: reactBanner + uiLibCode,
      minify: false,
      keepNames: true,
      charset: "utf8",
    });

    const dependencies: string[] = getImportsFromCode(jsxResult.code);

    return {
      code: jsxResult.code,
      error: null,
      dependencies,
    };
  } catch (err: any) {
    return { code: "", error: err.message, dependencies: [] };
  }
};

export function getImportsFromCode(code: string) {
  const importRegex = /import\s+.*?from\s+['"](.*?)['"];?/g;
  const imports = [];
  let match;

  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[1]);
  }

  return Array.from(new Set(imports));
}

export async function generateImportMap(
  thirdPartyLibs: string[],
  uiLibs: string[]
) {
  // 创建模块注册表
  const moduleRegistry = new Map();

  const utilsCode = `
  import {  clsx } from "clsx"
  import { twMerge } from "tailwind-merge"
  export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
  `;

  const utilsBlob = new Blob([utilsCode], {
    type: "application/javascript;charset=utf-8",
  });
  const utilsUrl = URL.createObjectURL(utilsBlob);

  // 基础导入
  const imports: Record<string, string> = {
    react: "https://esm.sh/react@18.3.1",
    "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
    clsx: "https://esm.sh/clsx@2.1.1",
    "tailwind-merge": "https://esm.sh/tailwind-merge",
    "@/lib/utils": utilsUrl,
  };

  // 第三方库导入
  thirdPartyLibs.forEach((dep) => {
    imports[dep] = `https://esm.sh/${dep}`;
  });

  // UI 组件使用 blob URL
  for (const dep of uiLibs) {
    const componentId = `@/components/ui/${dep}`;
    const code = uiConfig[dep as keyof typeof uiConfig];
    const compiledCode = await compileCode(code);
    const blob = new Blob([compiledCode.code], {
      type: "application/javascript;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    moduleRegistry.set(componentId, url);
    imports[componentId] = url;
  }

  // 创建导入映射
  const importMapScript = `
  <script type="importmap">
    ${JSON.stringify({ imports })}
  </script>
  `;

  // 由于使用了 Blob URL，我们不再需要生成单独的 script 标签
  // 可以移除 generateUIComponentCode 的调用

  return {
    importMap: importMapScript,
    cleanup: () => {
      // 清理 Blob URLs
      moduleRegistry.forEach((url) => URL.revokeObjectURL(url));
    },
  };
}

export async function getAllLibs(code: string) {
  const { dependencies } = await compileCode(code);
  const thirdPartyLibs =
    dependencies?.filter((dep) => !dep.startsWith("@/")) ?? [];
  const uiLibs =
    dependencies
      ?.filter((dep) => dep.startsWith("@/components/ui"))
      .map((dep) => dep.replace("@/components/ui/", "")) ?? [];
  for (const component of uiLibs) {
    const code = uiConfig[component as keyof typeof uiConfig];
    const { thirdPartyLibs: _thirdPartyLibs } = await getAllLibs(code);
    thirdPartyLibs.push(..._thirdPartyLibs);
  }
  return {
    thirdPartyLibs: Array.from(new Set(thirdPartyLibs)),
    uiLibs: Array.from(new Set(uiLibs)),
  };
}
