import type { CareSurfaceComposition, CareSurfacePhase, PartnerSurfaceSignal, PartnerSurfaceUrgencyTier } from '../types/care-surface.types';

export function derivePartnerSurfaceSignal(composition: CareSurfaceComposition, phase: CareSurfacePhase): PartnerSurfaceSignal {
  const urgencyTier = urgencyTierForIntensity(composition.intensity);
  return {
    urgencyTier,
    intensity: clampIntensity(composition.intensity),
    phase,
    momentCopy: partnerMomentCopy(urgencyTier),
  };
}

export function urgencyTierForIntensity(intensity: number): PartnerSurfaceUrgencyTier {
  if (intensity >= 0.9) return 'critical';
  if (intensity >= 0.6) return 'elevated';
  if (intensity >= 0.3) return 'routine';
  return 'quiet';
}

function partnerMomentCopy(tier: PartnerSurfaceUrgencyTier) {
  if (tier === 'critical') return '지금 가장 중요한 순간이에요. 조용히 곁에 있어 주세요.';
  if (tier === 'elevated') return '오늘 케어가 있어요. 필요한 것을 먼저 챙겨드려요.';
  if (tier === 'routine') return '오늘도 함께 확인해요.';
  return '오늘은 쉬어도 괜찮은 날이에요. 조용히 함께해요.';
}

function clampIntensity(value: number) {
  return Math.max(0, Math.min(1, value));
}
