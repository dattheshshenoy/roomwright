import { useWebMCPTools } from "./webmcp/register";
import { ROOMWRIGHT_TOOLS } from "./webmcp/tools";
import { SceneCanvas } from "./scene/SceneCanvas";
import { CatalogRail } from "./ui/CatalogRail";
import { LayoutStatus } from "./ui/LayoutStatus";
import { DebugPanel } from "./ui/DebugPanel";
import { useShortcuts } from "./ui/useShortcuts";

const DEBUG =
  typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");

export function App() {
  useWebMCPTools(ROOMWRIGHT_TOOLS);
  useShortcuts();

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
        <aside className="border-r border-border bg-surface">
          <CatalogRail />
        </aside>

        <main className="relative bg-surface-sunk">
          <SceneCanvas />
          <LayoutStatus />
        </main>

        {DEBUG ? (
          <DebugPanel />
        ) : (
          <aside className="border-l border-border bg-surface p-4">
            <p className="section-label">Inspector</p>
          </aside>
        )}
      </div>
    </div>
  );
}
