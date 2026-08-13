import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { seedDatabaseIfNeeded } from "./src/server/seed.ts";
import { registerDebugRoutes } from "./src/server/routes/debug.ts";
import { registerCatalogRoutes } from "./src/server/routes/catalog.ts";
import { registerUserRoutes } from "./src/server/routes/users.ts";
import { registerAuthRoutes } from "./src/server/routes/auth.ts";
import { registerOrderRoutes } from "./src/server/routes/orders.ts";

const app = express();
const PORT = 3000;

app.use(express.json());

registerDebugRoutes(app);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

registerCatalogRoutes(app);
registerUserRoutes(app);
registerAuthRoutes(app);
registerOrderRoutes(app);

async function startServer() {
  await seedDatabaseIfNeeded();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[IVY Backend] Server successfully running at http://localhost:${PORT}`);
  });
}

startServer();
