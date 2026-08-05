import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

const regex = /const latestEntry = \[\.\.\.entries\]\.sort\(\(a, b\) => b\.date\.localeCompare\(a\.date\)\)\[0\];\s*const latestStickLoaded = latestEntry \? \(latestEntry\.stickLoaded \|\| 0\) : 0;\s*const latestStickBalance = latestEntry \? \(latestEntry\.stickBalance \|\| 0\) : 0;\s*const latestPotLoaded = latestEntry \? \(latestEntry\.potLoaded \|\| 0\) : 0;\s*const latestPotBalance = latestEntry \? \(latestEntry\.potBalance \|\| 0\) : 0;/g;

const replacement = `const todayStr = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === todayStr) || entries.find(e => e.date === inventory.lastUpdatedDate);
  const isStickJobOpen = todayEntry && todayEntry.stickBalance === undefined;
  const isPotJobOpen = todayEntry && todayEntry.potBalance === undefined;

  const currentInJobStick = isStickJobOpen ? (todayEntry.stickLoaded || 0) : 0;
  const currentInJobPot = isPotJobOpen ? (todayEntry.potLoaded || 0) : 0;

  const currentWarehouseStickBalance = availableStick - currentInJobStick;
  const currentWarehousePotBalance = availablePot - currentInJobPot;`;

content = content.replace(regex, replacement);

content = content.replace(/latestStickLoaded/g, 'currentInJobStick');
content = content.replace(/latestStickBalance/g, 'currentWarehouseStickBalance');
content = content.replace(/latestPotLoaded/g, 'currentInJobPot');
content = content.replace(/latestPotBalance/g, 'currentWarehousePotBalance');

fs.writeFileSync('src/pages/Settings.tsx', content);
