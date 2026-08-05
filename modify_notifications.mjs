import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

content = content.replace(
  "import { TrendingUp, TrendingDown, Package, AlertCircle, BarChart3, PieChart as PieIcon, Activity, Sparkles, Sun, CloudRain, PartyPopper, Calendar } from 'lucide-react';",
  "import { TrendingUp, TrendingDown, Package, AlertCircle, BarChart3, PieChart as PieIcon, Activity, Sparkles, Sun, CloudRain, PartyPopper, Calendar, Bell, X } from 'lucide-react';"
);

content = content.replace(
  "export default function Dashboard() {",
  "export default function Dashboard() {\n  const [showNotifications, setShowNotifications] = useState(false);"
);

const overviewRegex = /<motion\.div variants=\{itemVariants\}>\s*<h2 className=\{`text-3xl font-black tracking-tighter uppercase mb-1 \$\{\s*isDark \? 'text-white' : 'text-slate-900'\s*\}`\}>Overview<\/h2>\s*<p className=\{`\$\{labelColor\} text-\[10px\] font-bold uppercase tracking-widest`\}>Monthly performance & current inventory<\/p>\s*<\/motion\.div>/m;

const replacement = `<motion.div variants={itemVariants} className="flex justify-between items-start relative">
        <div>
          <h2 className={\`text-3xl font-black tracking-tighter uppercase mb-1 \${
            isDark ? 'text-white' : 'text-slate-900'
          }\`}>Overview</h2>
          <p className={\`\${labelColor} text-[10px] font-bold uppercase tracking-widest\`}>Monthly performance & current inventory</p>
        </div>
        
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2.5 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800 animate-pulse"></span>
        </button>

        {showNotifications && (
          <div className={\`absolute top-14 right-0 w-72 z-50 rounded-2xl shadow-xl border p-4 \${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }\`}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-900 dark:text-white">Notifications</h3>
              <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className={\`p-3 rounded-xl border \${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-blue-50 border-blue-100'}\`}>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className={\`text-[11px] font-bold \${isDark ? 'text-blue-400' : 'text-blue-700'}\`}>Stock Update Reminder</p>
                    <p className={\`text-[10px] mt-0.5 leading-snug \${isDark ? 'text-slate-400' : 'text-slate-600'}\`}>Don't forget to verify physical stock against dashboard balance today.</p>
                  </div>
                </div>
              </div>
              <div className={\`p-3 rounded-xl border \${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'}\`}>
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className={\`text-[11px] font-bold \${isDark ? 'text-emerald-400' : 'text-emerald-600'}\`}>System Message</p>
                    <p className={\`text-[10px] mt-0.5 leading-snug \${isDark ? 'text-slate-400' : 'text-slate-600'}\`}>Dashboard data synced successfully.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>`;

if (overviewRegex.test(content)) {
  content = content.replace(overviewRegex, replacement);
  fs.writeFileSync('src/pages/Dashboard.tsx', content);
  console.log('Successfully added notifications to dashboard.');
} else {
  console.log('Regex failed to match. Trying fallback.');
  // Fallback
  const idx = content.indexOf('<p className={`${labelColor} text-[10px] font-bold uppercase tracking-widest`}>Monthly performance & current inventory</p>');
  if (idx !== -1) {
    const endDivIdx = content.indexOf('</motion.div>', idx);
    if (endDivIdx !== -1) {
        // Just print an error to handle manually
        console.log('Fallback needed manual handling');
    }
  }
}

