import fs from 'fs';

// Fix Dashboard
let dashboard = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');
dashboard = dashboard.replace(/import React, \{ useState, useMemo \} from 'react';/, "import React, { useState, useMemo, useEffect } from 'react';");
fs.writeFileSync('src/pages/Dashboard.tsx', dashboard);

// Fix Planner
let planner = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');
planner = planner.replace(/weather\.toUpperCase\(\)/g, "weatherCondition.toUpperCase()");
planner = planner.replace(/setCopied\(true\);/g, "");
planner = planner.replace(/setTimeout\(\(\) => setCopied\(false\), 2000\);/g, "");

const manualBoosterRegex2 = /<div className="flex justify-between items-center">\s*<Label className="text-\[10px\] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">\s*Manual Booster Adjustment\s*<\/Label>[\s\S]*?<\/div>\s*<\/div>/g;
planner = planner.replace(manualBoosterRegex2, "");

// In case the manualBooster block looks different:
const mbRegex3 = /<div className="space-y-3">\s*<div className="flex justify-between items-center">\s*<Label className="text-\[10px\] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">\s*Manual Booster Adjustment[\s\S]*?<\/div>\s*<\/div>/g;
planner = planner.replace(mbRegex3, "");

// Let's just remove anything with manualBooster
planner = planner.replace(/<span className=\{`text-\[10px\].*?manualBooster[\s\S]*?<\/div>\s*<\/div>/g, "");

// Specifically replace the lines throwing errors:
const mbRegex4 = /<div className="flex justify-between items-center">[\s\S]*?manualBooster[\s\S]*?<\/span>\s*<\/div>\s*<input[\s\S]*?onChange=\{\(e\) => setManualBooster\(Number\(e\.target\.value\)\)\}[\s\S]*?\/>[\s\S]*?<\/div>/g;
planner = planner.replace(mbRegex4, "");

fs.writeFileSync('src/pages/Planner.tsx', planner);
