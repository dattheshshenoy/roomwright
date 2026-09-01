import { useSyncExternalStore, type ReactNode } from "react";
import {
  ArrowClockwise,
  ArrowsOut,
  ArrowsOutCardinal,
  CaretDown,
  CheckCircle,
  Copy,
  Eye,
  ListBullets,
  MapPin,
  PaintBrushBroad,
  Plus,
  Receipt,
  Ruler,
  TrashSimple,
} from "@phosphor-icons/react";
import { webmcpAvailable } from "../webmcp/register";
import { ROOMWRIGHT_TOOLS } from "../webmcp/tools";
import { Popover } from "./primitives/Popover";

interface ToolMeta {
  name: string;
  blurb: string;
  icon: ReactNode;
}

interface ToolGroup {
  label: string;
  hint: string;
  tools: ToolMeta[];
}

const GROUPS: ToolGroup[] = [
  {
    label: "Read",
    hint: "the agent inspects, nothing changes",
    tools: [
      {
        name: "get_room",
        blurb: "room size, openings, every placed piece with its id",
        icon: <Eye size={14} />,
      },
      {
        name: "list_catalog",
        blurb: "the catalogue — dimensions, variants, price, clearance",
        icon: <ListBullets size={14} />,
      },
      {
        name: "get_shopping_list",
        blurb: "placed pieces as a costed list with a total",
        icon: <Receipt size={14} />,
      },
    ],
  },
  {
    label: "Place",
    hint: "add and remove pieces",
    tools: [
      {
        name: "add_item",
        blurb: "put a piece in the room, auto- or exactly positioned",
        icon: <Plus size={14} />,
      },
      {
        name: "duplicate_item",
        blurb: "another copy of a piece, offset so it fits",
        icon: <Copy size={14} />,
      },
      { name: "remove_item", blurb: "take a piece out", icon: <TrashSimple size={14} /> },
    ],
  },
  {
    label: "Arrange",
    hint: "adjust what's already there",
    tools: [
      {
        name: "move_item",
        blurb: "reposition a piece, clamped inside the room",
        icon: <ArrowsOutCardinal size={14} />,
      },
      {
        name: "rotate_item",
        blurb: "turn a piece, snapped to 15 degrees",
        icon: <ArrowClockwise size={14} />,
      },
      {
        name: "resize_item",
        blurb: "override a piece's width, depth, or height",
        icon: <ArrowsOut size={14} />,
      },
      {
        name: "set_variant",
        blurb: "change a piece's colour or material",
        icon: <PaintBrushBroad size={14} />,
      },
    ],
  },
  {
    label: "Room & checks",
    hint: "the space itself, and whether the layout works",
    tools: [
      {
        name: "set_room_dimensions",
        blurb: "resize the room; pieces are kept inside",
        icon: <Ruler size={14} />,
      },
      {
        name: "suggest_spot",
        blurb: "where a piece could go — open areas, clear wall runs",
        icon: <MapPin size={14} />,
      },
      {
        name: "check_layout",
        blurb: "collisions, blocked doors, clearances, walkways",
        icon: <CheckCircle size={14} />,
      },
    ],
  },
];

const TOTAL = GROUPS.reduce((n, g) => n + g.tools.length, 0);

if (import.meta.env.DEV && TOTAL !== ROOMWRIGHT_TOOLS.length) {
  console.warn(
    `[ToolsBadge] lists ${TOTAL} tools but ${ROOMWRIGHT_TOOLS.length} are registered — update GROUPS.`,
  );
}

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

  return (
    <Popover
      width={380}
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
          <span className="tabular text-text">{TOTAL} tools</span>
          <CaretDown size={11} weight="bold" className="text-text-muted" />
        </span>
      )}
    >
      <div className="flex items-start gap-2.5 border-b border-border px-4 py-3">
        <span
          className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${connected ? "bg-ok-fg" : "bg-text-muted"}`}
        />
        <div>
          <p className="text-[13px] text-text">{TOTAL} tools this page gives your agent</p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-text-muted">
            {connected
              ? "An agent is connected — it can call these now."
              : "No agent yet. Open in ChatGPT’s desktop browser, or Chrome 149+ with the WebMCP flag."}
          </p>
        </div>
      </div>

      <div className="max-h-[24rem] overflow-y-auto">
        {GROUPS.map((g) => (
          <section key={g.label} className="border-b border-border last:border-0">
            <div className="flex items-baseline gap-2 px-4 pb-1 pt-3">
              <h3 className="section-label">{g.label}</h3>
              <span className="text-[11px] text-text-muted">{g.hint}</span>
            </div>
            <ul className="pb-1.5">
              {g.tools.map((t) => (
                <li key={t.name} className="flex items-start gap-2.5 px-4 py-1.5">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border bg-surface-sunk text-text-muted">
                    {t.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="tabular text-[12px] text-text">{t.name}</p>
                    <p className="text-[11px] leading-snug text-text-muted">{t.blurb}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="border-t border-border px-4 py-2.5">
        <p className="text-[11px] leading-relaxed text-text-muted">
          Every call is logged in Agent activity. Tools touch the room&rsquo;s contents only — never
          the camera or the view.
        </p>
      </div>
    </Popover>
  );
}
