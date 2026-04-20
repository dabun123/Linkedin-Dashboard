import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/PageShell";

export default function Upload() {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");
  const inputRef = useRef();
  const navigate = useNavigate();

  const handleFile = async (file) => {
    if (!file || !file.name.endsWith(".csv")) {
      setStatus("error");
      setMessage("Please upload a .csv file from your LinkedIn export.");
      return;
    }

    setStatus("uploading");
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/connections/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setStatus("success");
      setMessage(`${data.count} connections uploaded successfully.`);
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setStatus("error");
      setMessage(err.message);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <PageShell title="Upload data" subtitle="Import your LinkedIn Connections.csv">
      <div style={{
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "20px",
        marginBottom: "20px",
      }}>
        <h3 style={{
          fontFamily: "var(--font-display)",
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text-2)",
          marginBottom: "12px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}>
          How to export from LinkedIn
        </h3>
        {[
          "Go to linkedin.com → Settings & Privacy",
          "Click Data Privacy → Get a copy of your data",
          "Select Connections only and click Request archive",
          "Check your email for the download link (~ 10 min)",
          "Unzip and upload Connections.csv below",
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "8px" }}>
            <span style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              color: "var(--accent)",
              fontSize: "12px",
              minWidth: "16px",
            }}>
              {i + 1}
            </span>
            <span style={{ fontSize: "13px", color: "var(--text-2)" }}>{step}</span>
          </div>
        ))}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
        style={{
          border: `2px dashed ${dragging ? "var(--accent)" : "var(--border-2)"}`,
          borderRadius: "var(--radius-lg)",
          padding: "60px 20px",
          textAlign: "center",
          cursor: "pointer",
          background: dragging ? "var(--accent-dim)" : "var(--bg-2)",
          transition: "all 0.15s",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>⬆</div>
        <div style={{
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: "16px",
          marginBottom: "6px",
          color: "var(--text)",
        }}>
          {status === "uploading" ? "Uploading..." : "Drop Connections.csv here"}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-3)" }}>or click to browse</div>
      </div>

      <button
        onClick={async () => {
          setStatus("uploading");
          setMessage("Loading test data...");
          try {
            const res = await fetch("/api/connections/load-test");
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setStatus("success");
            setMessage(`${data.count} test connections loaded.`);
            setTimeout(() => navigate("/"), 2000);
          } catch (err) {
            setStatus("error");
            setMessage(err.message);
          }
        }}
        style={{
          marginTop: "16px",
          padding: "10px 20px",
          background: "var(--bg-4)",
          border: "1px solid var(--border-2)",
          borderRadius: "var(--radius)",
          color: "var(--text-2)",
          fontSize: "13px",
          cursor: "pointer",
        }}
      >
        Load Test Data
      </button>

      {status === "success" && (
        <div style={{
          marginTop: "16px",
          padding: "14px 18px",
          background: "var(--green-dim)",
          border: "1px solid var(--green)",
          borderRadius: "var(--radius)",
          color: "var(--green)",
          fontSize: "13px",
        }}>
          ✓ {message} Redirecting to dashboard...
        </div>
      )}

      {status === "error" && (
        <div style={{
          marginTop: "16px",
          padding: "14px 18px",
          background: "var(--red-dim)",
          border: "1px solid var(--red)",
          borderRadius: "var(--radius)",
          color: "var(--red)",
          fontSize: "13px",
        }}>
          ✗ {message}
        </div>
      )}
    </PageShell>
  );
}