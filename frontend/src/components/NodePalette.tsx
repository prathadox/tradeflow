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
import Input from "../ui/Input";

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
  fontSize: 10,
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.9px",
  paddingLeft: 4,
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
        padding: 16,
        gap: 20,
      }}
    >
      <Input
        placeholder="Search nodes…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        leadingAdornment={<Search size={13} />}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          overflowY: "auto",
          paddingBottom: 32,
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
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              <div style={groupLabelStyle}>{group}</div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
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
                        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
                        e.currentTarget.style.borderColor = "var(--border-strong)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "var(--bg-panel)";
                        e.currentTarget.style.borderColor = "var(--border)";
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: 10,
                        background: "var(--bg-panel)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        cursor: "grab",
                        transition:
                          "background-color var(--dur-fast), border-color var(--dur-fast)",
                      }}
                    >
                      <div style={accentTileStyle(item.kind, 30)}>
                        <Icon size={15} strokeWidth={2} />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: "var(--text)",
                            letterSpacing: "-0.1px",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                          }}
                        >
                          {item.label}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 400,
                            color: "var(--text-dim)",
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
