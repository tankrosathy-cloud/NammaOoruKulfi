import fs from 'fs';
let content = fs.readFileSync('src/pages/AddEntry.tsx', 'utf-8');

const regex = /stickBalance: parseInt\(formData\.stickBalance\) \|\| 0,/g;
const replacement = "stickBalance: stickBalanceVal,";
content = content.replace(regex, replacement);

const regex2 = /potBalance: parseInt\(formData\.potBalance\) \|\| 0,/g;
const replacement2 = "potBalance: potBalanceVal,";
content = content.replace(regex2, replacement2);

fs.writeFileSync('src/pages/AddEntry.tsx', content);
