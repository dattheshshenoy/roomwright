import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./index.css";

// Known upstream deprecation notices from three.js internals (via R3F / drei)
// that don't affect the app. Drop just these two lines so the console stays clean.
const SILENCED = ["THREE.Clock: This module has been deprecated"];
const realWarn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === "string" && SILENCED.some((s) => (args[0] as string).includes(s))) return;
  realWarn(...args);
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
