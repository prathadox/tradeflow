import { useState, type CSSProperties, type FormEvent } from "react";
import { Mail, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { postWaitlist } from "../../api/waitlist";

type Status = "idle" | "submitting" | "success" | "error";

const sectionStyle: CSSProperties = {
  padding: "96px 24px",
  maxWidth: 860,
  margin: "0 auto",
};

const cardStyle: CSSProperties = {
  position: "relative",
  padding: "56px 40px",
  background: "var(--bg-panel)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-xl)",
  boxShadow: "var(--shadow-lift)",
  textAlign: "center",
  overflow: "hidden",
};

const gridLayer: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage:
    "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
  backgroundSize: "22px 22px",
  maskImage:
    "radial-gradient(ellipse 90% 80% at 50% 0%, black 30%, transparent 85%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 90% 80% at 50% 0%, black 30%, transparent 85%)",
  pointerEvents: "none",
  opacity: 0.9,
};

const eyebrowStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "1.4px",
  textTransform: "uppercase",
  color: "var(--text-muted)",
};

const titleStyle: CSSProperties = {
  marginTop: 12,
  marginBottom: 0,
  fontFamily: "var(--font-display)",
  fontSize: "clamp(34px, 4.4vw, 46px)",
  fontWeight: 400,
  letterSpacing: "-0.02em",
  color: "var(--text)",
  lineHeight: 1.05,
};

const subStyle: CSSProperties = {
  marginTop: 14,
  marginBottom: 0,
  fontSize: 14.5,
  color: "var(--text-muted)",
  lineHeight: 1.6,
  maxWidth: 440,
  marginLeft: "auto",
  marginRight: "auto",
};

const trustStyle: CSSProperties = {
  marginTop: 20,
  fontSize: 11.5,
  color: "var(--text-dim)",
  letterSpacing: "0.1px",
};

function pillForm(focused: boolean, invalid: boolean): CSSProperties {
  return {
    position: "relative",
    marginTop: 28,
    maxWidth: 460,
    margin: "28px auto 0 auto",
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: 6,
    background: "var(--bg-sunken)",
    border: `1px solid ${
      invalid ? "var(--danger)" : focused ? "var(--text)" : "var(--border-strong)"
    }`,
    borderRadius: "var(--radius-pill)",
    transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)",
    boxShadow: focused && !invalid ? "0 0 0 4px var(--accent-ring)" : "none",
  };
}

const iconAdorn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  paddingLeft: 12,
  color: "var(--text-dim)",
  flexShrink: 0,
};

const inputStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  height: 36,
  padding: "0 8px 0 10px",
  background: "transparent",
  border: "none",
  outline: "none",
  color: "var(--text)",
  fontSize: 14,
  fontFamily: "inherit",
};

const submitStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  height: 36,
  padding: "0 16px",
  borderRadius: "var(--radius-pill)",
  background: "var(--accent)",
  color: "var(--bg-canvas)",
  border: "1px solid transparent",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  letterSpacing: "-0.1px",
  transition:
    "background-color var(--dur-fast), opacity var(--dur-fast), transform var(--dur-fast)",
  flexShrink: 0,
  whiteSpace: "nowrap",
};

const successStyle: CSSProperties = {
  marginTop: 28,
  display: "inline-flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 18px",
  background: "var(--bg-sunken)",
  border: "1px solid var(--border-strong)",
  color: "var(--text)",
  borderRadius: "var(--radius-pill)",
  fontSize: 13.5,
  fontWeight: 500,
  letterSpacing: "-0.1px",
};

const errorMsg: CSSProperties = {
  marginTop: 12,
  fontSize: 12,
  color: "var(--danger)",
};

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      setStatus("error");
      return;
    }
    setStatus("submitting");
    try {
      await postWaitlist({
        email: trimmed,
        source: "landing",
        referrer:
          typeof document !== "undefined" ? document.referrer || undefined : undefined,
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  };

  return (
    <section id="waitlist" style={sectionStyle}>
      <div style={cardStyle}>
        <div style={gridLayer} aria-hidden />
        <div style={{ position: "relative" }}>
          <div style={eyebrowStyle}>Waitlist</div>
          <h2 style={titleStyle}>Get early access.</h2>
          <p style={subStyle}>
            We are onboarding small cohorts on Stellar testnet. Drop your email
            and we will send you a mainnet invite when it is your turn.
          </p>

          {status === "success" ? (
            <div style={successStyle}>
              <CheckCircle2 size={16} />
              You are on the list. Watch your inbox.
            </div>
          ) : (
            <>
              <form
                onSubmit={onSubmit}
                style={pillForm(focused, status === "error" && !!error)}
              >
                <span style={iconAdorn}>
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="you@stellarfan.xyz"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  autoComplete="email"
                  disabled={status === "submitting"}
                  style={inputStyle}
                />
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  style={{
                    ...submitStyle,
                    opacity: status === "submitting" ? 0.6 : 1,
                  }}
                >
                  {status === "submitting" ? (
                    <Loader2
                      size={14}
                      style={{ animation: "flowpay-spin 0.9s linear infinite" }}
                    />
                  ) : (
                    <>
                      Join
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
              {error && <div style={errorMsg}>{error}</div>}
            </>
          )}

          <div style={trustStyle}>
            No spam · One email when your cohort opens · Unsubscribe anytime
          </div>
        </div>
      </div>
    </section>
  );
}
