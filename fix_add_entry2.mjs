import fs from 'fs';
let content = fs.readFileSync('src/pages/AddEntry.tsx', 'utf-8');

const regex3 = /stickBalance: stickBalanceVal,/g;
const replacement3 = `...(formData.stickBalance !== '' ? { stickBalance: parseInt(formData.stickBalance) } : {}),`;
content = content.replace(regex3, replacement3);

const regex4 = /potBalance: potBalanceVal,/g;
const replacement4 = `...(formData.potBalance !== '' ? { potBalance: parseInt(formData.potBalance) } : {}),`;
content = content.replace(regex4, replacement4);

fs.writeFileSync('src/pages/AddEntry.tsx', content);
