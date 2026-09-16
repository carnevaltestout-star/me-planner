import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { migrateLegacyData } from "@/lib/legacy-migration";

// One-time per-feature carry-over from the old localStorage world into
// SQLite (see legacy-migration.ts) — each feature's own marker makes this
// a near no-op once it's actually run once, so it's safe to call on every
// launch rather than needing its own "is this a fresh install" gate.
migrateLegacyData().finally(() => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
