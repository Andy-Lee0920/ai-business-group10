import { ClinicDayHome } from './clinic-day-home';
import { InjectionDayHome } from './injection-day-home';
import { RoutineDayHome } from './routine-day-home';
import type { AdaptiveStateHomeBaseProps } from './types';
import { WaitingDayHome } from './waiting-day-home';

export function AdaptiveHomeRuntime(props: AdaptiveStateHomeBaseProps) {
  if (props.context.careDay === 'injection_day') return <InjectionDayHome {...props} />;
  if (props.context.careDay === 'clinic_day') return <ClinicDayHome {...props} />;
  if (props.context.careDay === 'waiting_day') return <WaitingDayHome {...props} />;
  return <RoutineDayHome {...props} />;
}
