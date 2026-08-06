import fs from 'fs';
let content = fs.readFileSync('.env.example', 'utf-8');
content = content.replace("GEMINI_API_KEY=\n", "");
fs.writeFileSync('.env.example', content);
