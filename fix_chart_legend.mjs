import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

// First check if Legend is imported from recharts
if (!content.includes("Legend")) {
  content = content.replace("import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';", "import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';");
}

const regex = /<Bar dataKey="stickSold" name="Stick Kulfi" fill="#06b6d4" radius=\{\[4, 4, 0, 0\]\} \/>\s*<Bar dataKey="potSold" name="Pot Kulfi" fill="#ec4899" radius=\{\[4, 4, 0, 0\]\} \/>\s*<\/BarChart>/;

const newCode = `<Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="stickSold" name="Stick" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="potSold" name="Pot" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>`;

content = content.replace(regex, newCode);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
