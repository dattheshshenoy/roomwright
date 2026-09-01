import { useStore } from "../state/store";

/** Every WebMCP tool call, newest first — so the human can see exactly what the
 *  agent did. */
export function AgentLog() {
  const log = useStore((s) => s.agentLog);
  const entries = [...log].reverse().slice(0, 40);

  return (
    <div className="flex min-h-0 flex-col border-t border-border">
      <div className="flex items-center justify-between px-4 py-2.5">
        <p className="section-label">Agent activity</p>
        <span className="tabular text-[11px] text-text-muted">{log.length}</span>
      </div>

      {entries.length === 0 ? (
        <p className="px-4 pb-4 text-[13px] leading-relaxed text-text-muted">
          No agent calls yet. Open this planner in ChatGPT&rsquo;s browser and ask it to furnish the
          room.
        </p>
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
          {entries.map((e) => (
            <li key={e.id} className="px-4 py-2">
              <div className="flex items-center gap-2">
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${e.ok ? "bg-ok-fg" : "bg-bad-fg"}`}
                />
                <span className="tabular text-[11px] text-text-muted">
                  {e.tool.replace("roomwright_", "")}
                </span>
              </div>
              <p className="mt-0.5 pl-3.5 text-[12px] leading-snug text-text">{e.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
