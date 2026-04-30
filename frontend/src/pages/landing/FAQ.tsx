import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { SectionHead } from "./HowItWorks";

const section: React.CSSProperties = {
  padding: "72px 24px",
  maxWidth: 820,
  margin: "0 auto",
};

const items: { q: string; a: string }[] = [
  {
    q: "Is this custodial?",
    a: "No. Your main wallet never signs anything past the initial authorization. spay uses a scoped, ephemeral session key that you approve once. It can only do what the policy allows (pair, max notional, TTL), and you can revoke it at any time.",
  },
  {
    q: "Does it run on mainnet?",
    a: "Right now we're in private beta on Stellar testnet. Mainnet access is rolling out to waitlist cohorts over the coming weeks.",
  },
  {
    q: "What strategies are supported?",
    a: "Today: cross-venue arbitrage (Stellar DEX vs. Binance reference price) on a set of curated pairs. Time-based triggers are live. Payment and price-move triggers are next.",
  },
  {
    q: "What happens if my session key is compromised?",
    a: "Worst case, the attacker can only submit trades within your policy (say, 100 USDC on XLM/USDC) until TTL expires or you hit revoke. Your main account is untouched.",
  },
  {
    q: "What does it cost?",
    a: "During beta, nothing. At launch we'll charge a small per-trade fee or a flat monthly. We'll be public with pricing well before you have to pay anything.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" style={section}>
      <SectionHead eyebrow="FAQ" title="Things people ask." />
      <div
        style={{
          marginTop: 28,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {items.map((it, i) => {
          const active = open === i;
          return (
            <div
              key={it.q}
              style={{
                background: "var(--bg-panel)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                transition: "border-color var(--dur-fast)",
              }}
            >
              <button
                onClick={() => setOpen(active ? null : i)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "16px 18px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text)",
                  fontSize: 14,
                  fontWeight: 600,
                  textAlign: "left",
                  letterSpacing: "-0.1px",
                }}
              >
                {it.q}
                <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                  {active ? <Minus size={16} /> : <Plus size={16} />}
                </span>
              </button>
              {active && (
                <div
                  style={{
                    padding: "0 18px 18px 18px",
                    fontSize: 13,
                    color: "var(--text-muted)",
                    lineHeight: 1.65,
                  }}
                >
                  {it.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
