import { useSyncExternalStore } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { ROOMWRIGHT_TOOLS } from "../webmcp/tools";
import { webmcpAvailable } from "../webmcp/register";
import { Popover } from "./primitives/Popover";

/** navigator.modelContext can appear after load (in-app browser hydration), so
 *  re-check on an interval while the badge is mounted. */
function useWebmcpPresence(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const id = setInterval(cb, 1500);
      return () => clearInterval(id);
    },
    () => webmcpAvailable(),
    () => false,
  );
}

export function ToolsBadge() {
  const connected = useWebmcpPresence();
  const count = ROOMWRIGHT_TOOLS.length;

  return (
    <Popover
      width={360}
      trigger={(open) => (
        <span
          className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[12px] transition-colors ${
            open ? "border-text bg-surface-sunk" : "border-border hover:bg-surface-sunk"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-ok-fg" : "bg-text-muted"}`}
            aria-hidden
          />
          <span className="text-text-muted">WebMCP</span>
          <span className="tabular text-text">{count} tools</span>
          <CaretDown size={11} weight="bold" className="text-text-muted" />
        </span>
      )}
    >
      <div className="border-b border-border px-4 py-3">
        <p className="text-[13px] text-text">{count} tools this page exposes to your agent</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-text-muted">
          {connected
            ? "An agent is connected — it can call these directly."
            : "No agent detected. Open this page in ChatGPT’s browser, or Chrome 149+ with the WebMCP flag."}
        </p>
      </div>
      <ul className="max-h-[22rem] divide-y divide-border overflow-y-auto">
        {ROOMWRIGHT_TOOLS.map((t) => (
          <li key={t.name} className="px-4 py-2.5">
            <p className="tabular text-[12px] text-text">{t.name.replace("roomwright_", "")}</p>
            <p className="mt-0.5 text-[12px] leading-snug text-text-muted">{t.description}</p>
          </li>
        ))}
      </ul>
      <div className="border-t border-border px-4 py-2.5">
        <p className="text-[11px] leading-relaxed text-text-muted">
          Tools act on the room&rsquo;s contents only — products, positions, clearances. They never
          move the camera or the view.
        </p>
      </div>
    </Popover>
  );
}
