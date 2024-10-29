import { expect } from "vitest";
import { getImportsFromCode, getAllLibs } from "./compiler";
import { compileCode } from "./compiler";
import importUIlibCode from "./test-code/import-ui-lib.tsx?raw";
import uilibCode from "@/components/ui/button.tsx?raw";

describe("getImportsFromCode", () => {
  // importUIlibCode
  it("", () => {
    const imports = getImportsFromCode(importUIlibCode);
    expect(imports).toEqual([
      "react",
      "@/components/ui/button",
      "@/components/ui/input",
      "@/components/ui/slider",
      "lucide-react",
    ]);
  });
  it("should return an array of import paths from the code", () => {
    const code = `
      import React from 'react';
      import { useState } from 'react';
    `;
    const expectedImports = ["react"];
    const imports = getImportsFromCode(code);
    expect(imports).toEqual(expectedImports);
  });

  it("multiple lines imports", () => {
    const code = `
      import React from 'react';
      import {
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
      } from "@/components/ui/card"
    `;
    const expectedImports = ["react", "@/components/ui/card"];
    const imports = getImportsFromCode(code);
    expect(imports).toEqual(expectedImports);
  });

  it("should return an empty array if there are no import statements", () => {
    const code = `
      const a = 1;
      console.log(a);
    `;
    const expectedImports: string[] = [];
    const imports = getImportsFromCode(code);
    expect(imports).toEqual(expectedImports);
  });

  it("should handle dynamic imports", () => {
    // const code = `
    //   import('lodash').then(_ => {
    //     console.log('Lodash loaded');
    //   });
    // `;
    // const expectedImports = ["lodash"];
    // const imports = getImportsFromCode(code);
    // expect(imports).toEqual(expectedImports);
  });
});

describe("compileCode", () => {
  it("ui button", async () => {
    const result = await compileCode(uilibCode);
    console.log(result);
  });
  it("should return dependencies", async () => {
    const result = await compileCode(importUIlibCode);
    expect(result.dependencies).toEqual([
      "react",
      "@/components/ui/button",
      "@/components/ui/input",
      "@/components/ui/slider",
      "lucide-react",
    ]);
  });
  it("should successfully compile valid code", async () => {
    const validCode = `
      function add(a: number, b: number) {
        return a + b;
      }
    `;

    const result = await compileCode(validCode);
    expect(result.error).toBeNull();
    expect(result.dependencies).toHaveLength(0);
  });

  it("should handle empty code input", async () => {
    const result = await compileCode("");
    expect(result.error).toBeNull();
    expect(result.dependencies).toHaveLength(0);
  });
});

describe("getThirdPartyLibs", () => {
  it("should return third party libs", async () => {
    const result = await getAllLibs(importUIlibCode);
    console.log(result);
    expect(result.thirdPartyLibs).toEqual([
      "react",
      "lucide-react",
      "@radix-ui/react-slot",
      "class-variance-authority",
    ]);
    expect(result.uiLibs).toEqual(["button", "input", "slider"]);
  });
});
