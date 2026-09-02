const fs = require('fs');

let appShell = fs.readFileSync('src/AppShell.tsx', 'utf-8');
appShell = appShell.replace("<Reports role={role} ", "<Reports role={role as any} ");
fs.writeFileSync('src/AppShell.tsx', appShell);

let reports = fs.readFileSync('src/pages/Reports.tsx', 'utf-8');
reports = reports.replace("role: 'owner' | 'manager'", "role: 'owner' | 'staff'");
fs.writeFileSync('src/pages/Reports.tsx', reports);

let settings = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');
settings = settings.replace("role: 'owner' | 'manager'", "role: 'owner' | 'staff'");
fs.writeFileSync('src/pages/Settings.tsx', settings);

