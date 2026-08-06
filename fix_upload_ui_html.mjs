import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

// Insert hidden file input and Upload Invoice button next to Stock Date
const dateBlockRegex = /<Label className="text-\[10px\] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Stock Date<\/Label>\s*<Input \s*type="date"\s*value=\{inventoryData.lastUpdatedDate\}\s*onChange=\{e => setInventoryData\(\{\.\.\.inventoryData, lastUpdatedDate: e.target.value\}\)\}\s*\/>/;

const newDateBlock = `<div className="flex justify-between items-center mb-1">
                      <Label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Stock Date</Label>
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                      <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] text-cyan-600 border-cyan-200 bg-cyan-50" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                        {isUploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                        {isUploading ? 'UPLOADING...' : 'UPLOAD INVOICE'}
                      </Button>
                    </div>
                    <Input 
                      type="date"
                      value={inventoryData.lastUpdatedDate}
                      onChange={e => setInventoryData({...inventoryData, lastUpdatedDate: e.target.value})}
                    />`;

content = content.replace(dateBlockRegex, newDateBlock);

// Insert confirmation Modal at the bottom of the return statement
const returnEndRegex = /<\/div>\s*\)\;\s*\}\s*$/;

const modalHTML = `
      {parsedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 uppercase">Confirm Invoice</h3>
            
            <div className="space-y-4 text-sm max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</span>
                <p className="font-bold text-slate-900 dark:text-white">{parsedInvoice.date}</p>
              </div>

              {parsedInvoice.stickFlavours && parsedInvoice.stickFlavours.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest">Stick Flavours Added</span>
                  <div className="space-y-1 mt-1">
                    {parsedInvoice.stickFlavours.map((f: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded text-xs">
                        <span className="dark:text-slate-300">{f.name}</span>
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">+{f.quantity} pcs</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {parsedInvoice.potFlavours && parsedInvoice.potFlavours.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Pot Flavours Added</span>
                  <div className="space-y-1 mt-1">
                    {parsedInvoice.potFlavours.map((f: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded text-xs">
                        <span className="dark:text-slate-300">{f.name}</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">+{f.quantity} pcs</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setParsedInvoice(null)}>CANCEL</Button>
              <Button type="button" className="flex-1 bg-pink-600 hover:bg-pink-700 text-white" onClick={confirmInvoice}>CONFIRM</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

content = content.replace(returnEndRegex, modalHTML);

fs.writeFileSync('src/pages/Settings.tsx', content);
