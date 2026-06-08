import { useState, type ChangeEvent, type FormEvent } from "react";
import type { Cycle, TreatmentType } from "../types/Cycle";
import { TREATMENT_OPTIONS } from "../types/Cycle";

interface Props {
  onSubmit: (cycle: Cycle) => void;
}

interface FormData {
  treatmentType: TreatmentType | "";
  cycleStartDate: string;
  clinicName: string;
  doctorName: string;
  estimatedEggRetrievalDate: string;
  estimatedEmbryoTransferDate: string;
  memo: string;
}

interface FormErrors {
  treatmentType?: string;
  cycleStartDate?: string;
  clinicName?: string;
  estimatedEggRetrievalDate?: string;
  estimatedEmbryoTransferDate?: string;
}

const EMPTY_FORM: FormData = {
  treatmentType: "",
  cycleStartDate: "",
  clinicName: "",
  doctorName: "",
  estimatedEggRetrievalDate: "",
  estimatedEmbryoTransferDate: "",
  memo: "",
};

function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function validate(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.treatmentType) {
    errors.treatmentType = "Please select a treatment type to continue.";
  }
  if (!data.cycleStartDate) {
    errors.cycleStartDate = "Please enter the cycle start date.";
  }
  if (!data.clinicName.trim()) {
    errors.clinicName = "Please enter your clinic or hospital name.";
  }
  if (
    data.estimatedEggRetrievalDate &&
    data.cycleStartDate &&
    data.estimatedEggRetrievalDate < data.cycleStartDate
  ) {
    errors.estimatedEggRetrievalDate =
      "Egg retrieval date cannot be before the cycle start date.";
  }
  if (
    data.estimatedEmbryoTransferDate &&
    data.cycleStartDate &&
    data.estimatedEmbryoTransferDate < data.cycleStartDate
  ) {
    errors.estimatedEmbryoTransferDate =
      "Transfer date cannot be before the cycle start date.";
  }

  return errors;
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="field-error" role="alert">
      <span className="field-error__icon" aria-hidden="true">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
          <circle cx="6.5" cy="6.5" r="6" stroke="#B83B3B" />
          <path d="M6.5 3.5v3.5" stroke="#B83B3B" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="6.5" cy="9.5" r="0.7" fill="#B83B3B" />
        </svg>
      </span>
      {message}
    </p>
  );
}

export function CycleSetupForm({ onSubmit }: Props) {
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  function selectTreatment(type: TreatmentType) {
    setFormData((prev) => ({ ...prev, treatmentType: type }));
    setErrors((prev) => ({ ...prev, treatmentType: undefined }));
  }

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const key = name as keyof FormErrors;
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrorEl = document.querySelector("[role='alert']");
      firstErrorEl?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const cycle: Cycle = {
      id: generateId(),
      treatmentType: formData.treatmentType as TreatmentType,
      cycleStartDate: formData.cycleStartDate,
      clinicName: formData.clinicName.trim(),
      createdAt: new Date().toISOString(),
    };

    if (formData.doctorName.trim()) cycle.doctorName = formData.doctorName.trim();
    if (formData.estimatedEggRetrievalDate)
      cycle.estimatedEggRetrievalDate = formData.estimatedEggRetrievalDate;
    if (formData.estimatedEmbryoTransferDate)
      cycle.estimatedEmbryoTransferDate = formData.estimatedEmbryoTransferDate;
    if (formData.memo.trim()) cycle.memo = formData.memo.trim();

    onSubmit(cycle);
  }

  return (
    <form className="cycle-form" onSubmit={handleSubmit} noValidate>
      {/* ── Header ── */}
      <div className="cycle-form__header">
        <h2 className="cycle-form__title">Start a New Treatment Cycle</h2>
        <p className="cycle-form__subtitle">
          Fill in the details below to begin organizing your cycle.
        </p>
      </div>

      {/* ── Treatment Type ── */}
      <section className="form-section" aria-labelledby="section-treatment">
        <h3 className="form-section__title" id="section-treatment">
          Treatment Type <span className="required" aria-hidden="true">*</span>
        </h3>
        <div
          className="treatment-grid"
          role="radiogroup"
          aria-labelledby="section-treatment"
          aria-required="true"
        >
          {TREATMENT_OPTIONS.map((opt) => {
            const isSelected = formData.treatmentType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`treatment-card${isSelected ? " treatment-card--selected" : ""}`}
                onClick={() => selectTreatment(opt.value)}
              >
                <span className="treatment-card__check" aria-hidden="true">✓</span>
                <span className="treatment-card__name">{opt.label}</span>
                <span className="treatment-card__korean">{opt.sublabel}</span>
                <span className="treatment-card__desc">{opt.description}</span>
              </button>
            );
          })}
        </div>
        {errors.treatmentType && (
          <FieldError id="error-treatmentType" message={errors.treatmentType} />
        )}
      </section>

      {/* ── Cycle Details ── */}
      <section className="form-section" aria-labelledby="section-details">
        <h3 className="form-section__title" id="section-details">
          Cycle Details
        </h3>
        <div className="form-fields">
          {/* Cycle start date */}
          <div className="form-field">
            <label htmlFor="cycleStartDate" className="form-label">
              Cycle Start Date
              <span className="required" aria-label="required">*</span>
            </label>
            <input
              id="cycleStartDate"
              type="date"
              name="cycleStartDate"
              className={`form-input${errors.cycleStartDate ? " form-input--error" : ""}`}
              value={formData.cycleStartDate}
              onChange={handleChange}
              aria-required="true"
              aria-describedby={`cycleStartDate-hint${errors.cycleStartDate ? " error-cycleStartDate" : ""}`}
            />
            <p id="cycleStartDate-hint" className="field-hint">
              Usually the first day of your period, or the date your clinic schedules stimulation.
            </p>
            {errors.cycleStartDate && (
              <FieldError id="error-cycleStartDate" message={errors.cycleStartDate} />
            )}
          </div>

          {/* Clinic name */}
          <div className="form-field">
            <label htmlFor="clinicName" className="form-label">
              Clinic / Hospital
              <span className="required" aria-label="required">*</span>
            </label>
            <input
              id="clinicName"
              type="text"
              name="clinicName"
              className={`form-input${errors.clinicName ? " form-input--error" : ""}`}
              value={formData.clinicName}
              onChange={handleChange}
              placeholder="e.g. Seoul Fertility Center"
              aria-required="true"
              aria-describedby={errors.clinicName ? "error-clinicName" : undefined}
              autoComplete="organization"
            />
            {errors.clinicName && (
              <FieldError id="error-clinicName" message={errors.clinicName} />
            )}
          </div>

          {/* Doctor name */}
          <div className="form-field">
            <label htmlFor="doctorName" className="form-label">
              Doctor's Name
              <span className="optional-tag">optional</span>
            </label>
            <input
              id="doctorName"
              type="text"
              name="doctorName"
              className="form-input"
              value={formData.doctorName}
              onChange={handleChange}
              placeholder="e.g. Dr. Kim"
              autoComplete="off"
            />
          </div>
        </div>
      </section>

      {/* ── Estimated Dates ── */}
      <section className="form-section" aria-labelledby="section-dates">
        <h3 className="form-section__title" id="section-dates">
          Estimated Dates
          <span className="optional-tag" style={{ marginLeft: "6px" }}>optional</span>
        </h3>
        <p className="form-section__desc">
          These are approximate and can be updated as your treatment progresses.
        </p>
        <div className="form-fields--two">
          {/* Egg retrieval */}
          <div className="form-field">
            <label htmlFor="estimatedEggRetrievalDate" className="form-label">
              Est. Egg Retrieval Date
            </label>
            <input
              id="estimatedEggRetrievalDate"
              type="date"
              name="estimatedEggRetrievalDate"
              className={`form-input${errors.estimatedEggRetrievalDate ? " form-input--error" : ""}`}
              value={formData.estimatedEggRetrievalDate}
              onChange={handleChange}
              aria-describedby={`retrieval-hint${errors.estimatedEggRetrievalDate ? " error-retrieval" : ""}`}
            />
            <p id="retrieval-hint" className="field-hint">
              For IVF cycles — the estimated date of egg collection.
            </p>
            {errors.estimatedEggRetrievalDate && (
              <FieldError id="error-retrieval" message={errors.estimatedEggRetrievalDate} />
            )}
          </div>

          {/* Transfer */}
          <div className="form-field">
            <label htmlFor="estimatedEmbryoTransferDate" className="form-label">
              Est. Transfer Date
            </label>
            <input
              id="estimatedEmbryoTransferDate"
              type="date"
              name="estimatedEmbryoTransferDate"
              className={`form-input${errors.estimatedEmbryoTransferDate ? " form-input--error" : ""}`}
              value={formData.estimatedEmbryoTransferDate}
              onChange={handleChange}
              aria-describedby={`transfer-hint${errors.estimatedEmbryoTransferDate ? " error-transfer" : ""}`}
            />
            <p id="transfer-hint" className="field-hint">
              For IVF and FET cycles — the estimated embryo transfer date.
            </p>
            {errors.estimatedEmbryoTransferDate && (
              <FieldError id="error-transfer" message={errors.estimatedEmbryoTransferDate} />
            )}
          </div>
        </div>
      </section>

      {/* ── Notes ── */}
      <section className="form-section" aria-labelledby="section-notes">
        <h3 className="form-section__title" id="section-notes">
          Notes
          <span className="optional-tag" style={{ marginLeft: "6px" }}>optional</span>
        </h3>
        <div className="form-field" style={{ marginTop: "6px" }}>
          <label htmlFor="memo" className="form-label">
            Personal Notes
          </label>
          <textarea
            id="memo"
            name="memo"
            className="form-input form-textarea"
            value={formData.memo}
            onChange={handleChange}
            placeholder="Questions for your doctor, how you're feeling, medications to remember…"
            rows={4}
          />
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <div className="disclaimer">
        <p>
          This app helps organize your fertility treatment schedule and does not replace medical
          advice. Always follow your clinic's instructions.
        </p>
      </div>

      <button type="submit" className="btn-primary">
        Save Cycle
      </button>
    </form>
  );
}
