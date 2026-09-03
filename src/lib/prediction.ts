import { DailyEntry } from '../types';
import { getDay, parseISO } from 'date-fns';

export function calculatePrediction(
  entries: DailyEntry[], 
  isWeekend: boolean, 
  isHoliday: boolean, 
  weatherCondition: 'normal' | 'hot' | 'rain' | 'rainy',
  season: 'summer' | 'winter' | 'monsoon' | 'spring' | 'normal' = 'normal',
  targetDateStr?: string
) {
  if (!entries || entries.length === 0) {
    return { 
      stick: 40, pot: 25, plate: 15,
      avgStick: 35, avgPot: 20, avgPlate: 10,
      recent7DayAvgStick: 35, recent7DayAvgPot: 20, recent7DayAvgPlate: 10,
      dayOfWeekAvgStick: 35, dayOfWeekAvgPot: 20, dayOfWeekAvgPlate: 10,
      histAvgStick: 35, histAvgPot: 20, histAvgPlate: 10,
      hasData: false, 
      multiplier: 1 
    };
  }

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  
  // 1. All-time Historical Average
  const histTotalStick = sorted.reduce((sum, e) => sum + (e.stickSold || 0), 0);
  const histTotalPot = sorted.reduce((sum, e) => sum + (e.potSold || 0), 0);
  const histTotalPlate = sorted.reduce((sum, e) => sum + (e.plateSold || 0), 0);
  const histAvgStick = Math.round(histTotalStick / sorted.length);
  const histAvgPot = Math.round(histTotalPot / sorted.length);
  const histAvgPlate = Math.round(histTotalPlate / sorted.length);

  // 2. Recent 7-Day Average
  const recent7Entries = sorted.slice(0, 7);
  const recent7TotalStick = recent7Entries.reduce((sum, e) => sum + (e.stickSold || 0), 0);
  const recent7TotalPot = recent7Entries.reduce((sum, e) => sum + (e.potSold || 0), 0);
  const recent7TotalPlate = recent7Entries.reduce((sum, e) => sum + (e.plateSold || 0), 0);
  const recent7DayAvgStick = Math.round(recent7TotalStick / recent7Entries.length);
  const recent7DayAvgPot = Math.round(recent7TotalPot / recent7Entries.length);
  const recent7DayAvgPlate = Math.round(recent7TotalPlate / recent7Entries.length);

  // 3. Day of Week Average
  let dayOfWeekAvgStick = histAvgStick;
  let dayOfWeekAvgPot = histAvgPot;
  let dayOfWeekAvgPlate = histAvgPlate;
  
  if (targetDateStr) {
    try {
      const targetDay = getDay(parseISO(targetDateStr));
      const sameDayEntries = sorted.filter(e => getDay(parseISO(e.date)) === targetDay);
      if (sameDayEntries.length > 0) {
        const sameDayTotalStick = sameDayEntries.reduce((sum, e) => sum + (e.stickSold || 0), 0);
        const sameDayTotalPot = sameDayEntries.reduce((sum, e) => sum + (e.potSold || 0), 0);
        const sameDayTotalPlate = sameDayEntries.reduce((sum, e) => sum + (e.plateSold || 0), 0);
        dayOfWeekAvgStick = Math.round(sameDayTotalStick / sameDayEntries.length);
        dayOfWeekAvgPot = Math.round(sameDayTotalPot / sameDayEntries.length);
        dayOfWeekAvgPlate = Math.round(sameDayTotalPlate / sameDayEntries.length);
      }
    } catch (e) {
      // Ignore invalid dates
    }
  }

  // Weighted Base Calculation
  // 50% recent, 30% day of week, 20% historical
  const baseStick = (recent7DayAvgStick * 0.5) + (dayOfWeekAvgStick * 0.3) + (histAvgStick * 0.2);
  const basePot = (recent7DayAvgPot * 0.5) + (dayOfWeekAvgPot * 0.3) + (histAvgPot * 0.2);
  const basePlate = (recent7DayAvgPlate * 0.5) + (dayOfWeekAvgPlate * 0.3) + (histAvgPlate * 0.2);

  let multiplier = 1.0;
  if (isWeekend) multiplier += 0.20; // 20% increase on weekends
  if (isHoliday) multiplier += 0.30; // 30% increase on holidays
  if (weatherCondition === 'hot') multiplier += 0.15; // 15% increase on hot days
  if (weatherCondition === 'rain' || weatherCondition === 'rainy') multiplier -= 0.30; // 30% decrease on rainy days
  
  if (season === 'summer') multiplier += 0.25;
  if (season === 'winter') multiplier -= 0.15;
  if (season === 'monsoon') multiplier -= 0.10;
  if (season === 'spring') multiplier += 0.05;
  
  const predictedStick = Math.ceil((baseStick * multiplier) / 5) * 5 + 15;
  const predictedPot = Math.ceil((basePot * multiplier) / 5) * 5 + 15;
  const predictedPlate = Math.ceil((basePlate * multiplier) / 5) * 5 + 10;
  
  return {
    stick: predictedStick,
    pot: predictedPot,
    plate: predictedPlate,
    avgStick: Math.round(baseStick), // For backward compatibility if used elsewhere
    avgPot: Math.round(basePot),
    avgPlate: Math.round(basePlate),
    recent7DayAvgStick,
    recent7DayAvgPot,
    recent7DayAvgPlate,
    dayOfWeekAvgStick,
    dayOfWeekAvgPot,
    dayOfWeekAvgPlate,
    histAvgStick,
    histAvgPot,
    histAvgPlate,
    multiplier,
    hasData: true
  };
}
