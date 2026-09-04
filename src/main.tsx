import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { loadBundledSeedDataIfEmpty } from "@/lib/data-transfer";

// Resolves immediately (no fetch) once this origin already has any
// "me-planner:" data, so this only ever costs anything on a truly fresh
// install of a build that ships a seed — see loadBundledSeedDataIfEmpty.
loadBundledSeedDataIfEmpty().finally(() => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
