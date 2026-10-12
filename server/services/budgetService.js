/**
 * Estimates budget breakdown for a trip based on days, travelers, style, and total budget
 */
export const estimateBudget = ({ numberOfDays = 3, travelers = 2, budget = {}, travelStyle = 'balanced' }) => {
  const totalBudget = Number(budget?.amount || 0);
  const currency = budget?.currency || 'INR';

  // Allocation ratios by travel style
  const distributionRatios = {
    relaxed: { accommodation: 0.42, food: 0.28, activities: 0.16, transport: 0.14 },
    balanced: { accommodation: 0.36, food: 0.28, activities: 0.22, transport: 0.14 },
    packed: { accommodation: 0.30, food: 0.24, activities: 0.30, transport: 0.16 },
  };

  const ratios = distributionRatios[travelStyle] || distributionRatios.balanced;

  if (totalBudget > 0) {
    const accommodation = Math.round(totalBudget * ratios.accommodation);
    const food = Math.round(totalBudget * ratios.food);
    const activities = Math.round(totalBudget * ratios.activities);
    const transport = Math.round(totalBudget * ratios.transport);

    return {
      estimatedTotal: totalBudget,
      accommodation,
      food,
      activities,
      transport,
      currency,
      perDay: Math.round(totalBudget / Math.max(numberOfDays, 1)),
      perPerson: Math.round(totalBudget / Math.max(travelers, 1)),
    };
  }

  // Realistic baseline estimates if no budget was specified
  const baselineDailyRates = {
    INR: { accommodation: 3500, food: 1800, activities: 1200, transport: 900 },
    USD: { accommodation: 95, food: 45, activities: 35, transport: 25 },
    EUR: { accommodation: 90, food: 40, activities: 30, transport: 20 },
  };

  const rates = baselineDailyRates[currency] || baselineDailyRates.INR;

  const totalPerDay = rates.accommodation + (rates.food + rates.activities + rates.transport) * travelers;
  const estimatedTotal = totalPerDay * numberOfDays;

  return {
    estimatedTotal,
    accommodation: rates.accommodation * numberOfDays,
    food: rates.food * numberOfDays * travelers,
    activities: rates.activities * numberOfDays * travelers,
    transport: rates.transport * numberOfDays * travelers,
    currency,
    perDay: Math.round(estimatedTotal / Math.max(numberOfDays, 1)),
    perPerson: Math.round(estimatedTotal / Math.max(travelers, 1)),
  };
};

export default { estimateBudget };
