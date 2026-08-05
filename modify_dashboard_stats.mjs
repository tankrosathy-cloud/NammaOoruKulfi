import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

content = content.replace('let monthlyExpenses = 0;', 'let monthlyExpenses = 0;\n    let monthlyShortage = 0;');

content = content.replace(
  'monthlyExpenses += expenses;',
  'monthlyExpenses += expenses;\n          monthlyShortage += (e.shortage || 0);'
);

content = content.replace(
  'monthlyNet: monthlyRevenue - monthlyExpenses,',
  'monthlyNet: monthlyRevenue - monthlyExpenses,\n      monthlyShortage,'
);

// Update the grid layout for Expenses
content = content.replace(
  '<motion.div variants={itemVariants} className="grid grid-cols-1 gap-4">\n        <Card className={cardBg}>\n          <CardHeader className="p-5 pb-2">\n            <CardTitle className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${labelColor}`}>\n              <AlertCircle className="w-4 h-4 text-pink-600 dark:text-pink-400" /> Expenses',
  `<motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <Card className={cardBg}>
          <CardHeader className="p-5 pb-2">
            <CardTitle className={\`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 \${labelColor}\`}>
              <AlertCircle className="w-4 h-4 text-pink-600 dark:text-pink-400" /> Expenses`
);

// Add the Shortage card
content = content.replace(
  '<p className="text-[10px] font-extrabold text-pink-600 dark:text-pink-400 uppercase tracking-wider mt-2">This month</p>\n          </CardContent>\n        </Card>\n      </motion.div>',
  `<p className="text-[10px] font-extrabold text-pink-600 dark:text-pink-400 uppercase tracking-wider mt-2">This month</p>
          </CardContent>
        </Card>
        <Card className={cardBg}>
          <CardHeader className="p-5 pb-2">
            <CardTitle className={\`text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 \${labelColor}\`}>
              <TrendingDown className="w-4 h-4 text-orange-500 dark:text-orange-400" /> Shortage
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-3xl font-black leading-none text-orange-500 dark:text-orange-400">{formatCurrency(stats.monthlyShortage)}</div>
            <p className="text-[10px] font-extrabold text-orange-500 dark:text-orange-400 uppercase tracking-wider mt-2">This month</p>
          </CardContent>
        </Card>
      </motion.div>`
);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
