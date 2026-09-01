import { useMemo } from "react";
import { Trash } from "@phosphor-icons/react";
import { useStore } from "../state/store";
import { computeShoppingList, resolveSelected } from "../state/selectors";
import { useLayoutReport } from "../state/useLayoutReport";
import { getVariant } from "../catalog/variants";
import { formatFootprint, formatLength, formatPrice } from "../lib/units";
import { Field, NumberInput } from "./primitives/Field";
import { Button } from "./primitives/Button";
import { AgentLog } from "./AgentLog";

export function Inspector() {
  const placements = useStore((s) => s.placements);
  const selectedId = useStore((s) => s.selectedId);
  const selected = useMemo(() => resolveSelected(placements, selectedId), [placements, selectedId]);

  return (
    <div className="grid h-full grid-rows-[1fr_auto] overflow-hidden border-l border-border bg-surface">
      <div className="min-h-0 overflow-y-auto">
        {selected ? <PieceInspector /> : <RoomInspector />}
      </div>
      <AgentLog />
    </div>
  );
}

function PieceInspector() {
  const unitSystem = useStore((s) => s.unitSystem);
  const setVariant = useStore((s) => s.setVariant);
  const rotatePlacement = useStore((s) => s.rotatePlacement);
  const removePlacement = useStore((s) => s.removePlacement);
  const placements = useStore((s) => s.placements);
  const selectedId = useStore((s) => s.selectedId);
  const report = useLayoutReport();

  const sel = useMemo(() => resolveSelected(placements, selectedId), [placements, selectedId]);
  if (!sel) return null;

  const { placement, product } = sel;
  const variant = getVariant(product, placement.variantId);
  const issues = report.issues.filter((i) => i.placementId === placement.id);
  const rotationDeg = Math.round((placement.rotationY * 180) / Math.PI);

  return (
    <div className="animate-rise flex flex-col">
      <div className="border-b border-border px-4 py-3">
        <p className="section-label">Selected piece</p>
        <p className="mt-0.5 text-[15px] text-text">{product.name}</p>
        <p className="tabular text-[12px] text-text-muted">
          {formatFootprint(product.dims.w, product.dims.d, unitSystem)} &middot;{" "}
          {formatLength(product.dims.h, unitSystem)} tall &middot; {formatPrice(product.price)}
        </p>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        <Field label="Finish">
          <div className="flex flex-wrap gap-1.5">
            {product.variants.map((v) => (
              <button
                key={v.id}
                title={v.name}
                onClick={() => setVariant(placement.id, v.id)}
                className={`h-7 w-7 rounded-[5px] border transition-transform ${
                  v.id === variant.id
                    ? "border-accent ring-2 ring-accent-sunk"
                    : "border-border hover:scale-105"
                }`}
                style={{ background: v.color }}
              />
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="Position X">
            <span className="tabular rounded-md border border-border bg-surface-sunk px-2 py-1.5 text-[13px]">
              {formatLength(placement.x, unitSystem)}
            </span>
          </Field>
          <Field label="Position Z">
            <span className="tabular rounded-md border border-border bg-surface-sunk px-2 py-1.5 text-[13px]">
              {formatLength(placement.z, unitSystem)}
            </span>
          </Field>
        </div>

        <Field label="Rotation">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => rotatePlacement(placement.id, -Math.PI / 12)}
            >
              &minus;15&deg;
            </Button>
            <span className="tabular flex-1 text-center text-[13px]">{rotationDeg}&deg;</span>
            <Button variant="secondary" onClick={() => rotatePlacement(placement.id, Math.PI / 12)}>
              +15&deg;
            </Button>
          </div>
        </Field>

        {issues.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {issues.map((i, n) => (
              <li
                key={n}
                className={`rounded-md px-2.5 py-1.5 text-[12px] leading-snug ${
                  i.status === "bad" ? "bg-bad-bg text-bad-fg" : "bg-warn-bg text-warn-fg"
                }`}
              >
                {i.message}
              </li>
            ))}
          </ul>
        )}

        <Button variant="secondary" onClick={() => removePlacement(placement.id)}>
          <Trash size={14} />
          Remove piece
        </Button>
      </div>
    </div>
  );
}

function RoomInspector() {
  const room = useStore((s) => s.room);
  const unitSystem = useStore((s) => s.unitSystem);
  const setRoomDimensions = useStore((s) => s.setRoomDimensions);
  const reset = useStore((s) => s.reset);
  const placements = useStore((s) => s.placements);
  const shopping = useMemo(() => computeShoppingList(placements), [placements]);

  return (
    <div className="flex flex-col">
      <div className="border-b border-border px-4 py-3">
        <p className="section-label">Room</p>
        <p className="tabular mt-0.5 text-[13px] text-text-muted">
          {formatLength(room.width, unitSystem)} &times; {formatLength(room.length, unitSystem)}{" "}
          &times; {formatLength(room.height, unitSystem)}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 py-4">
        <Field label="Width">
          <NumberInput
            value={room.width}
            min={2}
            max={12}
            onCommit={(v) => setRoomDimensions({ width: v })}
            suffix="m"
          />
        </Field>
        <Field label="Length">
          <NumberInput
            value={room.length}
            min={2}
            max={12}
            onCommit={(v) => setRoomDimensions({ length: v })}
            suffix="m"
          />
        </Field>
        <Field label="Height">
          <NumberInput
            value={room.height}
            min={2.2}
            max={4}
            onCommit={(v) => setRoomDimensions({ height: v })}
            suffix="m"
          />
        </Field>
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="section-label">Shopping list</p>
          <span className="tabular text-[13px] text-text">{formatPrice(shopping.total)}</span>
        </div>
        {shopping.lines.length === 0 ? (
          <p className="mt-1 text-[13px] text-text-muted">Nothing placed yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {shopping.lines.map((l) => (
              <li
                key={l.productId}
                className="flex items-center justify-between py-1.5 text-[13px]"
              >
                <span className="text-text">
                  <span className="tabular text-text-muted">{l.quantity}&times;</span> {l.name}
                </span>
                <span className="tabular text-text-muted">{formatPrice(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-4 py-3">
        <Button variant="ghost" onClick={reset}>
          Reset room
        </Button>
      </div>
    </div>
  );
}
