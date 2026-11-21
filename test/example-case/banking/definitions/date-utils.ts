/**
 * `Date.setMonth` overflows into a later month when the day of month
 * (29-31) doesn't exist in the target month (e.g. Jan 31 + 1 month would
 * land on Mar 2/3, skipping February entirely). Clamping the day to the
 * target month's last day keeps installment due dates actually monthly.
 */
export const addMonthsClamped = (date: Date, months: number): Date => {
  const day = date.getDate();
  const firstOfTargetMonth = new Date(
    date.getFullYear(),
    date.getMonth() + months,
    1,
  );
  const lastDayOfTargetMonth = new Date(
    firstOfTargetMonth.getFullYear(),
    firstOfTargetMonth.getMonth() + 1,
    0,
  ).getDate();

  firstOfTargetMonth.setDate(Math.min(day, lastDayOfTargetMonth));

  return firstOfTargetMonth;
};
