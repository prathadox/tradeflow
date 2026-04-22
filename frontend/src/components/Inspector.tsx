import type { ChangeEvent, CSSProperties } from "react";
import { useMemo } from "react";
import { X } from "lucide-react";
import { useGraphStore, type FlowNode } from "../store/graphStore";
import { useWalletStore } from "../store/walletStore";
import { truncateIssuer } from "../nodes/nodeStyles";
import {
  findPresetMatch,
  presetsForNetwork,
  PAIR_PRESETS,
} from "../lib/assetPresets";
import Select, { type SelectOption } from "./Select";
import Field from "../ui/Field";
import Input from "../ui/Input";

const sectionHeaderStyle: CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.9px",
  fontWeight: 600,
  color: "var(--text-muted)",
};

const helperStyle: CSSProperties = {
  fontSize: 11,
  color: "var(--text-dim)",
  lineHeight: 1.5,
};

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "checkbox";
  placeholder?: string;
  uppercase?: boolean;
  maxLength?: number;
  helper?: string;
  min?: number;
  max?: number;
}

function validationError(def: FieldDef, value: unknown): string | null {
  if (def.type !== "number") return null;
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return "Must be a number";
  if (def.min !== undefined && n < def.min) return `Min ${def.min}`;
  if (def.max !== undefined && n > def.max) return `Max ${def.max}`;
  return null;
}

const STRATEGY_FIELDS: FieldDef[] = [
  { key: "threshold", label: "Threshold", type: "number", min: 0.0005, max: 1, helper: "Net edge required to execute. 0.02 = 2%." },
  { key: "feeBps", label: "Fee (bps)", type: "number", min: 0, max: 1000 },
  { key: "slippageBps", label: "Slippage (bps)", type: "number", min: 0, max: 1000 },
  { key: "notional", label: "Notional (quote units)", type: "number", min: 1, helper: "Trade size per tick; capped by session policy when live." },
  { key: "dryRun", label: "Dry run", type: "checkbox", helper: "On: log only. Off: actually submit trades (needs session authorization)." },
];

const TRIGGER_FIELDS: FieldDef[] = [
  { key: "interval", label: "Interval (seconds)", type: "number", min: 5, max: 3600, helper: "Lower bound of 5s to avoid rate-limiting Horizon and Binance." },
];

const TRADE_FIELDS: FieldDef[] = [
  { key: "amount", label: "Amount", type: "text" },
];

function labelForAsset(n: FlowNode | undefined): string {
  if (!n) return "— not set —";
  const code = String(n.data.params.code ?? "").trim() || "Untitled";
  const issuer = String(n.data.params.issuer ?? "").trim();
  return issuer ? `${code} · ${truncateIssuer(issuer)}` : `${code} · native`;
}

export default function Inspector() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId);
  const node = useGraphStore((s) =>
    s.nodes.find((n) => n.id === selectedNodeId)
  ) as FlowNode | undefined;
  const allNodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const updateNodeParams = useGraphStore((s) => s.updateNodeParams);
  const walletNetwork = useWalletStore((s) => s.network);
  const walletConnected = useWalletStore((s) => !!s.publicKey);

  const assetPresets = useMemo(
    () => presetsForNetwork(walletConnected ? walletNetwork : null),
    [walletNetwork, walletConnected]
  );

  const connectedAssets = useMemo(() => {
    if (!node) return [] as FlowNode[];
    const acceptsAssets =
      node.data.kind === "strategy" || node.data.kind === "action";
    if (!acceptsAssets) return [];
    const incoming = edges.filter(
      (e) =>
        e.target === node.id &&
        (e.targetHandle === "assets" ||
          e.targetHandle === "base" ||
          e.targetHandle === "quote" ||
          !e.targetHandle)
    );
    const sourceIds = new Set(incoming.map((e) => e.source));
    return allNodes.filter(
      (n) => sourceIds.has(n.id) && n.data.kind === "asset"
    );
  }, [node, edges, allNodes]);

  if (!node) return null;

  const fields: FieldDef[] =
    node.data.nodeType === "arbitrage"
      ? STRATEGY_FIELDS
      : node.data.nodeType === "time_interval"
      ? TRIGGER_FIELDS
      : node.data.nodeType === "trade"
      ? TRADE_FIELDS
      : [];

  const onFieldChange =
    (key: string, def: FieldDef) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      let value: unknown;
      if (def.type === "checkbox") value = e.target.checked;
      else if (def.type === "number") {
        const v = e.target.value;
        value = v === "" ? "" : Number(v);
      } else {
        let v = e.target.value;
        if (def.uppercase) v = v.toUpperCase();
        if (def.maxLength !== undefined) v = v.slice(0, def.maxLength);
        value = v;
      }
      updateNodeParams(node.id, { ...node.data.params, [key]: value });
    };

  const showAssetSelectors =
    node.data.kind === "strategy" || node.data.nodeType === "trade";

  const baseAssetId = (node.data.params.baseAssetId as string | null | undefined) ?? null;
  const quoteAssetId = (node.data.params.quoteAssetId as string | null | undefined) ?? null;

  const assetOptions: SelectOption[] = connectedAssets.map((a) => ({
    value: a.id,
    label: labelForAsset(a),
  }));

  return (
    <div
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={sectionHeaderStyle}>Inspector</div>
          <button
            aria-label="Close inspector"
            onClick={() => setSelectedNodeId(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "var(--radius-xs)",
              display: "inline-flex",
              alignItems: "center",
              transition: "background-color var(--dur-fast), color var(--dur-fast)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-hover)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <X size={14} />
          </button>
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text)",
            letterSpacing: "-0.3px",
          }}
        >
          {node.data.label}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {node.data.kind === "asset" && (() => {
          const currentCode = String(node.data.params.code ?? "");
          const currentIssuer = String(node.data.params.issuer ?? "");
          const matched = findPresetMatch(currentCode, currentIssuer);
          const selectedPresetId = matched?.id ?? "__custom__";
          const presetOptions: SelectOption[] = [
            ...assetPresets.map((p) => ({
              value: p.id,
              label: p.binance ? p.label : `${p.label} — coming soon`,
              hint: p.binance ? "arb-ready" : undefined,
              disabled: !p.binance,
            })),
            { value: "__custom__", label: "Custom…" },
          ];
          const onPresetChange = (id: string) => {
            if (id === "__custom__") {
              updateNodeParams(node.id, {
                ...node.data.params,
                code: "",
                issuer: "",
              });
              return;
            }
            const p = assetPresets.find((x) => x.id === id);
            if (!p) return;
            updateNodeParams(node.id, {
              ...node.data.params,
              code: p.code,
              issuer: p.issuer,
            });
          };
          const hint =
            matched?.note ??
            (matched
              ? matched.binance
                ? "Has Binance reference price — arbitrage-capable."
                : "Valid Stellar asset; no Binance ticker."
              : "Pick a preset or enter a custom code + issuer below.");
          return (
            <Field label="Preset" hint={hint} htmlFor="field-assetPreset">
              <Select
                id="field-assetPreset"
                value={selectedPresetId}
                options={presetOptions}
                onChange={onPresetChange}
              />
            </Field>
          );
        })()}

        {node.data.kind === "asset" && (
          <>
            <Field
              label="Asset code"
              hint="Asset code required to connect to a strategy."
              htmlFor="field-code"
            >
              <Input
                id="field-code"
                type="text"
                value={String(node.data.params.code ?? "")}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase().slice(0, 12);
                  updateNodeParams(node.id, {
                    ...node.data.params,
                    code: v,
                  });
                }}
                placeholder="e.g. XLM, USDC"
                maxLength={12}
              />
            </Field>
            <Field label="Issuer" htmlFor="field-issuer">
              <Input
                id="field-issuer"
                type="text"
                value={String(node.data.params.issuer ?? "")}
                onChange={(e) =>
                  updateNodeParams(node.id, {
                    ...node.data.params,
                    issuer: e.target.value,
                  })
                }
                placeholder="Issuer G… (empty = native)"
              />
            </Field>
          </>
        )}

        {node.data.nodeType === "arbitrage" && (() => {
          const currentPair = String(node.data.params.pair ?? "");
          const pairOptions: SelectOption[] = [
            { value: "__derive__", label: "Derive from connected assets" },
            ...PAIR_PRESETS.map((p) => ({ value: p.value, label: p.label })),
          ];
          const pairValue = currentPair === "" ? "__derive__" : currentPair;
          return (
            <Field
              label="Pair"
              hint={
                <>
                  Pick a ready pair, or choose <b>Derive</b> and wire Asset
                  nodes to the strategy&rsquo;s left handle for a custom combo.
                </>
              }
              htmlFor="field-pair"
            >
              <Select
                id="field-pair"
                value={pairValue}
                options={pairOptions}
                onChange={(v) => {
                  updateNodeParams(node.id, {
                    ...node.data.params,
                    pair: v === "__derive__" ? "" : v,
                  });
                }}
              />
            </Field>
          );
        })()}

        {fields.length === 0 && !showAssetSelectors && node.data.kind !== "asset" && (
          <div style={{ color: "var(--text-dim)", fontSize: 13, fontStyle: "italic" }}>
            No configurable parameters.
          </div>
        )}

        {fields.map((f) => {
          const v = node.data.params[f.key];

          if (f.type === "checkbox") {
            return (
              <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!v}
                    onChange={onFieldChange(f.key, f)}
                    style={{
                      width: 16,
                      height: 16,
                      accentColor: "var(--accent)",
                      cursor: "pointer",
                      margin: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--text)",
                    }}
                  >
                    {f.label}
                  </span>
                </label>
                {f.helper && <div style={helperStyle}>{f.helper}</div>}
              </div>
            );
          }

          const err = validationError(f, v);
          return (
            <Field
              key={f.key}
              label={f.label}
              hint={f.helper}
              error={err ?? undefined}
              htmlFor={`field-${f.key}`}
            >
              <Input
                id={`field-${f.key}`}
                type={f.type}
                value={v === undefined || v === null ? "" : String(v)}
                onChange={onFieldChange(f.key, f)}
                placeholder={f.placeholder ?? `Enter ${f.label.toLowerCase()}…`}
                maxLength={f.maxLength}
                min={f.min}
                max={f.max}
                invalid={!!err}
              />
            </Field>
          );
        })}

        {showAssetSelectors && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              paddingTop: 14,
              borderTop: "1px solid var(--hairline)",
            }}
          >
            <div style={sectionHeaderStyle}>Assets</div>

            <Field label="Base asset" htmlFor="field-baseAssetId">
              <Select
                id="field-baseAssetId"
                value={baseAssetId ?? ""}
                options={[
                  { value: "", label: "— not set —" },
                  ...assetOptions,
                ]}
                onChange={(v) =>
                  updateNodeParams(node.id, {
                    ...node.data.params,
                    baseAssetId: v === "" ? null : v,
                  })
                }
              />
            </Field>

            <Field label="Quote asset" htmlFor="field-quoteAssetId">
              <Select
                id="field-quoteAssetId"
                value={quoteAssetId ?? ""}
                options={[
                  { value: "", label: "— not set —" },
                  ...assetOptions,
                ]}
                onChange={(v) =>
                  updateNodeParams(node.id, {
                    ...node.data.params,
                    quoteAssetId: v === "" ? null : v,
                  })
                }
              />
            </Field>

            {connectedAssets.length === 0 && (
              <div style={helperStyle}>
                Connect Asset nodes to the left-side handle to choose base /
                quote, or pick a Pair above to skip this.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
