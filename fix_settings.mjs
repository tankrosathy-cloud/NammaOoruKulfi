import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

// 1. Remove the prepended stuff
content = content.replace(/^const latestEntry = \[\.\.\.entries\]\.sort\(\(a, b\) => b\.date\.localeCompare\(a\.date\)\)\[0\];[\s\S]*?const currentInJobPot = isPotJobOpen \? \(latestEntry\.potLoaded \|\| 0\) : 0;\n/m, '');

// 2. Replace the old code in the middle
const regex = /const todayStr = new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\];\s*const todayEntry = entries\.find\(e => e\.date === todayStr\) \|\| entries\.find\(e => e\.date === inventory\.lastUpdatedDate\);\s*const isStickJobOpen = todayEntry && todayEntry\.stickBalance === undefined;\s*const isPotJobOpen = todayEntry && todayEntry\.potBalance === undefined;\s*const currentInJobStick = isStickJobOpen \? \(todayEntry\.stickLoaded \|\| 0\) : 0;\s*const currentInJobPot = isPotJobOpen \? \(todayEntry\.potLoaded \|\| 0\) : 0;/;

const replacement = `const latestEntry = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];
  const isStickJobOpen = latestEntry && latestEntry.stickBalance === undefined;
  const isPotJobOpen = latestEntry && latestEntry.potBalance === undefined;

  const currentInJobStick = isStickJobOpen ? (latestEntry.stickLoaded || 0) : 0;
  const currentInJobPot = isPotJobOpen ? (latestEntry.potLoaded || 0) : 0;`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/Settings.tsx', content);
