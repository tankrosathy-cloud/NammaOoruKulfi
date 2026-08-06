import fs from 'fs';
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf-8');

const regex = /\s*\{\/\* Current Month Analytics \(Trends & Distribution\) \*\/\}/;

const newUI = `
      {/* Inventory Stats */}
      <motion.div variants={itemVariants} className="space-y-4">
        <h3 className={\`text-xs font-black uppercase tracking-widest \${isDark ? 'text-slate-400' : 'text-slate-700'}\`}>
          Inventory Status
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <Card className={cardBg}>
            <CardContent className="p-4 flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
                <Package className="w-3 h-3" /> Stick Sold
              </p>
              <div className="text-2xl font-black text-cyan-600 dark:text-cyan-400">{inventoryStats.totalStickSold} <span className="text-sm font-bold">pcs</span></div>
            </CardContent>
          </Card>
          
          <Card className={cardBg}>
            <CardContent className="p-4 flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-pink-600 dark:text-pink-400 flex items-center gap-1">
                <Package className="w-3 h-3" /> Pot Sold
              </p>
              <div className="text-2xl font-black text-pink-600 dark:text-pink-400">{inventoryStats.totalPotSold} <span className="text-sm font-bold">pcs</span></div>
            </CardContent>
          </Card>

          <Card className={cardBg}>
            <CardContent className="p-4 flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-cyan-800 dark:text-cyan-500">
                Stick Available
              </p>
              <div className="text-2xl font-black text-cyan-800 dark:text-cyan-500">{inventoryStats.availableStick} <span className="text-sm font-bold">pcs</span></div>
            </CardContent>
          </Card>
          
          <Card className={cardBg}>
            <CardContent className="p-4 flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-pink-800 dark:text-pink-500">
                Pot Available
              </p>
              <div className="text-2xl font-black text-pink-800 dark:text-pink-500">{inventoryStats.availablePot} <span className="text-sm font-bold">pcs</span></div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Current Month Analytics (Trends & Distribution) */}`;

content = content.replace(regex, newUI);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
