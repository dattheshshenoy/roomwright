import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, Warning, WarningOctagon } from "@phosphor-icons/react";
import { useStore } from "../state/store";
import { useLayoutReport } from "../state/useLayoutReport";
import { formatLength } from "../lib/units";

/** Compact standing readout of the layout's health, bottom-centre of the canvas.
 *  Hidden until there is at least one piece. */
export function LayoutStatus() {
  const count = useStore((s) => s.placements.length);
  const unitSystem = useStore((s) => s.unitSystem);
  const report = useLayoutReport();

  const conflicts = report.issues.filter((i) => i.status === "bad").length;
  const tight = report.issues.filter((i) => i.status === "warn").length;

  const tone =
    report.status === "bad"
      ? "border-[color:var(--color-bad-fg)]/30 bg-bad-bg text-bad-fg"
      : report.status === "warn"
        ? "border-[color:var(--color-warn-fg)]/25 bg-warn-bg text-warn-fg"
        : "border-[color:var(--color-ok-fg)]/25 bg-ok-bg text-ok-fg";

  const Icon =
    report.status === "bad" ? WarningOctagon : report.status === "warn" ? Warning : CheckCircle;

  const label =
    report.status === "ok"
      ? "Layout is clear"
      : [
          conflicts > 0 ? `${conflicts} conflict${conflicts > 1 ? "s" : ""}` : null,
          tight > 0 ? `${tight} tight spot${tight > 1 ? "s" : ""}` : null,
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: 12, x: "-50%" }}
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
          style={{ boxShadow: "var(--shadow-panel)" }}
          className={`pointer-events-none absolute bottom-4 left-1/2 flex items-center gap-2 rounded-md border px-3 py-1.5 text-[13px] ${tone}`}
        >
          <Icon size={15} weight="fill" />
          <motion.span key={label}>{label}</motion.span>
          {report.narrowestWalkway !== null && (
            <span className="tabular opacity-70">
              &middot; narrowest gap {formatLength(report.narrowestWalkway, unitSystem)}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
