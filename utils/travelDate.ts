/**
 * Maps a calendar day (YYYY-MM-DD) to UTC ISO bounds for that day in Asia/Colombo,
 * matching how seeded trips use +05:30 departure times.
 */
export function travelDateKeyToDepartureWindow(
  dateKey: string | undefined | null
): { departureAfter: string; departureBefore: string } | undefined {
  const k = (dateKey ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return undefined;
  const start = `${k}T00:00:00+05:30`;
  const end = `${k}T23:59:59.999+05:30`;
  return {
    departureAfter: new Date(start).toISOString(),
    departureBefore: new Date(end).toISOString(),
  };
}
