export interface CommunityEmpathyState {
  active: boolean;
  count: number;
}

export function toggleCommunityEmpathy(state: CommunityEmpathyState): CommunityEmpathyState {
  return state.active
    ? { active: false, count: Math.max(0, state.count - 1) }
    : { active: true, count: state.count + 1 };
}
