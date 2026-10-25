import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/space-grotesk";
import { getCurrentWindow } from "@tauri-apps/api/window";
import TrayApp from "./TrayApp";

const isTray = getCurrentWindow().label === "tray";

if (isTray) {
  document.body.style.backgroundColor = "transparent";
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>{isTray ? <TrayApp /> : <App />}</React.StrictMode>,
);
