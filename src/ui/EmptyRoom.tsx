import { useStore } from "../state/store";
import { webmcpAvailable } from "../webmcp/register";

/** Shown over the canvas until the first piece lands. */
export function EmptyRoom() {
  const count = useStore((s) => s.placements.length);
  if (count > 0) return null;

  return (
    <div className="animate-rise pointer-events-none absolute inset-x-0 bottom-10 flex justify-center">
      <div className="pointer-events-auto max-w-sm rounded-lg border border-border bg-surface/90 px-4 py-3 text-center backdrop-blur">
        <p className="text-[13px] text-text">This room is empty.</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-text-muted">
          Add a piece from the catalogue, or{" "}
          {webmcpAvailable()
            ? "ask your agent to furnish it."
            : "open this page in ChatGPT’s browser and ask your agent to furnish it."}
        </p>
      </div>
    </div>
  );
}
