import type { HomeContext } from '../../domain/home-composition';

export function shouldShowPartnerProjection(context: HomeContext) {
  return context.partnerConnected === true || context.roleIntent?.role !== 'primary_solo';
}

export function shouldShowPartnerInviteCard(context: HomeContext) {
  return context.partnerConnected !== true && context.roleIntent?.role === 'primary_with_partner';
}
