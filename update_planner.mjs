import fs from 'fs';
let content = fs.readFileSync('src/pages/Planner.tsx', 'utf-8');

const inputPanelRegex = /\{\/\* Left Column: Input Panel \*\/\}[\s\S]*?\{\/\* Center\/Right Column: Analytical Summary \*\/\}/;
content = content.replace(inputPanelRegex, "{/* Analytical Summary */}");

content = content.replace(/<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">/, '<div className="space-y-6">');
content = content.replace(/<div className="space-y-6 lg:col-span-2">/, '<div className="space-y-6">');

fs.writeFileSync('src/pages/Planner.tsx', content);
