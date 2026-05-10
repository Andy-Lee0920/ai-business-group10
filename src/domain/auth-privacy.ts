export const PRIVACY_GATE_VERSION = 'v1.0-slc' as const;

type IsoTimestamp = string;

export type Couple = {
  id: string;
  createdBy: string;
  createdAt: IsoTimestamp;
};

export type CoupleMember = {
  id: string;
  coupleId: string;
  role: 'primary' | 'partner';
  userId: string | null;
  email: string | null;
  createdAt: IsoTimestamp;
};

export type CoupleState = {
  coupleId: string;
  privacyGateAcceptedAt: IsoTimestamp | null;
  privacyGateAcceptedBy: string | null;
  privacyGateVersion: string | null;
  firstCaptureCompletedAt: IsoTimestamp | null;
  waitingModeEnabled: boolean;
  updatedAt: IsoTimestamp;
};

export type CoupleShell = {
  couple: Couple;
  members: CoupleMember[];
  state: CoupleState;
};

export type BootstrapCoupleShellInput = {
  userId: string;
  email: string;
  now: IsoTimestamp;
  existing?: CoupleShell;
};

function stableId(prefix: string, seed: string) {
  return `${prefix}_${seed.replace(/[^a-zA-Z0-9-]/g, '_')}`;
}

export function bootstrapCoupleShell({ userId, email, now, existing }: BootstrapCoupleShellInput): CoupleShell {
  if (existing) {
    const alreadyBootstrapped = existing.members.some((member) => member.role === 'primary' && member.userId === userId);
    if (alreadyBootstrapped) {
      return existing;
    }
  }

  const coupleId = stableId('couple', userId);

  return {
    couple: {
      id: coupleId,
      createdBy: userId,
      createdAt: now,
    },
    members: [
      {
        id: stableId('member_primary', userId),
        coupleId,
        role: 'primary',
        userId,
        email,
        createdAt: now,
      },
      {
        id: stableId('member_partner', userId),
        coupleId,
        role: 'partner',
        userId: null,
        email: null,
        createdAt: now,
      },
    ],
    state: {
      coupleId,
      privacyGateAcceptedAt: null,
      privacyGateAcceptedBy: null,
      privacyGateVersion: null,
      firstCaptureCompletedAt: null,
      waitingModeEnabled: false,
      updatedAt: now,
    },
  };
}

export function acceptPrivacyGate(
  state: CoupleState,
  { userId, now, version = PRIVACY_GATE_VERSION }: { userId: string; now: IsoTimestamp; version?: string },
): CoupleState {
  if (state.privacyGateAcceptedAt) {
    return state;
  }

  return {
    ...state,
    privacyGateAcceptedAt: now,
    privacyGateAcceptedBy: userId,
    privacyGateVersion: version,
    updatedAt: now,
  };
}

export function canCreateSensitiveRow(state: Pick<CoupleState, 'privacyGateAcceptedAt'> | null | undefined) {
  return Boolean(state?.privacyGateAcceptedAt);
}

export function assertSensitiveWriteAllowed(state: Pick<CoupleState, 'privacyGateAcceptedAt'> | null | undefined) {
  if (!canCreateSensitiveRow(state)) {
    throw new Error('Privacy Gate must be accepted before creating sensitive Fevio data.');
  }
}
