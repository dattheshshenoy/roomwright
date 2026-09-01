/** Minimal ambient types for the emerging WebMCP browser API.
 *  The spec is in flux between `navigator.modelContext` and
 *  `document.modelContext`; we probe both at runtime (see register.ts). */

export interface ModelContextToolResultContent {
  type: "text";
  text: string;
}

export interface ModelContextToolResult {
  content: ModelContextToolResultContent[];
  isError?: boolean;
}

export interface ModelContextToolDescriptor {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<ModelContextToolResult>;
}

export interface ModelContext {
  registerTool: (tool: ModelContextToolDescriptor) => void | Promise<void>;
  unregisterTool?: (name: string) => void | Promise<void>;
}

declare global {
  interface Navigator {
    modelContext?: ModelContext;
  }
  interface Document {
    modelContext?: ModelContext;
  }
}

export {};
