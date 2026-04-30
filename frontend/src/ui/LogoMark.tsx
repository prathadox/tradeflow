import type { CSSProperties } from "react";

export default function LogoMark({ size = 22 }: { size?: number }) {
  const radius = size <= 20 ? 4 : 5;
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: size,
    height: size,
    borderRadius: radius,
    overflow: "hidden",
    flexShrink: 0,
    background: "var(--bg-elev)",
  };
  const imgStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  };
  return (
    <span style={style} aria-label="spay">
      <img src="/logo.jpg" alt="" style={imgStyle} draggable={false} />
    </span>
  );
}
