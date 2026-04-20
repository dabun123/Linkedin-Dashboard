import { useData } from "../App";
import PageShell from "../components/PageShell";
import MetricCard from "../components/MetricCard";
import AnalyzingState from "../components/AnalyzingState";

export default function Clusters() {
  const { connections, analysis, analyzing } = useData();

  const totalAnalyzed = analysis?.totalConnections ?? connections.length;
  const clusters = (analysis?.clusters ?? []).sort((a, b) => b.count - a.count);
  const insights = analysis?.insights ?? [];

  return (
    <PageShell title="Dashboard" subtitle="Network Clusters & Insights">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        <MetricCard label="Total connections" value={totalAnalyzed} />
        <MetricCard label="Clusters found" value={clusters.length || "—"} />
        <MetricCard
          label="Largest cluster"
          value={clusters[0]?.label ?? "—"}
          small
        />
        <MetricCard
          label="Analyzed"
          value={analysis ? new Date(analysis.analyzedAt).toLocaleDateString() : "—"}
          small
        />
      </div>

      {analyzing && <AnalyzingState />}

      {!analyzing && clusters.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Cluster bars */}
          <div style={card}>
            <h3 style={cardTitle}>Network breakdown</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {clusters.map((c) => (
                <ClusterRow key={c.id} cluster={c} total={totalAnalyzed} />
              ))}
            </div>
          </div>

          {/* Cluster cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {clusters.map((c) => (
              <div key={c.id} style={{
                ...card,
                borderLeft: `3px solid ${c.color}`,
                padding: "14px 16px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px" }}>{c.label}</span>
                  <span style={{ fontSize: "20px", fontFamily: "var(--font-display)", fontWeight: 700, color: c.color }}>{c.count}</span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-3)", marginBottom: "8px" }}>{c.description}</p>
                {c.topCompanies?.length > 0 && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {c.topCompanies.map((co) => (
                      <span key={co} style={pill}>{co}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!analyzing && insights.length > 0 && (
        <div style={{ ...card, marginTop: "16px" }}>
          <h3 style={cardTitle}>AI insights</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {insights.map((insight, i) => (
              <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <span style={{ color: "var(--accent)", marginTop: "1px", flexShrink: 0 }}>›</span>
                <span style={{ fontSize: "13px", color: "var(--text-2)" }}>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}

function ClusterRow({ cluster, total }) {
  const pct = total > 0 ? Math.round((cluster.count / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
        <span style={{ fontSize: "13px", color: "var(--text-2)" }}>{cluster.label}</span>
        <span style={{ fontSize: "12px", color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
          {cluster.count} · {pct}%
        </span>
      </div>
      <div style={{ height: "4px", background: "var(--bg-4)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: cluster.color, borderRadius: "2px", transition: "width 0.6s ease" }} />
      </div>
    </div>
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
  fontSize: "13px",
  color: "var(--text-2)",
  marginBottom: "16px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const pill = {
  fontSize: "11px",
  padding: "2px 8px",
  borderRadius: "99px",
  background: "var(--bg-4)",
  border: "1px solid var(--border)",
  color: "var(--text-3)",
};
