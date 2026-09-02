import { useEffect } from "react";
import type { ModelContext, ModelContextToolDescriptor } from "./modelContext";

/** Resolve whichever surface the current browser exposes. The canonical spec and
 *  ChatGPT's in-app browser use `document.modelContext`; earlier builds used
 *  `navigator.modelContext`, so probe document first and fall back. */
export function getModelContext(): ModelContext | null {
  if (typeof document !== "undefined" && document.modelContext) return document.modelContext;
  if (typeof navigator !== "undefined" && navigator.modelContext) return navigator.modelContext;
  return null;
}

export const webmcpAvailable = () => getModelContext() !== null;

/** Register a set of tools for the lifetime of a component. Tools never outlive
 *  the view that owns them: WebMCP has no unregister call, so every tool is
 *  registered with one AbortSignal that we abort on cleanup. No-ops cleanly when
 *  WebMCP is absent, and retries briefly in case the host injects
 *  `document.modelContext` after the first paint. */
export function useWebMCPTools(tools: ModelContextToolDescriptor[]): void {
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as unknown as { __roomwright?: unknown }).__roomwright = { tools };
    }

    const controller = new AbortController();
    let done = false;

    const register = (ctx: ModelContext) => {
      if (done) return;
      done = true;
      for (const tool of tools) {
        try {
          Promise.resolve(ctx.registerTool(tool, { signal: controller.signal })).catch((err) =>
            console.error(`[webmcp] failed to register "${tool.name}"`, err),
          );
        } catch (err) {
          console.error(`[webmcp] failed to register "${tool.name}"`, err);
        }
      }
      console.info(`[webmcp] registered ${tools.length} Roomwright tools`);
    };

    const now = getModelContext();
    if (now) {
      register(now);
      return () => controller.abort();
    }

    // Some hosts attach document.modelContext a beat after load. Poll for ~10s,
    // then give up quietly — Roomwright works the same either way.
    console.info(
      "[webmcp] document.modelContext not present yet — waiting. Open in ChatGPT's in-app " +
        "browser (agentic model) or Chrome 149+ with #enable-webmcp-testing to drive Roomwright with an agent.",
    );
    let tries = 0;
    const timer = window.setInterval(() => {
      const ctx = getModelContext();
      if (ctx) {
        window.clearInterval(timer);
        register(ctx);
      } else if (++tries >= 20) {
        window.clearInterval(timer);
      }
    }, 500);

    return () => {
      window.clearInterval(timer);
      controller.abort();
    };
    // Tool descriptors are module-static; register once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
