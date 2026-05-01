import { useState } from "react";
import type { Cycle } from "./types/Cycle";
import { CycleSetupForm } from "./components/CycleSetupForm";
import { CycleSummaryCard } from "./components/CycleSummaryCard";

export default function App() {
  const [cycle, setCycle] = useState<Cycle | null>(null);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-logo-mark" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="3.5" />
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div className="app-wordmark">CycleKit</div>
            <div className="app-wordmark-sub">Fertility Treatment Companion</div>
          </div>
        </div>
      </header>

      <main className="app-content">
        {cycle ? (
          <CycleSummaryCard cycle={cycle} onStartNew={() => setCycle(null)} />
        ) : (
          <CycleSetupForm onSubmit={setCycle} />
        )}
      </main>
    </div>
  );
}
