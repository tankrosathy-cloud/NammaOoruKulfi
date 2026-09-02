const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const oldOverride = `          {/* EDIT BASELINE MODAL / CARD */}
          {isEditingInventory && (
            <Card className="border-2 border-pink-400 dark:border-pink-800 shadow-xl bg-white dark:bg-slate-900">
              <CardContent className="p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                      <Edit2 className="w-4 h-4 text-pink-500" /> Manual Stock Override
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                      Set a counted physical baseline. All sales recorded on or after this date will automatically be subtracted.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] font-black tracking-wider text-cyan-600 dark:text-cyan-400 border-cyan-300 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/40" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                      {isUploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                      {isUploading ? 'UPLOADING...' : 'UPLOAD INVOICE'}
                    </Button>
                  </div>
                </div>`;

const newOverride = `          {/* EDIT BASELINE MODAL / CARD */}
          {isEditingInventory && (
            <Card className="border border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-900">
              <CardContent className="p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Edit2 className="w-4 h-4 text-slate-400" /> Manual Stock Override
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Set a physical baseline count. Sales on or after this date are automatically subtracted.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    <Button type="button" variant="outline" size="sm" className="h-8 text-xs font-medium text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                      {isUploading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                      {isUploading ? 'Uploading...' : 'Upload Invoice'}
                    </Button>
                  </div>
                </div>`;

code = code.replace(oldOverride, newOverride);
fs.writeFileSync('src/pages/Settings.tsx', code);
