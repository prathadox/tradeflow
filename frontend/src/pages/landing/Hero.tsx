import type { CSSProperties } from "react";
import { ArrowRight, PlayCircle } from "lucide-react";
import Button from "../../ui/Button";
import Badge from "../../ui/Badge";
import HeroGraph from "./HeroGraph";

const heroStyle: CSSProperties = {
  padding: "140px 24px 48px",
  maxWidth: 880,
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  position: "relative",
  zIndex: 2,
};

const h1Style: CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: "clamp(48px, 7vw, 84px)",
  lineHeight: 0.98,
  fontWeight: 400,
  letterSpacing: "-0.02em",
  margin: 0,
  color: "var(--text)",
};

const subtitleStyle: CSSProperties = {
  marginTop: 24,
  fontSize: 17,
  color: "var(--text-muted)",
  lineHeight: 1.55,
  maxWidth: 620,
};

const ctaRow: CSSProperties = {
  marginTop: 32,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  justifyContent: "center",
};

const statsRow: CSSProperties = {
  marginTop: 48,
  display: "flex",
  gap: 40,
  flexWrap: "wrap",
  justifyContent: "center",
  paddingTop: 28,
  borderTop: "1px solid var(--hairline)",
  width: "100%",
};

const canvasWrap: CSSProperties = {
  position: "relative",
  width: "100%",
  marginTop: 24,
  marginBottom: 48,
  padding: "0 24px",
};

const canvasFrame: CSSProperties = {
  position: "relative",
  maxWidth: 1200,
  margin: "0 auto",
  height: 440,
  background: "var(--bg-panel)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-xl)",
  overflow: "hidden",
  boxShadow: "var(--shadow-pop)",
};

const gridLayer: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage:
    "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)",
  backgroundSize: "22px 22px",
  maskImage:
    "radial-gradient(ellipse 80% 70% at 50% 50%, black 55%, transparent 100%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 80% 70% at 50% 50%, black 55%, transparent 100%)",
  pointerEvents: "none",
};

export default function Hero() {
  return (
    <>
      <section style={heroStyle} className="fp-hero">
        <Badge tone="neutral" dot style={{ marginBottom: 24 }}>
          Private beta · Stellar testnet
        </Badge>

        <h1 style={h1Style}>
          Automate Stellar trades.
          <br />
          <span
            style={{
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
          >
            Without watching a chart.
          </span>
        </h1>

        <p style={subtitleStyle}>
          Drag triggers, strategies, and assets onto a canvas. Authorize once
          with your wallet. spay signs every trade within your policy.
          No per-trade popups. Nothing custodial.
        </p>

        <div style={ctaRow}>
          <a href="#waitlist">
            <Button variant="primary" trailingIcon={<ArrowRight size={14} />}>
              Join the waitlist
            </Button>
          </a>
          <a href="#waitlist">
            <Button variant="secondary" leadingIcon={<PlayCircle size={14} />}>
              Get early access
            </Button>
          </a>
        </div>

        <div style={statsRow}>
          <Stat value="Session-signer AA" label="No popup per trade" />
          <Stat value="Stellar DEX" label="+ Binance price feed" />
          <Stat value="Non-custodial" label="Keys stay with you" />
        </div>
      </section>

      <div style={canvasWrap} aria-hidden>
        <div style={canvasFrame}>
          <div style={gridLayer} />
          <HeroGraph />
          <CanvasChrome />
        </div>
      </div>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text)",
          letterSpacing: "-0.1px",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: "var(--text-dim)", marginTop: 3 }}>
        {label}
      </div>
    </div>
  );
}

function CanvasChrome() {
  return (
    <>
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 12,
          left: 14,
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 10.5,
          fontFamily: "var(--font-mono)",
          color: "var(--text-dim)",
          letterSpacing: "0.4px",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--text-dim)",
            display: "inline-block",
          }}
        />
        canvas.spay
      </div>
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: 12,
          right: 14,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--border-strong)",
              display: "inline-block",
            }}
          />
        ))}
      </div>
    </>
  );
}
