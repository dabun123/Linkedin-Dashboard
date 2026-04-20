import { useData } from "../App";
import PageShell from "../components/PageShell";
import AnalyzingState from "../components/AnalyzingState";
import MetricCard from "../components/MetricCard";

export default function LikesDislikes() {
  const { analysis, analyzing } = useData();

  const likes = analysis?.likes ?? [];
  const dislikes = analysis?.dislikes ?? [];
  const topConnectors = analysis?.topConnectors ?? [];

  return (
    <PageShell title="Likes / Dislikes" subtitle="Inferred from network density">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
        <MetricCard label="Strong affinities" value={likes.length} accent="var(--green)" />
        <MetricCard label="Low affinities" value={dislikes.length} accent="var(--red)" />
        <MetricCard label="Top connectors" value={topConnectors.length} />
      </div>

      {analyzing && <AnalyzingState />}

      {!analyzing && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {/* Likes */}
          <div style={card}>
            <h3 style={{ ...cardTitle, color: "var(--green)" }}>↑ Strong affinities</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {likes.length === 0 && <Empty />}
              {likes.map((item, i) => (
                <AffinityRow key={i} item={item} positive />
              ))}
            </div>
          </div>

          {/* Dislikes */}
          <div style={card}>
            <h3 style={{ ...cardTitle, color: "var(--red)" }}>↓ Low affinities</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {dislikes.length === 0 && <Empty />}
              {dislikes.map((item, i) => (
                <AffinityRow key={i} item={item} positive={false} />
              ))}
            </div>
          </div>

          {/* Top connectors */}
          {topConnectors.length > 0 && (
            <div style={{ ...card, gridColumn: "1 / -1" }}>
              <h3 style={cardTitle}>Key connectors in your network</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px" }}>
                {topConnectors.map((person, i) => (
                  <div key={i} style={{
                    background: "var(--bg-3)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    padding: "12px 14px",
                  }}>
                    <div style={{ fontWeight: 500, fontSize: "13px", marginBottom: "2px" }}>{person.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-2)", marginBottom: "6px" }}>
                      {person.position} · {person.company}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-3)" }}>{person.reason}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}

function AffinityRow({ item, positive }) {
  const barColor = positive ? "var(--green)" : "var(--red)";
  const bgColor = positive ? "var(--green-dim)" : "var(--red-dim)";
  return (
    <div style={{ padding: "12px", background: "var(--bg-3)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{
          fontSize: "12px",
          fontWeight: 500,
          padding: "2px 9px",
          borderRadius: "99px",
          background: bgColor,
          color: barColor,
        }}>
          {item.tag}
        </span>
        <span style={{ fontSize: "11px", color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
          {item.confidence}% confidence
        </span>
      </div>
      <div style={{ height: "3px", background: "var(--bg-4)", borderRadius: "2px", marginBottom: "6px" }}>
        <div style={{ height: "100%", width: `${item.confidence}%`, background: barColor, borderRadius: "2px" }} />
      </div>
      <p style={{ fontSize: "11px", color: "var(--text-3)", lineHeight: "1.5" }}>{item.reason}</p>
    </div>
  );
}

function Empty() {
  return <div style={{ fontSize: "12px", color: "var(--text-3)", padding: "8px 0" }}>Run analysis to see results</div>;
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
  marginBottom: "14px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};
