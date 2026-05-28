import { describe, expect, it } from 'vitest';
import { scoreVisionModelRuns } from '../../scripts/vision-model-quality.mjs';

describe('vision model quality scoring', () => {
  it('scores exact extraction higher than wrong time/type candidates', () => {
    const result = scoreVisionModelRuns({
      samples: [
        {
          id: 'ovidrel-night',
          expected: [
            { type: 'injection', title: '오비드렐', scheduled_at: '2026-05-19T21:00:00+09:00', dose: '250', unit: 'mcg' },
          ],
        },
      ],
      runs: [
        {
          model: 'current',
          sampleId: 'ovidrel-night',
          candidates: [{ type: 'medication', title: '오비드렐', scheduled_at: '2026-05-19T09:00:00+09:00', dose: '250', unit: 'mcg' }],
        },
        {
          model: 'gemini',
          sampleId: 'ovidrel-night',
          candidates: [{ type: 'injection', title: '오비드렐', scheduled_at: '2026-05-19T21:00:00+09:00', dose: '250', unit: 'mcg' }],
        },
      ],
    });

    expect(result.models).toEqual([
      expect.objectContaining({ model: 'gemini', totalScore: 5, possibleScore: 5 }),
      expect.objectContaining({ model: 'current', totalScore: 3, possibleScore: 5 }),
    ]);
    expect(result.winner).toBe('gemini');
  });

  it('returns no winner when two models tie', () => {
    const result = scoreVisionModelRuns({
      samples: [{ id: 'clinic', expected: [{ type: 'clinic', title: '병원 방문', scheduled_at: null, dose: null, unit: null }] }],
      runs: [
        { model: 'a', sampleId: 'clinic', candidates: [{ type: 'clinic', title: '병원 방문', scheduled_at: null, dose: null, unit: null }] },
        { model: 'b', sampleId: 'clinic', candidates: [{ type: 'clinic', title: '병원 방문', scheduled_at: null, dose: null, unit: null }] },
      ],
    });

    expect(result.models.map((model) => model.totalScore)).toEqual([5, 5]);
    expect(result.winner).toBeNull();
  });
});
