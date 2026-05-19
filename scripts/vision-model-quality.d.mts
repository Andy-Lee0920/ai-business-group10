export type VisionScheduleType = 'injection' | 'medication' | 'clinic';

export type VisionExpectedCandidate = {
  type: VisionScheduleType;
  title: string;
  scheduled_at?: string | null;
  dose?: string | null;
  unit?: string | null;
};

export type VisionCandidate = {
  type: string;
  title: string;
  scheduled_at?: string | null;
  dose?: string | null;
  unit?: string | null;
};

export type VisionSampleExpectation = {
  id: string;
  expected: VisionExpectedCandidate[];
};

export type VisionModelRun = {
  model: string;
  sampleId: string;
  candidates: VisionCandidate[];
};

export type VisionModelScore = {
  model: string;
  totalScore: number;
  possibleScore: number;
  matchedCandidates: number;
  sampleCount: number;
};

export function scoreVisionModelRuns(input: {
  samples: VisionSampleExpectation[];
  runs: VisionModelRun[];
}): { models: VisionModelScore[]; winner: string | null };
