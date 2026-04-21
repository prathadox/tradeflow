import type { ChangeEvent, CSSProperties } from "react";
import { useMemo } from "react";
import { useGraphStore, type FlowNode } from "../store/graphStore";
import { useWalletStore } from "../store/walletStore";
import { truncateIssuer } from "../nodes/nodeStyles";
import {
  findPresetMatch,
  presetsForNetwork,
  PAIR_PRESETS,
} from "../lib/assetPresets";
import Select, { type SelectOption } from "./Select";

const labelStyle: CSSProperties = {
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  color: "#71717a",
  fontWeight: 600,
  marginBottom: "6px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  backgroundColor: "#ffffff",
  border: "1px solid #e4e4e7",
  borderRadius: "6px",
  color: "#09090b",
  fontSize: "13px",
  outline: "none",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};

const sectionHeaderStyle: CSSProperties = {
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.8px",
  fontWeight: 600,
  color: "#71717a",
};

const helperStyle: CSSProperties = {
  fontSize: "11px",
  color: "#a1a1aa",
  marginTop: "4px",
  lineHeight: 1.4,
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
          borderBottom: "1px solid #e4e4e7",
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
              color: "#71717a",
              cursor: "pointer",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "16px",
              lineHeight: 1,
              transition: "background-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f4f4f5";
              e.currentTarget.style.color = "#09090b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#71717a";
            }}
          >
            ×
          </button>
        </div>
        <div
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#09090b",
            letterSpacing: "-0.2px",
          }}
        >
          {node.data.label}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
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
          return (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={labelStyle} htmlFor="field-assetPreset">
                Preset
              </label>
              <Select
                id="field-assetPreset"
                value={selectedPresetId}
                options={presetOptions}
                onChange={onPresetChange}
              />
              <div style={helperStyle}>
                {matched?.note ??
                  (matched
                    ? matched.binance
                      ? "Has Binance reference price — arbitrage-capable."
                      : "Valid Stellar asset; no Binance ticker."
                    : "Pick a preset or enter a custom code + issuer below.")}
              </div>
            </div>
          );
        })()}

        {node.data.kind === "asset" && (
          <>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={labelStyle} htmlFor="field-code">
                Asset code
              </label>
              <input
                id="field-code"
                style={inputStyle}
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
              <div style={helperStyle}>Asset code required to connect to a strategy.</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={labelStyle} htmlFor="field-issuer">
                Issuer
              </label>
              <input
                id="field-issuer"
                style={inputStyle}
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
            </div>
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
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={labelStyle} htmlFor="field-pair">
                Pair
              </label>
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
              <div style={helperStyle}>
                Pick a ready pair, or choose <b>Derive</b> and wire Asset nodes
                to the strategy&rsquo;s left handle for a custom combo.
              </div>
            </div>
          );
        })()}

        {fields.length === 0 && !showAssetSelectors && node.data.kind !== "asset" && (
          <div
            style={{ color: "#a1a1aa", fontSize: "13px", fontStyle: "italic" }}
          >
            No configurable parameters.
          </div>
        )}

        {fields.map((f) => {
          const v = node.data.params[f.key];

          if (f.type === "checkbox") {
            return (
              <div key={f.key}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!v}
                    onChange={onFieldChange(f.key, f)}
                    style={{
                      width: "16px",
                      height: "16px",
                      accentColor: "#09090b",
                      cursor: "pointer",
                      margin: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#3f3f46",
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
            <div
              key={f.key}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <label style={labelStyle} htmlFor={`field-${f.key}`}>
                {f.label}
              </label>
              <input
                id={`field-${f.key}`}
                style={{
                  ...inputStyle,
                  borderColor: err ? "#dc2626" : "#e4e4e7",
                }}
                type={f.type}
                value={v === undefined || v === null ? "" : String(v)}
                onChange={onFieldChange(f.key, f)}
                placeholder={f.placeholder ?? `Enter ${f.label.toLowerCase()}…`}
                maxLength={f.maxLength}
                min={f.min}
                max={f.max}
                onFocus={(e) => {
                  if (!err) e.currentTarget.style.borderColor = "#09090b";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = err ? "#dc2626" : "#e4e4e7";
                }}
              />
              {err ? (
                <div style={{ ...helperStyle, color: "#dc2626" }}>{err}</div>
              ) : (
                f.helper && <div style={helperStyle}>{f.helper}</div>
              )}
            </div>
          );
        })}

        {showAssetSelectors && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              paddingTop: "14px",
              borderTop: "1px solid #e4e4e7",
            }}
          >
            <div style={sectionHeaderStyle}>Assets</div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={labelStyle} htmlFor="field-baseAssetId">
                Base asset
              </label>
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
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={labelStyle} htmlFor="field-quoteAssetId">
                Quote asset
              </label>
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
            </div>

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
