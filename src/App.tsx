import { useEffect } from "react";
import { useWebMCPTools } from "./webmcp/register";
import { ROOMWRIGHT_TOOLS } from "./webmcp/tools";
import { useStore } from "./state/store";
import { loadSaved, startAutosave } from "./state/persistence";
import { SceneCanvas } from "./scene/SceneCanvas";
import { TopBar } from "./ui/TopBar";
import { CatalogRail } from "./ui/CatalogRail";
import { Inspector } from "./ui/Inspector";
import { LayoutStatus } from "./ui/LayoutStatus";
import { EmptyRoom } from "./ui/EmptyRoom";
import { DebugPanel } from "./ui/DebugPanel";
import { useShortcuts } from "./ui/useShortcuts";

const DEBUG =
  typeof window !== "undefined" && new URLSearchParams(window.location.search).has("debug");

export function App() {
  useWebMCPTools(ROOMWRIGHT_TOOLS);
  useShortcuts();

  useEffect(() => {
    const saved = loadSaved();
    if (saved) useStore.getState().hydrate(saved);
    return startAutosave();
  }, []);

  return (
    <div className="grain grid h-full grid-rows-[3.25rem_1fr] bg-bg text-text">
      <TopBar />

      <div className="grid grid-cols-[20rem_1fr_20rem] overflow-hidden">
        <aside
          className="relative z-10 border-r border-border bg-surface"
          style={{ boxShadow: "1px 0 0 rgba(42,40,36,0.02), 8px 0 24px -16px rgba(42,40,36,0.1)" }}
        >
          <CatalogRail />
        </aside>

        <main className="relative bg-surface-sunk">
          <SceneCanvas />
          <EmptyRoom />
          <LayoutStatus />
        </main>

        <aside
          className="relative z-10"
          style={{
            boxShadow: "-1px 0 0 rgba(42,40,36,0.02), -8px 0 24px -16px rgba(42,40,36,0.1)",
          }}
        >
          {DEBUG ? <DebugPanel /> : <Inspector />}
        </aside>
      </div>
    </div>
  );
}
