import fs from 'fs';
let content = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');

// Remove the Sync button
const buttonRegex = /<button\s*onClick=\{fetchWeatherForecast\}[\s\S]*?<\/button>/;
content = content.replace(buttonRegex, '');

fs.writeFileSync('src/pages/Planner.tsx', content);
