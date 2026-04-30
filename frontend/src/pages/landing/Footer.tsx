import LogoMark from "../../ui/LogoMark";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer
      style={{
        marginTop: 40,
        padding: "24px 24px 40px",
        borderTop: "1px solid var(--hairline)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            fontSize: 13,
            color: "var(--text-muted)",
          }}
        >
          <LogoMark size={18} />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 400,
              fontSize: 15,
              color: "var(--text)",
              letterSpacing: "-0.01em",
            }}
          >
            spay
          </span>
          <span style={{ color: "var(--text-dim)" }}>© {year}</span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 16,
            fontSize: 12.5,
            color: "var(--text-muted)",
          }}
        >
          <a href="#features">Features</a>
          <a href="#faq">FAQ</a>
          <a href="https://github.com" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="mailto:hello@spay.xyz">hello@spay.xyz</a>
        </div>
      </div>
    </footer>
  );
}
