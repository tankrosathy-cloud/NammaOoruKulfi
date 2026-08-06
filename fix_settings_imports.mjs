import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

// Update imports
content = content.replace("import { Package, Edit2, KeyRound, LogOut } from 'lucide-react';", 
"import { Package, Edit2, KeyRound, LogOut, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';\nimport { useRef } from 'react';");

content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect, useRef } from 'react';");

fs.writeFileSync('src/pages/Settings.tsx', content);
