import { useEffect, useState } from "react";
import { useWebMCPTools } from "./webmcp/register";
import { ROOMWRIGHT_TOOLS } from "./webmcp/tools";
import { useStore } from "./state/store";
import { loadSaved, startAutosave } from "./state/persistence";
import { layoutFromUrl } from "./lib/share";
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

const NARROW = "(max-width: 1099px)";
const isNarrow = () => typeof window !== "undefined" && window.matchMedia(NARROW).matches;

export function App() {
  useWebMCPTools(ROOMWRIGHT_TOOLS);
  useShortcuts();
  const [railOpen, setRailOpen] = useState(() => !isNarrow());
  const [inspectorOpen, setInspectorOpen] = useState(() => !isNarrow());

  useEffect(() => {
    const shared = layoutFromUrl();
    const saved = shared ?? loadSaved();
    if (saved) useStore.getState().hydrate(saved);
    return startAutosave();
  }, []);

  // collapse both rails when the viewport crosses below the breakpoint; leave
  // the user in control otherwise
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setRailOpen(false);
        setInspectorOpen(false);
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="grain grid h-full grid-rows-[3.25rem_1fr] overflow-hidden bg-bg text-text">
      <TopBar />

      <div className="flex min-h-0 overflow-hidden">
        <aside
          className="relative z-10 flex min-h-0 shrink-0 flex-col overflow-hidden border-r border-border bg-surface transition-[width] duration-200"
          style={{
            width: railOpen ? "19rem" : "3rem",
            boxShadow: "1px 0 0 rgba(42,40,36,0.02), 8px 0 24px -16px rgba(42,40,36,0.1)",
          }}
        >
          <CatalogRail open={railOpen} onToggle={() => setRailOpen((v) => !v)} />
        </aside>

        <main className="relative min-h-0 min-w-0 flex-1 bg-surface-sunk">
          <SceneCanvas />
          <EmptyRoom />
          <LayoutStatus />
        </main>

        <aside
          className="relative z-10 min-h-0 shrink-0 overflow-hidden transition-[width] duration-200"
          style={{
            width: DEBUG || inspectorOpen ? "20rem" : "3rem",
            boxShadow: "-1px 0 0 rgba(42,40,36,0.02), -8px 0 24px -16px rgba(42,40,36,0.1)",
          }}
        >
          {DEBUG ? (
            <DebugPanel />
          ) : (
            <Inspector open={inspectorOpen} onToggle={() => setInspectorOpen((v) => !v)} />
          )}
        </aside>
      </div>
    </div>
  );
}
