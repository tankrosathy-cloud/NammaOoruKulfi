import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

content = content.replace(
  "import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';",
  "import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';"
);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
