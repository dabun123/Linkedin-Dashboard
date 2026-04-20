import { useState } from "react";
import { useData } from "../App";
import PageShell from "../components/PageShell";

export default function Connections() {
  const { connections, analysis } = useData();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("all");
  const [clusterFilter, setClusterFilter] = useState("all");

  const clusters = analysis?.clusters ?? [];
  const connectionMap = analysis?.connectionMap ?? {};

  const filtered = connections
    .filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        c.name?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.position?.toLowerCase().includes(q);
      
      // Filter by cluster if selected
      if (clusterFilter === "all") return matchesSearch;
      const connectionCluster = connectionMap[c.name];
      return matchesSearch && connectionCluster === clusterFilter;
    })
    .sort((a, b) => {
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "company") return (a.company || "").localeCompare(b.company || "");
      if (sortBy === "position") return (a.position || "").localeCompare(b.position || "");
      return 0;
    });

  return (
    <PageShell title="Connections" subtitle={`${connections.length} total`}>
      {/* Search + filter bar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search by name, company, or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: "9px 14px",
            background: "var(--bg-2)",
            border: "1px solid var(--border-2)",
            borderRadius: "var(--radius)",
            color: "var(--text)",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            outline: "none",
          }}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{
            padding: "9px 14px",
            background: "var(--bg-2)",
            border: "1px solid var(--border-2)",
            borderRadius: "var(--radius)",
            color: "var(--text-2)",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="all">Sort by</option>
          <option value="name">Name</option>
          <option value="company">Company</option>
          <option value="position">Position</option>
        </select>
        <select
          value={clusterFilter}
          onChange={(e) => setClusterFilter(e.target.value)}
          style={{
            padding: "9px 14px",
            background: "var(--bg-2)",
            border: "1px solid var(--border-2)",
            borderRadius: "var(--radius)",
            color: "var(--text-2)",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="all">All clusters</option>
          {clusters.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      <div style={{ fontSize: "12px", color: "var(--text-3)", marginBottom: "12px" }}>
        {filtered.length} result{filtered.length !== 1 ? "s" : ""}
      </div>

      {/* Table */}
      <div style={{
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Name", "Position", "Company", "Connected"].map((h) => (
                <th key={h} style={{
                  padding: "12px 16px",
                  textAlign: "left",
                  fontSize: "11px",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  color: "var(--text-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr
                key={c.id || i}
                style={{
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-3)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Avatar name={c.name} />
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-2)" }}>
                  {c.position || "—"}
                </td>
                <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-2)" }}>
                  {c.company || "—"}
                </td>
                <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
                  {c.connectedOn || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}

function Avatar({ name }) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const colors = ["var(--accent-dim)", "var(--green-dim)", "var(--blue-dim)", "var(--pink-dim)", "var(--amber-dim)"];
  const idx = (name?.charCodeAt(0) ?? 0) % colors.length;

  return (
    <div style={{
      width: "26px",
      height: "26px",
      borderRadius: "50%",
      background: colors[idx],
      border: "1px solid var(--border-2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "9px",
      fontWeight: 600,
      flexShrink: 0,
      color: "var(--text-2)",
    }}>
      {initials}
    </div>
  );
}
