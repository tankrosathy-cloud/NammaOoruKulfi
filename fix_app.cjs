const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace the embedded Login component entirely.
// Find "function Login() {" and remove everything to the end of the file.
const loginIndex = code.indexOf('function Login() {');
if (loginIndex !== -1) {
    code = code.substring(0, loginIndex);
}

// Add the import for Login if it doesn't exist
if (!code.includes("import { Login } from './components/Login'")) {
    code = code.replace(
        "import SuperAdmin from './pages/SuperAdmin';",
        "import SuperAdmin from './pages/SuperAdmin';\nimport { Login } from './components/Login';"
    );
}

fs.writeFileSync('src/App.tsx', code);
