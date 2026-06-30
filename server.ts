import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing with generous size limits
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API proxy route to bypass CORS issues with Google Apps Script in iframes/sandboxes
  app.all("/api/proxy", async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl) {
        res.status(400).json({ status: "error", message: "Missing target URL in query parameters" });
        return;
      }

      // Security whitelist: Only allow Google Script domains
      if (!targetUrl.startsWith("https://script.google.com/") && !targetUrl.startsWith("https://script.googleusercontent.com/")) {
        res.status(403).json({ status: "error", message: "Forbidden: Only Google Apps Script URLs are allowed" });
        return;
      }

      const options: RequestInit = {
        method: req.method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (req.method !== "GET" && req.method !== "HEAD") {
        options.body = JSON.stringify(req.body);
      }

      const response = await fetch(targetUrl, options);
      
      // Prevent browser caching on the proxy response
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const responseHeadersToForward = ["content-type"];
      responseHeadersToForward.forEach((h) => {
        const val = response.headers.get(h);
        if (val) {
          res.setHeader(h, val);
        }
      });

      const bodyText = await response.text();
      res.status(response.status).send(bodyText);
    } catch (err: any) {
      console.error("Proxy server error:", err);
      res.status(500).json({ status: "error", message: err.message || "Internal Proxy Connection Failed" });
    }
  });

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
