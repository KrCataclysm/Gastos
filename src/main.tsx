import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import { installRipple } from "@/lib/ripple";
import { initUpdater } from "@/lib/updater";
import "@/styles/main.css";

initUpdater();
installRipple();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
