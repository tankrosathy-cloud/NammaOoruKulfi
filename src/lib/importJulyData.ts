import { v4 as uuidv4 } from 'uuid';
import { saveEntry, getSettings } from '../store';

export async function importJulyData() {
  const rawData = [
    { day: 1, stickLoaded: 215, potLoaded: 1, givenAmt: 1300, stickBal: 117, potBal: 0, cashBag: 3750, phonePe: 1490, offer: 20 },
    { day: 2, stickLoaded: 207, potLoaded: 0, givenAmt: 1300, stickBal: 121, potBal: 0, cashBag: 2765, phonePe: 1880, offer: 80 },
    { day: 3, stickLoaded: 204, potLoaded: 12, givenAmt: 1305, stickBal: 116, potBal: 1, cashBag: 3120, phonePe: 2240, offer: 0 },
    { day: 4, stickLoaded: 254, potLoaded: 13, givenAmt: 1350, stickBal: 90, potBal: 1, cashBag: 4595, phonePe: 3900, offer: 0 },
    { day: 5, stickLoaded: 298, potLoaded: 13, givenAmt: 1405, stickBal: 114, potBal: 3, cashBag: 4955, phonePe: 4190, offer: 80 },
    { day: 6, stickLoaded: 209, potLoaded: 15, givenAmt: 1305, stickBal: 136, potBal: 10, cashBag: 2620, phonePe: 1800, offer: 40 },
    { day: 7, stickLoaded: 214, potLoaded: 10, givenAmt: 1300, stickBal: 135, potBal: 5, cashBag: 2615, phonePe: 2080, offer: 0 },
    { day: 8, stickLoaded: 219, potLoaded: 5, givenAmt: 1305, stickBal: 159, potBal: 1, cashBag: 3030, phonePe: 800, offer: 60 },
    { day: 9, stickLoaded: 177, potLoaded: 1, givenAmt: 1320, stickBal: 101, potBal: 0, cashBag: 3230, phonePe: 1150, offer: 10 },
    { day: 10, stickLoaded: 137, potLoaded: 12, givenAmt: 1355, stickBal: 73, potBal: 12, cashBag: 2600, phonePe: 1280, offer: 20 },
    { day: 11, stickLoaded: 256, potLoaded: 12, givenAmt: 1305, stickBal: 141, potBal: 9, cashBag: 3100, phonePe: 2940, offer: 0 },
    { day: 12, stickLoaded: 285, potLoaded: 9, givenAmt: 1305, stickBal: 106, potBal: 0, cashBag: 5830, phonePe: 2970, offer: 100 },
    { day: 13, stickLoaded: 190, potLoaded: 12, givenAmt: 1335, stickBal: 138, potBal: 6, cashBag: 2030, phonePe: 1650, offer: 20 },
    { day: 14, stickLoaded: 216, potLoaded: 6, givenAmt: 1530, stickBal: 90, potBal: 3, cashBag: 4565, phonePe: 2100, offer: 40 },
    { day: 15, stickLoaded: 174, potLoaded: 15, givenAmt: 1365, stickBal: 72, potBal: 9, cashBag: 3020, phonePe: 2620, offer: 90 },
    { day: 16, stickLoaded: 192, potLoaded: 9, givenAmt: 1320, stickBal: 124, potBal: 5, cashBag: 2325, phonePe: 1820, offer: 80 },
    { day: 17, stickLoaded: 207, potLoaded: 17, givenAmt: 1505, stickBal: 104, potBal: 14, cashBag: 3450, phonePe: 2290, offer: 0 },
    { day: 18, stickLoaded: 215, potLoaded: 11, givenAmt: 1400, stickBal: 48, potBal: 1, cashBag: 5085, phonePe: 3400, offer: 0 },
    { day: 19, stickLoaded: 257, potLoaded: 16, givenAmt: 1405, stickBal: 82, potBal: 3, cashBag: 4680, phonePe: 4160, offer: 200 },
    { day: 20, stickLoaded: 213, potLoaded: 13, givenAmt: 1200, stickBal: 146, potBal: 12, cashBag: 2285, phonePe: 1580, offer: 50 },
    { day: 21, stickLoaded: 200, potLoaded: 12, givenAmt: 1205, stickBal: 129, potBal: 12, cashBag: 2860, phonePe: 1150, offer: 20 },
    { day: 22, stickLoaded: 170, potLoaded: 12, givenAmt: 1300, stickBal: 67, potBal: 11, cashBag: 2065, phonePe: 3340, offer: 50 },
    { day: 23, stickLoaded: 200, potLoaded: 11, givenAmt: 1405, stickBal: 99, potBal: 9, cashBag: 3520, phonePe: 1930, offer: 80 },
    { day: 24, stickLoaded: 218, potLoaded: 9, givenAmt: 1400, stickBal: 109, potBal: 4, cashBag: 4265, phonePe: 1730, offer: 0 },
    { day: 25, stickLoaded: 206, potLoaded: 16, givenAmt: 1405, stickBal: 57, potBal: 0, cashBag: 4050, phonePe: 4030, offer: 40 },
    { day: 26, stickLoaded: 231, potLoaded: 12, givenAmt: 1260, stickBal: 101, potBal: 3, cashBag: 4685, phonePe: 2210, offer: 0 },
    { day: 27, stickLoaded: 203, potLoaded: 3, givenAmt: 1280, stickBal: 114, potBal: 0, cashBag: 2630, phonePe: 2330, offer: 20 },
    { day: 28, stickLoaded: 174, potLoaded: 0, givenAmt: 1215, stickBal: 83, potBal: 0, cashBag: 2940, phonePe: 1840, offer: 60 },
    { day: 29, stickLoaded: 179, potLoaded: 0, givenAmt: 2940, stickBal: 130, potBal: 0, cashBag: 3345, phonePe: 1620, offer: 80 },
    { day: 30, stickLoaded: 192, potLoaded: 0, givenAmt: 1160, stickBal: 67, potBal: 0, cashBag: 4620, phonePe: 1530, offer: 0 }
  ];

  const settings = await getSettings();
  
  // Need to get previous balances from June if they existed, but we'll assume 0 for July 1st since we only have July data
  let prevStick = 0;
  let prevPot = 0;
  
  for (const row of rawData) {
    const stickSold = row.stickLoaded + prevStick - row.stickBal;
    const potSold = row.potLoaded + prevPot - row.potBal;
    
    const requiredAmount = (stickSold * settings.stickPrice) + (potSold * settings.potPrice);
    const actualAmount = row.cashBag + row.phonePe;
    const shortage = (requiredAmount - row.offer) - (actualAmount - row.givenAmt);
    const finalAmount = actualAmount - row.givenAmt - 15; // 15 is the platform rent

    const entry = {
      id: uuidv4(),
      date: `2026-07-${row.day.toString().padStart(2, '0')}`,
      stickLoaded: row.stickLoaded,
      stickBalance: row.stickBal,
      stickSold,
      plateLoaded: 0,
      plateBalance: 0,
      plateSold: 0,
      potLoaded: row.potLoaded,
      potBalance: row.potBal,
      potSold,
      cashBagLoaded: row.givenAmt,
      cashBagTotal: row.cashBag,
      phonePe: row.phonePe,
      discount: row.offer,
      expenses: 15,
      bonus: 0,
      requiredAmount,
      actualAmount,
      shortage,
      finalAmount,
      notes: 'Imported July Data / Platform Rent'
    };
    
    await saveEntry(entry);
    
    prevStick = row.stickBal;
    prevPot = row.potBal;
  }
}
