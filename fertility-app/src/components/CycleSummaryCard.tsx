import type { Cycle } from "../types/Cycle";
import { TREATMENT_OPTIONS } from "../types/Cycle";

interface Props {
  cycle: Cycle;
  onStartNew: () => void;
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function SummaryRow({
  label,
  children,
  block = false,
}: {
  label: string;
  children: React.ReactNode;
  block?: boolean;
}) {
  return (
    <li className={`summary-row${block ? " summary-row--block" : ""}`}>
      <span className="summary-row__label">{label}</span>
      <span className="summary-row__value">{children}</span>
    </li>
  );
}

export function CycleSummaryCard({ cycle, onStartNew }: Props) {
  const treatmentOption = TREATMENT_OPTIONS.find((o) => o.value === cycle.treatmentType);
  const savedOn = new Date(cycle.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="summary-card" role="region" aria-label="Cycle summary">
      {/* ── Success header ── */}
      <div className="summary-card__top">
        <div className="summary-card__check-circle" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path
              d="M5 11.5L9 15.5L17 7"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="summary-card__title">Cycle Saved</h2>
        <p className="summary-card__subtitle">
          Your treatment cycle is set up. You're ready to begin.
        </p>
      </div>

      {/* ── Detail rows ── */}
      <div className="summary-card__body">
        <ul className="summary-list">
          <SummaryRow label="Treatment Type">
            {treatmentOption?.label}
            <span className="summary-row__value--sub">· {treatmentOption?.sublabel}</span>
          </SummaryRow>

          <SummaryRow label="Cycle Start Date">
            {formatDate(cycle.cycleStartDate)}
          </SummaryRow>

          <SummaryRow label="Clinic / Hospital">
            {cycle.clinicName}
          </SummaryRow>

          {cycle.doctorName && (
            <SummaryRow label="Doctor">
              {cycle.doctorName}
            </SummaryRow>
          )}

          {cycle.estimatedEggRetrievalDate && (
            <SummaryRow label="Est. Egg Retrieval">
              {formatDate(cycle.estimatedEggRetrievalDate)}
            </SummaryRow>
          )}

          {cycle.estimatedEmbryoTransferDate && (
            <SummaryRow label="Est. Transfer Date">
              {formatDate(cycle.estimatedEmbryoTransferDate)}
            </SummaryRow>
          )}

          {cycle.memo && (
            <li className="summary-row summary-row--block">
              <span className="summary-row__label">Notes</span>
              <span className="summary-row__value summary-row__value--memo">{cycle.memo}</span>
            </li>
          )}
        </ul>
      </div>

      {/* ── Footer ── */}
      <div className="summary-card__footer">
        <p className="summary-card__meta">
          Saved on {savedOn}
          <br />
          <span style={{ fontFamily: "monospace", fontSize: "10.5px", opacity: 0.6 }}>
            ID: {cycle.id.slice(0, 8)}…
          </span>
        </p>
        <button className="btn-secondary" onClick={onStartNew}>
          Start a New Cycle
        </button>
      </div>
    </div>
  );
}
