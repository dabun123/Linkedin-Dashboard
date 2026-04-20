export default function PageShell({ title, subtitle, children }) {
  return (
    <div style={{ padding: "32px", maxWidth: "1100px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "28px",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          marginBottom: "4px",
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: "13px", color: "var(--text-3)" }}>{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
