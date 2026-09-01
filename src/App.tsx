import { useWebMCPTools } from "./webmcp/register";
import type { ModelContextToolDescriptor } from "./webmcp/modelContext";
import { SceneCanvas } from "./scene/SceneCanvas";

/** Phase-0 placeholder tool: proves the registration path end to end.
 *  Replaced by the eight real tools in the WebMCP phase. */
const placeholderTools: ModelContextToolDescriptor[] = [
  {
    name: "roomwright_ping",
    description: "Health check. Returns 'pong' and confirms Roomwright's tool surface is live.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
    execute: async () => ({
      content: [{ type: "text", text: "pong — Roomwright tools are live" }],
    }),
  },
];

export function App() {
  useWebMCPTools(placeholderTools);

  return (
    <div className="grid h-full grid-rows-[3.25rem_1fr] bg-bg text-text">
      <header className="flex items-center justify-between border-b border-border bg-surface px-4">
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-semibold tracking-tight">Roomwright</span>
          <span className="section-label">room planner</span>
        </div>
        <span className="tabular text-xs text-text-muted">v0.1.0</span>
      </header>

      <div className="grid grid-cols-[20rem_1fr_20rem] overflow-hidden">
        <aside className="border-r border-border bg-surface p-4">
          <p className="section-label">Catalogue</p>
        </aside>

        <main className="relative bg-surface-sunk">
          <SceneCanvas />
        </main>

        <aside className="border-l border-border bg-surface p-4">
          <p className="section-label">Inspector</p>
        </aside>
      </div>
    </div>
  );
}
