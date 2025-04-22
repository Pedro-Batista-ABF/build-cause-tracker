
export function calculateBusinessDays(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) return 0;
  let count = 0;
  let curr = new Date(startDate);
  const end = new Date(endDate);

  while (curr <= end) {
    const day = curr.getDay();
    if (day !== 0 && day !== 6) count++; // 0=Dom, 6=Sáb
    curr.setDate(curr.getDate() + 1);
  }
  return count > 0 ? count : 1;
}

export function calculateDailyGoal(startDate?: string | null, endDate?: string | null, totalQty?: number) {
  if (!startDate || !endDate || !totalQty || isNaN(totalQty)) return { qty: 0, percent: 0 };
  try {
    const businessDays = calculateBusinessDays(startDate, endDate);
    const qtyGoal = Math.round(totalQty / businessDays);
    const percentGoal = Number((100 / businessDays).toFixed(2));
    return { qty: qtyGoal, percent: percentGoal };
  } catch {
    return { qty: 0, percent: 0 };
  }
}
