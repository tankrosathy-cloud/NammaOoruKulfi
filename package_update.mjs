import fs from 'fs';
let content = JSON.parse(fs.readFileSync('package.json', 'utf8'));

content.scripts = {
    "dev": "tsx server.ts",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "start": "node dist/server.cjs",
    "preview": "vite preview",
    "clean": "rm -rf dist server.js",
    "lint": "tsc --noEmit"
};

if (!content.dependencies['multer']) content.dependencies['multer'] = '^1.4.5-lts.1';
if (!content.devDependencies['@types/multer']) content.devDependencies['@types/multer'] = '^1.4.12';

fs.writeFileSync('package.json', JSON.stringify(content, null, 2));
