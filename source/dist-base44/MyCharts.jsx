// OTA OS — "My Charts" page (owner only).
// Paste as a new page named MyCharts. It does not change any other page.
import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

// Pinned to an exact build. The integrity hash means the browser refuses to run anything else.
const CHARTS_SRC =
  "https://cdn.jsdelivr.net/gh/8figureaiboss-creator/richgirlcode@a7f0e63ec945faa2665456463f252c94b56cff1f/charts/ota-charts.js";
const CHARTS_SRI = "sha384-tzg13Zqo4/CxXJ0oHwU0DaGQLcl8HOD6oWFYzauE5H/a5j6KE6bG7VoK3Xr0Pi88";

function loadCharts() {
  if (window.OTACharts) return Promise.resolve(window.OTACharts);
  return new Promise((resolve, reject) => {
    let s = document.getElementById("ota-charts-js");
    if (!s) {
      s = document.createElement("script");
      s.id = "ota-charts-js";
      s.src = CHARTS_SRC;
      s.integrity = CHARTS_SRI;
      s.crossOrigin = "anonymous";
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", () => (window.OTACharts ? resolve(window.OTACharts) : reject(new Error("Chart workspace did not start"))));
    s.addEventListener("error", () => reject(new Error("Could not load the chart workspace file")));
  });
}

// Bridge between the workspace and Base44: data goes through the otaCharts function,
// saved layouts go into the ChartWorkspace entity. No API keys ever reach this page.
function makeHost() {
  let rowId = null;
  return {
    async call(action, args = {}) {
      try {
        const res = await base44.functions.invoke("otaCharts", { action, ...args });
        return res.data;
      } catch (err) {
        const body = (err && err.response && err.response.data) || {};
        const e = new Error(body.error || err.message || "Request failed");
        e.code = body.code;
        throw e;
      }
    },
    async loadState() {
      const rows = await base44.entities.ChartWorkspace.filter({ key: "main" });
      if (!rows || !rows.length) return null;
      rowId = rows[0].id;
      try {
        return JSON.parse(rows[0].data);
      } catch {
        return null;
      }
    },
    async saveState(state) {
      const data = JSON.stringify(state);
      if (rowId) {
        await base44.entities.ChartWorkspace.update(rowId, { data });
      } else {
        const row = await base44.entities.ChartWorkspace.create({ key: "main", data });
        rowId = row.id;
      }
    },
  };
}

export default function MyCharts() {
  const hostRef = useRef(null);
  const [phase, setPhase] = useState("checking"); // checking | denied | loading | ready | error
  const [error, setError] = useState("");

  useEffect(() => {
    let app = null;
    let cancelled = false;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (!me || me.role !== "admin") {
          if (!cancelled) setPhase("denied");
          return;
        }
        setPhase("loading");
        const OTACharts = await loadCharts();
        if (cancelled || !hostRef.current) return;
        app = OTACharts.mount(hostRef.current, makeHost());
        setPhase("ready");
      } catch (e) {
        if (!cancelled) {
          setError(e.message || String(e));
          setPhase("error");
        }
      }
    })();
    return () => {
      cancelled = true;
      if (app) app.destroy();
    };
  }, []);

  if (phase === "denied") {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "#888" }}>
        My Charts is private to the owner account.
      </div>
    );
  }

  return (
    <div style={{ padding: 12, height: "calc(100vh - 96px)", minHeight: 620 }}>
      {phase !== "ready" && (
        <div style={{ padding: 24, color: "#9a9a9a" }}>
          {phase === "error" ? `My Charts couldn't start: ${error}` : "Loading My Charts…"}
        </div>
      )}
      <div ref={hostRef} style={{ height: "100%" }} />
    </div>
  );
}
