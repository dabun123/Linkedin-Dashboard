export default function AnalyzingState() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "14px",
      padding: "60px",
      background: "var(--bg-2)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
    }}>
      <div style={{
        width: "32px",
        height: "32px",
        border: "2px solid var(--border-2)",
        borderTop: "2px solid var(--accent)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: "13px", color: "var(--text-3)" }}>Claude is analyzing your network...</div>
      <div style={{ fontSize: "12px", color: "var(--text-3)", opacity: 0.6 }}>This may take 10–20 seconds</div>
    </div>
  );
}
