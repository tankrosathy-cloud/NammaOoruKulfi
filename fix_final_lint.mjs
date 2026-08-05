import fs from 'fs';

// Fix Dashboard
let dashboard = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');
dashboard = dashboard.replace(/import React, \{ useMemo, useState \} from 'react';/, "import React, { useMemo, useState, useEffect } from 'react';");
fs.writeFileSync('src/pages/Dashboard.tsx', dashboard);

// Fix Planner
let planner = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');
// Remove handleCopySummary (find start and end)
const startCopy = planner.indexOf('const handleCopySummary = () => {');
if (startCopy !== -1) {
  const endCopy = planner.indexOf('};', planner.indexOf('catch (err) {', startCopy)) + 2;
  planner = planner.substring(0, startCopy) + planner.substring(endCopy);
}
fs.writeFileSync('src/pages/Planner.tsx', planner);
