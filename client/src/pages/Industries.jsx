import { useData } from "../App";
import PageShell from "../components/PageShell";
import AnalyzingState from "../components/AnalyzingState";

export default function Industries() {
  const { connections, analysis, analyzing } = useData();

  // Derive industry breakdown from connections data (company field) when no analysis yet
  const clusters = analysis?.clusters ?? [];

  // Build a simple company frequency map from raw connections
  const companyCount = {};
  connections.forEach((c) => {
    if (c.company) {
      companyCount[c.company] = (companyCount[c.company] || 0) + 1;
    }
  });

  const topCompanies = Object.entries(companyCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  const maxCount = topCompanies[0]?.[1] ?? 1;

  return (
    <PageShell title="Industries" subtitle="Company & employer breakdown">
      {analyzing && <AnalyzingState />}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Top companies bar chart */}
        <div style={card}>
          <h3 style={cardTitle}>Top employers</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {topCompanies.length === 0 && (
              <div style={{ fontSize: "12px", color: "var(--text-3)" }}>No company data found in your CSV</div>
            )}
            {topCompanies.map(([company, count]) => (
              <div key={company}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-2)" }}>{company}</span>
                  <span style={{ fontSize: "11px", color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>{count}</span>
                </div>
                <div style={{ height: "3px", background: "var(--bg-4)", borderRadius: "2px" }}>
                  <div style={{
                    height: "100%",
                    width: `${(count / maxCount) * 100}%`,
                    background: "var(--accent)",
                    borderRadius: "2px",
                    transition: "width 0.5s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI cluster breakdown */}
        <div style={card}>
          <h3 style={cardTitle}>Cluster distribution</h3>
          {clusters.length === 0 ? (
            <div style={{ fontSize: "12px", color: "var(--text-3)" }}>Run analysis to see AI-generated clusters</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {clusters.map((c) => (
                <div key={c.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 12px",
                  background: "var(--bg-3)",
                  borderRadius: "var(--radius)",
                  border: `1px solid var(--border)`,
                  borderLeft: `3px solid ${c.color}`,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "2px" }}>{c.label}</div>
                    <div style={{ fontSize: "11px", color: "var(--text-3)" }}>{c.description}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "18px", fontFamily: "var(--font-display)", fontWeight: 700, color: c.color }}>{c.count}</div>
                    <div style={{ fontSize: "10px", color: "var(--text-3)" }}>{c.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

const card = {
  background: "var(--bg-2)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  padding: "20px",
};

const cardTitle = {
  fontFamily: "var(--font-display)",
  fontWeight: 600,
  fontSize: "12px",
  color: "var(--text-2)",
  marginBottom: "16px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};
