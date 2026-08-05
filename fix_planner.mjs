import fs from 'fs';
let content = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');

const oldReturn = `    return {
      histAvgStick: result.avgStick,
      histAvgPot: result.avgPot,
      dayOfWeekAvgStick: result.avgStick,
      dayOfWeekAvgPot: result.avgPot,
      recent7DayAvgStick: result.avgStick,
      recent7DayAvgPot: result.avgPot,
      predictedStick: result.stick,
      predictedPot: result.pot,
      availableStick,
      availablePot,
      shortageStick: Math.max(0, result.stick - availableStick),
      shortagePot: Math.max(0, result.pot - availablePot),
      multiplier: result.multiplier,
      hasData: result.hasData
    };`;

const newReturn = `    return {
      histAvgStick: result.histAvgStick,
      histAvgPot: result.histAvgPot,
      dayOfWeekAvgStick: result.dayOfWeekAvgStick,
      dayOfWeekAvgPot: result.dayOfWeekAvgPot,
      recent7DayAvgStick: result.recent7DayAvgStick,
      recent7DayAvgPot: result.recent7DayAvgPot,
      predictedStick: result.stick,
      predictedPot: result.pot,
      availableStick,
      availablePot,
      shortageStick: Math.max(0, result.stick - availableStick),
      shortagePot: Math.max(0, result.pot - availablePot),
      multiplier: result.multiplier,
      hasData: result.hasData
    };`;

content = content.replace(oldReturn, newReturn);
fs.writeFileSync('src/pages/Planner.tsx', content);
