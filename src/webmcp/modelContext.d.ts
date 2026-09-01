/** Minimal ambient types for the emerging WebMCP browser API.
 *  The canonical spec and ChatGPT's in-app browser both expose
 *  `document.modelContext`; older builds used `navigator.modelContext`,
 *  so register.ts probes both at runtime. */

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
  /** hints such as { readOnlyHint: true } — advisory, safe to omit */
  annotations?: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<ModelContextToolResult>;
}

export interface ModelContextRegisterOptions {
  /** Abort this signal to unregister the tool. There is no unregister method. */
  signal?: AbortSignal;
}

export interface ModelContext {
  registerTool: (
    tool: ModelContextToolDescriptor,
    options?: ModelContextRegisterOptions,
  ) => void | Promise<void>;
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
