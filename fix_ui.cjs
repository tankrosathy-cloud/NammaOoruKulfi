const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const oldUI = `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs font-black uppercase tracking-widest text-pink-600 dark:text-pink-400 flex items-center gap-1.5">
                  <Package className="w-4 h-4" /> Live Stock Inventory
                </h3>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300">
                  Base: {baseStockDate} ({baseStickQty} Sticks)
                </span>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                  ⚡ Auto-Deducting Daily Sales
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                Available Now: <span className="text-slate-900 dark:text-white font-black text-xs">{availableStick} Sticks</span>, <span className="text-pink-600 dark:text-pink-400 font-black text-xs">{availablePot} Pots</span>
              </p>
            </div>

            {!isEditingInventory && (
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => setShowDeliveryModal(true)}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-8 px-3 text-xs shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> + ADD DELIVERY
                </Button>
                <Button 
                  onClick={startInventoryEdit} 
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl h-8 px-3 text-xs shadow-sm cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> OVERRIDE STOCK
                </Button>
                {role === 'owner' && (
                  <Button 
                    onClick={() => setShowResetModal(true)} 
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 font-bold rounded-xl h-8 px-3 text-xs shadow-sm cursor-pointer"
                  >
                    RESET TO ZERO
                  </Button>
                )}
              </div>
            )}
          </div>`;

const newUI = `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Live Inventory
                </h3>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Base: {baseStockDate}
                </span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{availableStick}</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Sticks</span>
                
                <span className="text-2xl font-black tracking-tight text-pink-600 dark:text-pink-400 ml-2">{availablePot}</span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Pots</span>
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Auto-deducting daily sales
              </p>
            </div>

            {!isEditingInventory && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  onClick={() => setShowDeliveryModal(true)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-xl h-10 px-4 text-sm shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Delivery
                </Button>
                <Button 
                  onClick={startInventoryEdit} 
                  variant="outline"
                  className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl h-10 px-4 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  <Edit2 className="w-4 h-4 mr-2" /> Override Stock
                </Button>
                {role === 'owner' && (
                  <Button 
                    onClick={() => setShowResetModal(true)} 
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-xl h-10 px-4 text-sm transition-all"
                  >
                    Reset
                  </Button>
                )}
              </div>
            )}
          </div>`;

code = code.replace(oldUI, newUI);
fs.writeFileSync('src/pages/Settings.tsx', code);
