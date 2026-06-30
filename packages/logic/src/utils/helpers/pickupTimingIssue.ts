import { toCalendarDate } from '@internationalized/date';
import { toDatetime } from '../useDateFunctions';
import type { DateObject, DateTimeObject, TimeObject } from '../useDateFunctions';

export type PickupTimingIssue = 'past_date' | 'past_time' | null;

// Diagnostica por qué un momento de recogida no es reservable, distinguiendo una
// FECHA de calendario ya pasada de HOY con una hora ya vencida — para que la UI
// apunte al campo correcto (fecha vs hora). null = momento futuro válido.
// Dogfood hallazgo #2.
export function pickupTimingIssue(
  pickupDate: DateObject,
  pickupTime: TimeObject,
  now: DateTimeObject,
): PickupTimingIssue {
  const pickupAt = toDatetime(pickupDate, pickupTime);
  if (pickupAt.compare(now) > 0) return null;                 // futuro → reservable
  if (pickupDate.compare(toCalendarDate(now)) < 0) return 'past_date';
  return 'past_time';                                         // hoy, hora vencida (o == ahora)
}
