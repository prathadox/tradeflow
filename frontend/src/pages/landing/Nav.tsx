import { Link } from "react-router-dom";
import Button from "../../ui/Button";
import LogoMark from "../../ui/LogoMark";

const linkBase: React.CSSProperties = {
  fontSize: 12.5,
  color: "var(--text-muted)",
  padding: "6px 12px",
  borderRadius: "var(--radius-pill)",
  transition: "color var(--dur-fast), background-color var(--dur-fast)",
  fontWeight: 500,
  whiteSpace: "nowrap",
  cursor: "pointer",
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      style={linkBase}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "var(--text)";
        e.currentTarget.style.backgroundColor = "var(--bg-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "var(--text-muted)";
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      {children}
    </a>
  );
}

export default function Nav({ scrolled }: { scrolled: boolean }) {
  return (
    <header
      style={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        padding: "6px 6px 6px 16px",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        background: scrolled
          ? "rgba(10, 10, 10, 0.82)"
          : "rgba(10, 10, 10, 0.68)",
        backdropFilter: "blur(14px) saturate(140%)",
        WebkitBackdropFilter: "blur(14px) saturate(140%)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-pill)",
        boxShadow: scrolled ? "var(--shadow-pop)" : "var(--shadow-lift)",
        transition:
          "background-color var(--dur-mid), box-shadow var(--dur-mid), border-color var(--dur-mid)",
        maxWidth: "calc(100vw - 24px)",
      }}
    >
      <Link
        to="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 9,
          fontFamily: "var(--font-display)",
          fontWeight: 400,
          fontSize: 17,
          color: "var(--text)",
          letterSpacing: "-0.01em",
          paddingRight: 6,
          lineHeight: 1,
        }}
      >
        <LogoMark />
        spay
      </Link>

      <span
        aria-hidden
        style={{
          width: 1,
          height: 18,
          background: "var(--hairline)",
        }}
      />

      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <NavLink href="#how-it-works">How</NavLink>
        <NavLink href="#features">Features</NavLink>
        <NavLink href="#faq">FAQ</NavLink>
      </nav>

      <a href="#waitlist">
        <Button variant="primary" size="sm" style={{ borderRadius: "var(--radius-pill)" }}>
          Join waitlist
        </Button>
      </a>
    </header>
  );
}
