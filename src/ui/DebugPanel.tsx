import { useState } from "react";
import { ROOMWRIGHT_TOOLS } from "../webmcp/tools";
import { Button } from "./primitives/Button";

const SAMPLES: Record<string, string> = {
  roomwright_get_room: "{}",
  roomwright_list_catalog: '{ "category": "seating" }',
  roomwright_add_item: '{ "product_id": "sofa-halden" }',
  roomwright_move_item: '{ "placement_id": "", "x": 2, "z": 2 }',
  roomwright_rotate_item: '{ "placement_id": "", "degrees": 90 }',
  roomwright_remove_item: '{ "placement_id": "" }',
  roomwright_set_room_dimensions: '{ "width": 5, "length": 6 }',
  roomwright_check_layout: "{}",
};

/** Dev-only harness (append ?debug). Runs the WebMCP tools directly against the
 *  store so the whole flow is verifiable without an agent. */
export function DebugPanel() {
  const [tool, setTool] = useState(ROOMWRIGHT_TOOLS[0].name);
  const [args, setArgs] = useState(SAMPLES[ROOMWRIGHT_TOOLS[0].name]);
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const descriptor = ROOMWRIGHT_TOOLS.find((t) => t.name === tool)!;
      const parsed = args.trim() ? JSON.parse(args) : {};
      const res = await descriptor.execute(parsed);
      setOut(res.content.map((c) => c.text).join("\n"));
    } catch (err) {
      setOut(`error: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col border-l border-border bg-surface">
      <div className="border-b border-border px-4 py-3">
        <p className="section-label">Tool harness</p>
        <p className="mt-0.5 text-[13px] text-text-muted">Direct WebMCP calls, no agent.</p>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        <label className="flex flex-col gap-1">
          <span className="section-label">Tool</span>
          <select
            value={tool}
            onChange={(e) => {
              setTool(e.target.value);
              setArgs(SAMPLES[e.target.value] ?? "{}");
              setOut("");
            }}
            className="tabular rounded-md border border-border bg-surface-sunk px-2 py-1.5 text-[13px]"
          >
            {ROOMWRIGHT_TOOLS.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name.replace("roomwright_", "")}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="section-label">Arguments (JSON)</span>
          <textarea
            value={args}
            onChange={(e) => setArgs(e.target.value)}
            spellCheck={false}
            className="tabular h-20 resize-none rounded-md border border-border bg-surface-sunk p-2 text-[12px]"
          />
        </label>
        <Button variant="primary" onClick={run} disabled={busy}>
          Run tool
        </Button>
        {out && (
          <pre className="tabular whitespace-pre-wrap break-words rounded-md border border-border bg-surface-sunk p-2 text-[11px] leading-relaxed text-text">
            {out}
          </pre>
        )}
      </div>
    </div>
  );
}
