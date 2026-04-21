import { useMemo, useState, type DragEvent } from "react";
import {
  Clock,
  Coins,
  TrendingUp,
  ArrowLeftRight,
  Search,
  type LucideIcon,
} from "lucide-react";
import type { NodeKind } from "../store/graphStore";
import { accentTileStyle } from "../nodes/nodeStyles";

export interface PaletteItem {
  kind: NodeKind;
  nodeType: string;
  label: string;
  description: string;
  defaultParams: Record<string, unknown>;
}

interface PaletteItemWithIcon extends PaletteItem {
  icon: LucideIcon;
}

type PaletteGroupKey = "Triggers" | "Assets" | "Strategies" | "Actions";

const GROUP_ORDER: PaletteGroupKey[] = [
  "Triggers",
  "Assets",
  "Strategies",
  "Actions",
];

const GROUP_BY_KIND: Record<NodeKind, PaletteGroupKey> = {
  trigger: "Triggers",
  asset: "Assets",
  strategy: "Strategies",
  action: "Actions",
};

// Empty asset defaults — no hardcoded XLM/USDC. Strategy also has no
// pre-filled `pair`; it's derived from connected Asset nodes via
// baseAssetId/quoteAssetId, with the `pair` field as a fallback override.
const ITEMS: PaletteItemWithIcon[] = [
  {
    kind: "trigger",
    nodeType: "time_interval",
    label: "Time Trigger",
    description: "Fire on an interval",
    icon: Clock,
    defaultParams: { interval: 5 },
  },
  {
    kind: "asset",
    nodeType: "stellar_asset",
    label: "Stellar Asset",
    description: "Code + optional issuer",
    icon: Coins,
    defaultParams: { code: "", issuer: "" },
  },
  {
    kind: "strategy",
    nodeType: "arbitrage",
    label: "Arbitrage Strategy",
    description: "DEX vs external price",
    icon: TrendingUp,
    defaultParams: {
      threshold: 0.02,
      feeBps: 10,
      slippageBps: 20,
      dryRun: true,
      notional: 100,
      baseAssetId: null,
      quoteAssetId: null,
    },
  },
  {
    kind: "action",
    nodeType: "trade",
    label: "Trade Action",
    description: "Execute on Stellar DEX",
    icon: ArrowLeftRight,
    defaultParams: {
      amount: "10",
      baseAssetId: null,
      quoteAssetId: null,
    },
  },
];

export const PALETTE_ITEMS: PaletteItem[] = ITEMS.map(
  ({ icon: _icon, ...rest }) => rest
);

const groupLabelStyle: React.CSSProperties = {
  fontSize: "10px",
  fontWeight: 600,
  color: "#71717a",
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  paddingLeft: "4px",
};

export default function NodePalette() {
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? ITEMS.filter(
          (it) =>
            it.label.toLowerCase().includes(q) ||
            it.description.toLowerCase().includes(q) ||
            it.nodeType.toLowerCase().includes(q)
        )
      : ITEMS;
    const map = new Map<PaletteGroupKey, PaletteItemWithIcon[]>();
    for (const g of GROUP_ORDER) map.set(g, []);
    for (const it of filtered) {
      map.get(GROUP_BY_KIND[it.kind])!.push(it);
    }
    return map;
  }, [query]);

  const onDragStart = (
    e: DragEvent<HTMLDivElement>,
    item: PaletteItemWithIcon
  ) => {
    const { icon: _icon, ...serializable } = item;
    void _icon;
    e.dataTransfer.setData(
      "application/flowpay-node",
      JSON.stringify(serializable)
    );
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        padding: "16px",
        gap: "20px",
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        <Search
          size={14}
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#a1a1aa",
          }}
        />
        <input
          placeholder="Search nodes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px 8px 34px",
            border: "1px solid #e4e4e7",
            borderRadius: "6px",
            backgroundColor: "#ffffff",
            color: "#09090b",
            fontSize: "13px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          overflowY: "auto",
          paddingBottom: "32px",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {GROUP_ORDER.map((group) => {
          const items = groups.get(group) ?? [];
          if (items.length === 0) return null;

          return (
            <div
              key={group}
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <div style={groupLabelStyle}>{group}</div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={`${item.kind}:${item.nodeType}`}
                      draggable
                      onDragStart={(e) => onDragStart(e, item)}
                      title="Drag onto canvas"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#f4f4f5";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#ffffff";
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px",
                        backgroundColor: "#ffffff",
                        border: "1px solid #e4e4e7",
                        borderRadius: "8px",
                        cursor: "grab",
                        transition:
                          "background-color 0.15s ease, border-color 0.15s ease",
                      }}
                    >
                      <div style={accentTileStyle(item.kind, 32)}>
                        <Icon size={16} strokeWidth={2} />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#09090b",
                            letterSpacing: "-0.2px",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            fontWeight: 400,
                            color: "#a1a1aa",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                          }}
                        >
                          {item.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
