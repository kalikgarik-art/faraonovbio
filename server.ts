import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to persist view count and unique visitor tokens
const VIEWS_FILE = path.join(process.cwd(), "views-data.json");

interface ViewsData {
  count: number;
  visitors: string[];
}

function loadViewsData(): ViewsData {
  try {
    if (fs.existsSync(VIEWS_FILE)) {
      const raw = fs.readFileSync(VIEWS_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading views file:", err);
  }
  return { count: 55, visitors: [] };
}

function saveViewsData(data: ViewsData) {
  try {
    fs.writeFileSync(VIEWS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving views file:", err);
  }
}

// In-memory cache synced with file
let viewsData: ViewsData = loadViewsData();

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// GET current views
app.get("/api/views", (_req, res) => {
  res.json({
    views: viewsData.count,
    uniqueVisitorsCount: viewsData.visitors.length
  });
});

// POST register visit from a person/device
app.post("/api/views", (req, res) => {
  const visitorId = req.body?.visitorId;
  let isNew = false;

  if (visitorId && typeof visitorId === "string") {
    if (!viewsData.visitors.includes(visitorId)) {
      viewsData.visitors.push(visitorId);
      viewsData.count += 1;
      isNew = true;
      saveViewsData(viewsData);
    }
  } else {
    // If no visitorId provided, increment count
    viewsData.count += 1;
    isNew = true;
    saveViewsData(viewsData);
  }

  res.json({
    views: viewsData.count,
    isNewVisitor: isNew
  });
});

// POST to update base count if user changes it in settings
app.post("/api/views/set", (req, res) => {
  const newCount = Number(req.body?.count);
  if (!isNaN(newCount) && newCount >= 0) {
    viewsData.count = newCount;
    saveViewsData(viewsData);
    res.json({ success: true, views: viewsData.count });
  } else {
    res.status(400).json({ error: "Invalid count" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
