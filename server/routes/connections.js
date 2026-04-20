const express = require("express");
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const multer = require("multer");
const AdmZip = require("adm-zip");

const router = express.Router();
const DATA_DIR = path.join(__dirname, "../data");
const upload = multer({ dest: path.join(DATA_DIR, "uploads/") });

// ─── CSV parser ───────────────────────────────────────────────
function parseCSV(raw, headerPattern) {
  const lines = raw.split("\n");
  const headerIdx = headerPattern
    ? lines.findIndex((l) => l.match(headerPattern))
    : 0;
  const csv = headerIdx >= 0 ? lines.slice(headerIdx).join("\n") : raw;
  return parse(csv, { columns: true, skip_empty_lines: true, trim: true });
}

function parseConnections(raw) {
  const records = parseCSV(raw, /^"?First\s*Name/i);
  return records.map((r, i) => ({
    id: i + 1,
    name: `${r["First Name"] || r["FirstName"] || ""} ${r["Last Name"] || r["LastName"] || ""}`.trim(),
    email: r["Email Address"] || r["Email"] || "",
    company: r["Company"] || "",
    position: r["Position"] || r["Title"] || "",
    connectedOn: r["Connected On"] || r["ConnectedOn"] || "",
  }));
}

function parseCompanyFollows(raw) {
  const records = parseCSV(raw, /^"?Organization/i);
  return records.map((r) => ({
    name: r["Organization"] || r["Company"] || r["Name"] || "",
    followedOn: r["Followed On"] || "",
  })).filter((r) => r.name);
}

function parsePositions(raw) {
  const records = parseCSV(raw, /^"?Company Name/i);
  return records.map((r) => ({
    company: r["Company Name"] || r["Company"] || "",
    title: r["Title"] || r["Position"] || "",
    startedOn: r["Started On"] || "",
    finishedOn: r["Finished On"] || "",
    description: r["Description"] || "",
  })).filter((r) => r.company);
}

function parseProfile(raw) {
  const records = parseCSV(raw, /^"?First Name/i);
  if (!records.length) return {};
  const r = records[0];
  return {
    name: `${r["First Name"] || ""} ${r["Last Name"] || ""}`.trim(),
    headline: r["Headline"] || "",
    industry: r["Industry"] || "",
    summary: r["Summary"] || "",
    location: r["Geo Location"] || r["Location"] || "",
  };
}

function parseInvitations(raw) {
  const records = parseCSV(raw, /^"?From/i);
  return records.map((r) => ({
    from: r["From"] || "",
    to: r["To"] || "",
    sentAt: r["Sent At"] || "",
    message: r["Message"] || "",
    direction: r["Direction"] || "",
  }));
}

// ─── Extract zip ──────────────────────────────────────────────
function extractLinkedInZip(filePath) {
  const zip = new AdmZip(filePath);
  const entries = zip.getEntries();
  const result = {};

  const fileMap = {
    "Connections.csv": "connections",
    "Company Follows.csv": "companyFollows",
    "Positions.csv": "positions",
    "Profile.csv": "profile",
    "Invitations.csv": "invitations",
  };

  entries.forEach((entry) => {
    const baseName = path.basename(entry.entryName);
    const key = fileMap[baseName];
    if (key) {
      result[key] = entry.getData().toString("utf8");
    }
  });

  return result;
}

// ─── GET /api/connections/load-test ───────────────────────────
router.get("/load-test", (req, res) => {
  try {
    const testPath = path.join(DATA_DIR, "test_connections.csv");
    if (!fs.existsSync(testPath)) {
      return res.status(404).json({ error: "Test file not found" });
    }
    const raw = fs.readFileSync(testPath, "utf8");
    const connections = parseConnections(raw);
    // Save as the main Connections.csv so it loads normally
    fs.writeFileSync(path.join(DATA_DIR, "Connections.csv"), raw);
    res.json({ count: connections.length, connections });
  } catch (err) {
    console.error("Error loading test data:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/connections ─────────────────────────────────────
router.get("/", (req, res) => {
  try {
    const csvPath = path.join(DATA_DIR, "Connections.csv");
    if (!fs.existsSync(csvPath)) {
      return res.json({ connections: getSampleData(), source: "sample" });
    }
    const raw = fs.readFileSync(csvPath, "utf8");
    const connections = parseConnections(raw);
    res.json({ connections, source: "file" });
  } catch (err) {
    console.error("Error parsing connections:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/connections/all ─────────────────────────────────
// Returns all parsed data for the AI analysis
router.get("/all", (req, res) => {
  try {
    const read = (name) => {
      const p = path.join(DATA_DIR, name);
      return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
    };

    const connectionsRaw = read("Connections.csv");
    const followsRaw = read("Company Follows.csv");
    const positionsRaw = read("Positions.csv");
    const profileRaw = read("Profile.csv");
    const invitationsRaw = read("Invitations.csv");

    res.json({
      connections: connectionsRaw ? parseConnections(connectionsRaw) : getSampleData(),
      companyFollows: followsRaw ? parseCompanyFollows(followsRaw) : [],
      positions: positionsRaw ? parsePositions(positionsRaw) : [],
      profile: profileRaw ? parseProfile(profileRaw) : {},
      invitations: invitationsRaw ? parseInvitations(invitationsRaw) : [],
      source: connectionsRaw ? "file" : "sample",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/connections/upload ────────────────────────────
router.post("/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const isZip = req.file.originalname.endsWith(".zip") ||
      req.file.mimetype === "application/zip" ||
      req.file.mimetype === "application/x-zip-compressed";

    if (isZip) {
      // Extract zip and save individual CSVs
      const extracted = extractLinkedInZip(req.file.path);
      fs.unlinkSync(req.file.path);

      if (!extracted.connections) {
        return res.status(400).json({ error: "Could not find Connections.csv inside the zip. Make sure this is a LinkedIn data export." });
      }

      const fileMap = {
        connections: "Connections.csv",
        companyFollows: "Company Follows.csv",
        positions: "Positions.csv",
        profile: "Profile.csv",
        invitations: "Invitations.csv",
      };

      const found = [];
      Object.entries(extracted).forEach(([key, raw]) => {
        fs.writeFileSync(path.join(DATA_DIR, fileMap[key]), raw);
        found.push(fileMap[key]);
      });

      const connections = parseConnections(extracted.connections);

      // Clear analysis cache
      const cachePath = path.join(DATA_DIR, "analysis_cache.json");
      if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);

      return res.json({
        connections,
        count: connections.length,
        filesFound: found,
        source: "zip",
      });
    }

    // Plain CSV fallback
    const raw = fs.readFileSync(req.file.path, "utf8");
    const connections = parseConnections(raw);
    if (!connections.length) {
      return res.status(400).json({ error: "No connections found in file." });
    }
    fs.copyFileSync(req.file.path, path.join(DATA_DIR, "Connections.csv"));
    fs.unlinkSync(req.file.path);

    const cachePath = path.join(DATA_DIR, "analysis_cache.json");
    if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath);

    res.json({ connections, count: connections.length, filesFound: ["Connections.csv"], source: "csv" });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Sample data ──────────────────────────────────────────────
function getSampleData() {
  return [
    { id: 1, name: "Alex Chen", company: "Stripe", position: "Senior Software Engineer", connectedOn: "2024-03-15" },
    { id: 2, name: "Priya Sharma", company: "Vercel", position: "Staff Engineer", connectedOn: "2024-02-01" },
    { id: 3, name: "Jordan Lee", company: "YC W24 Startup", position: "Founding Engineer", connectedOn: "2024-01-20" },
    { id: 4, name: "Sam Rivera", company: "OpenAI", position: "Research Engineer", connectedOn: "2023-12-10" },
    { id: 5, name: "Taylor Kim", company: "Figma", position: "Product Designer", connectedOn: "2023-11-05" },
    { id: 6, name: "Morgan Patel", company: "Sequoia Capital", position: "Associate", connectedOn: "2023-10-22" },
    { id: 7, name: "Casey Williams", company: "Meta", position: "Product Manager", connectedOn: "2023-09-14" },
    { id: 8, name: "Riley Johnson", company: "Harvard University", position: "PhD Researcher", connectedOn: "2023-08-30" },
    { id: 9, name: "Dana Martinez", company: "Goldman Sachs", position: "VP, Technology", connectedOn: "2023-07-18" },
    { id: 10, name: "Quinn Thompson", company: "Shopify", position: "Engineering Manager", connectedOn: "2023-06-25" },
    { id: 11, name: "Avery Brown", company: "Anthropic", position: "ML Engineer", connectedOn: "2023-05-12" },
    { id: 12, name: "Blake Davis", company: "Linear", position: "Head of Product", connectedOn: "2023-04-08" },
  ];
}

module.exports = router;