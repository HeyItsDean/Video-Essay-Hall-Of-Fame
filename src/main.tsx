import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";

// Theme bootstrap (avoids flash)
const storedTheme = localStorage.getItem("vehof-theme");
if (storedTheme !== "light") {
  document.documentElement.classList.add("dark");
} else {
  document.documentElement.classList.remove("dark");
}

// PWA registration
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.info("New version available; refresh to update.");
  },
  onOfflineReady() {
    console.info("App ready for offline use.");
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
