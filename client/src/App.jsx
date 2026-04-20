import { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Clusters from "./pages/Clusters";
import Connections from "./pages/Connections";
import LikesDislikes from "./pages/LikesDislikes";
import Industries from "./pages/Industries";
import Upload from "./pages/Upload";

export const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

const NAV = [
  { to: "/", label: "Clusters", icon: "◈" },
  { to: "/connections", label: "Connections", icon: "◎" },
  { to: "/likes", label: "Likes / Dislikes", icon: "◇" },
  { to: "/industries", label: "Industries", icon: "◫" },
  { to: "/upload", label: "Upload CSV", icon: "⬆" },
];

export default function App() {
  const [connections, setConnections] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState("sample");
  const [mockMode, setMockMode] = useState(false);

  useEffect(() => {
    fetch("/api/connections")
      .then((r) => r.json())
      .then((d) => {
        setConnections(d.connections);
        setSource(d.source);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const runAnalysis = async (forceRefresh = false) => {
    setAnalyzing(true);
    try {
      // Always pass forceRefresh to let server decide whether to use cache
      const mockParam = mockMode ? "?mock=true" : "";
      const res = await fetch(`/api/analyze${mockParam}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connections, forceRefresh }),
      });
      
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Server error: ${res.status}`);
      }
      
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setAnalysis(result);
    } catch (e) {
      setError(`Analysis failed: ${e.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (connections.length > 0) runAnalysis(false); // Try cache first on load
  }, [connections]);

  // Re-run analysis when mockMode changes
  useEffect(() => {
    if (connections.length > 0) {
      setAnalysis(null);
      runAnalysis(true);
    }
  }, [mockMode]);

  return (
    <DataContext.Provider value={{ connections, setConnections, setSource, analysis, analyzing, runAnalysis, source, mockMode, setMockMode }}>
      <BrowserRouter>
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "100vh" }}>
          <Sidebar />
          <main style={{ overflow: "auto" }}>
            {loading ? (
              <Loading />
            ) : error ? (
              <ErrorState message={error} />
            ) : (
              <Routes>
                <Route path="/" element={<Clusters />} />
                <Route path="/connections" element={<Connections />} />
                <Route path="/likes" element={<LikesDislikes />} />
                <Route path="/industries" element={<Industries />} />
                <Route path="/upload" element={<Upload />} />
              </Routes>
            )}
          </main>
        </div>
      </BrowserRouter>
    </DataContext.Provider>
  );
}

function Sidebar() {
  const { connections, source, analyzing, runAnalysis, mockMode, setMockMode } = useData();

  return (
    <aside style={{
      background: "var(--bg-2)",
      borderRight: "1px solid var(--border)",
      padding: "28px 16px",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      position: "sticky",
      top: 0,
      height: "100vh",
      overflow: "auto",
    }}>
      <div style={{ padding: "0 8px 24px", borderBottom: "1px solid var(--border)", marginBottom: "16px" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--accent)" }}>
          ln/
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px" }}>
          {connections.length} connections
          {source === "sample" && (
            <span style={{ color: "var(--amber)", marginLeft: "6px" }}>[sample]</span>
          )}
        </div>
      </div>

      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          style={({ isActive }) => ({
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "9px 12px",
            borderRadius: "var(--radius)",
            fontSize: "13px",
            color: isActive ? "var(--text)" : "var(--text-3)",
            background: isActive ? "var(--bg-4)" : "transparent",
            border: isActive ? "1px solid var(--border-2)" : "1px solid transparent",
            transition: "all 0.15s",
          })}
        >
          <span style={{ fontFamily: "var(--font-display)", fontSize: "14px" }}>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}

      <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
        <button
          onClick={() => runAnalysis(true)}
          disabled={analyzing}
          style={{
            width: "100%",
            padding: "9px 12px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border-2)",
            background: analyzing ? "var(--bg-4)" : "var(--accent-dim)",
            color: "var(--accent)",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            opacity: analyzing ? 0.6 : 1,
            cursor: analyzing ? "not-allowed" : "pointer",
          }}
        >
          {analyzing ? "Analyzing..." : "↻ Re-analyze"}
        </button>
        <button
          onClick={() => {
            setMockMode(!mockMode);
            setAnalysis(null);
          }}
          style={{
            width: "100%",
            marginTop: "8px",
            padding: "6px 12px",
            borderRadius: "var(--radius)",
            border: `1px solid ${mockMode ? "var(--accent)" : "var(--border-2)"}`,
            background: mockMode ? "var(--accent-dim)" : "transparent",
            color: mockMode ? "var(--accent)" : "var(--text-3)",
            fontSize: "11px",
            fontFamily: "var(--font-mono)",
            cursor: "pointer",
          }}
        >
          {mockMode ? "✓ Mock Mode ON" : "○ Mock Mode"}
        </button>
      </div>
    </aside>
  );
}

function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--text-3)", fontFamily: "var(--font-display)" }}>
      Loading connections...
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "12px" }}>
      <div style={{ color: "var(--red)", fontSize: "13px" }}>Error: {message}</div>
    </div>
  );
}