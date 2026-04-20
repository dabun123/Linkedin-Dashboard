export default function MetricCard({ label, value, accent, small }) {
  return (
    <div style={{
      background: "var(--bg-2)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding: "16px",
    }}>
      <div style={{ fontSize: "11px", color: "var(--text-3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{
        fontSize: small ? "15px" : "26px",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        color: accent ?? "var(--text)",
        letterSpacing: small ? "0" : "-0.02em",
        lineHeight: 1.2,
      }}>
        {value}
      </div>
    </div>
  );
}
