export type TreatmentType = "IUI" | "IVF" | "FET" | "TIMED_INTERCOURSE";

export interface Cycle {
  id: string;
  treatmentType: TreatmentType;
  cycleStartDate: string;
  clinicName: string;
  doctorName?: string;
  estimatedEggRetrievalDate?: string;
  estimatedEmbryoTransferDate?: string;
  memo?: string;
  createdAt: string;
}

export interface TreatmentOption {
  value: TreatmentType;
  label: string;
  sublabel: string;
  description: string;
}

export const TREATMENT_OPTIONS: TreatmentOption[] = [
  {
    value: "IUI",
    label: "IUI",
    sublabel: "인공수정",
    description: "Intrauterine insemination",
  },
  {
    value: "IVF",
    label: "IVF",
    sublabel: "시험관 아기",
    description: "In vitro fertilization",
  },
  {
    value: "FET",
    label: "Frozen Embryo Transfer",
    sublabel: "냉동배아 이식",
    description: "Transfer of a previously frozen embryo",
  },
  {
    value: "TIMED_INTERCOURSE",
    label: "Timed Intercourse",
    sublabel: "배란유도·자연시도",
    description: "Monitored natural or stimulated cycle",
  },
];
