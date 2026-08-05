import fs from 'fs';
let content = fs.readFileSync('src/AppShell.tsx', 'utf-8');

const regex = /const \[activeTab, setActiveTab\] = useState<.*?>(.*?);/;
const replacement = `const [activeTab, setActiveTab] = useState<'dashboard' | 'add' | 'expense' | 'reports' | 'planner' | 'settings' | 'logs'>$1;

  useEffect(() => {
    const mainContainer = document.querySelector('main');
    if (mainContainer) mainContainer.scrollTo(0, 0);
  }, [activeTab]);`;

// Need to make sure useEffect is imported. It might not be.
if (!content.includes('useEffect')) {
    content = content.replace(/import React, \{ useState \} from 'react';/, "import React, { useState, useEffect } from 'react';");
}

content = content.replace(regex, replacement);
fs.writeFileSync('src/AppShell.tsx', content);
