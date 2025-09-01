import { useState } from "react";
import Health from "./components/Health";
import SinglePredict from "./components/SinglePredict";
import BatchPredict from "./components/BatchPredict";

export default function App() {
  const [tab, setTab] = useState<"single" | "batch">("single");

  return (
    <div className="container stack">
      <header className="row between">
        <h1>Bug Risk Classifier</h1>
        <Health />
      </header>

      <div className="tabs">
        <button className={`tab ${tab === "single" ? "active" : ""}`} onClick={() => setTab("single")}>Single</button>
        <button className={`tab ${tab === "batch" ? "active" : ""}`} onClick={() => setTab("batch")}>Batch</button>
      </div>

      {tab === "single" ? <SinglePredict /> : <BatchPredict />}

      <footer className="muted">
        <div className="hr" />
        API base: <code className="mono">{import.meta.env.VITE_API_BASE ?? "http://localhost:8080"}</code>
      </footer>
    </div>
  );
}
