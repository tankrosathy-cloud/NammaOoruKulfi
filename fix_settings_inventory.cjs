const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

// Hide stick/pot/plate cards in Settings
code = code.replace(
  '{/* Stick Kulfi Card */}',
  '{settings.enableStick !== false && (\n                {/* Stick Kulfi Card */}'
);
code = code.replace(
  '{/* Pot Kulfi Card */}',
  '              )}\n              {settings.enablePot !== false && (\n                {/* Pot Kulfi Card */}'
);
code = code.replace(
  '{/* Plate Kulfi Card */}',
  '              )}\n              {settings.enablePlate && (\n                {/* Plate Kulfi Card */}'
);

// We need to close the plate kulfi card wrap. The plate kulfi card ends before:
// `            </div>
//
//            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">`
const endOfPlateRegex = /(<p className="text-xs font-black text-slate-900 dark:text-white mt-0\.5 block">\{currentDayRow\.closingPlate\}<\/span>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*<\/CardContent>\n\s*<\/Card>)/;
code = code.replace(endOfPlateRegex, "$1\n              )}");

// Base Stock Inputs
code = code.replace(
  '<div className="space-y-2">\n                        <Label className="text-[10px] font-bold uppercase text-slate-500">\n                        Stick Opening Stock (pcs)\n                        </Label>',
  '{settings.enableStick !== false && (<div className="space-y-2">\n                        <Label className="text-[10px] font-bold uppercase text-slate-500">\n                        Stick Opening Stock (pcs)\n                        </Label>'
);
code = code.replace(
  'onChange={e => setInventoryData({...inventoryData, stickQuantity: e.target.value === \'\' ? \'\' : Number(e.target.value)})}\n                        className="font-bold h-12 rounded-xl"\n                        />\n                      </div>',
  'onChange={e => setInventoryData({...inventoryData, stickQuantity: e.target.value === \'\' ? \'\' : Number(e.target.value)})}\n                        className="font-bold h-12 rounded-xl"\n                        />\n                      </div>)}'
);

code = code.replace(
  '<div className="space-y-2">\n                        <Label className="text-[10px] font-bold uppercase text-slate-500">\n                        Pot Opening Stock (pcs)\n                        </Label>',
  '{settings.enablePot !== false && (<div className="space-y-2">\n                        <Label className="text-[10px] font-bold uppercase text-slate-500">\n                        Pot Opening Stock (pcs)\n                        </Label>'
);
code = code.replace(
  'onChange={e => setInventoryData({...inventoryData, potQuantity: e.target.value === \'\' ? \'\' : Number(e.target.value)})}\n                        className="font-bold h-12 rounded-xl"\n                        />\n                      </div>',
  'onChange={e => setInventoryData({...inventoryData, potQuantity: e.target.value === \'\' ? \'\' : Number(e.target.value)})}\n                        className="font-bold h-12 rounded-xl"\n                        />\n                      </div>)}'
);

code = code.replace(
  '<div className="space-y-2">\n                        <Label className="text-[10px] font-bold uppercase text-slate-500">\n                        Plate Opening Stock (pcs)\n                        </Label>',
  '{settings.enablePlate && (<div className="space-y-2">\n                        <Label className="text-[10px] font-bold uppercase text-slate-500">\n                        Plate Opening Stock (pcs)\n                        </Label>'
);
code = code.replace(
  'onChange={e => setInventoryData({...inventoryData, plateQuantity: e.target.value === \'\' ? \'\' : Number(e.target.value)})}\n                        className="font-bold h-12 rounded-xl"\n                        />\n                      </div>',
  'onChange={e => setInventoryData({...inventoryData, plateQuantity: e.target.value === \'\' ? \'\' : Number(e.target.value)})}\n                        className="font-bold h-12 rounded-xl"\n                        />\n                      </div>)}'
);

// Delivery Form Inputs
code = code.replace(
  '<div className="space-y-2">\n                      <Label className="text-[10px] font-bold uppercase text-slate-500">Add Sticks (pcs)</Label>',
  '{settings.enableStick !== false && (<div className="space-y-2">\n                      <Label className="text-[10px] font-bold uppercase text-slate-500">Add Sticks (pcs)</Label>'
);
code = code.replace(
  'onChange={e => setDeliveryAddQuantity({ ...deliveryAddQuantity, stick: e.target.value })}\n                      className="font-bold h-12 rounded-xl"\n                      />\n                    </div>',
  'onChange={e => setDeliveryAddQuantity({ ...deliveryAddQuantity, stick: e.target.value })}\n                      className="font-bold h-12 rounded-xl"\n                      />\n                    </div>)}'
);

code = code.replace(
  '<div className="space-y-2">\n                      <Label className="text-[10px] font-bold uppercase text-slate-500">Add Pots (pcs)</Label>',
  '{settings.enablePot !== false && (<div className="space-y-2">\n                      <Label className="text-[10px] font-bold uppercase text-slate-500">Add Pots (pcs)</Label>'
);
code = code.replace(
  'onChange={e => setDeliveryAddQuantity({ ...deliveryAddQuantity, pot: e.target.value })}\n                      className="font-bold h-12 rounded-xl"\n                      />\n                    </div>',
  'onChange={e => setDeliveryAddQuantity({ ...deliveryAddQuantity, pot: e.target.value })}\n                      className="font-bold h-12 rounded-xl"\n                      />\n                    </div>)}'
);

code = code.replace(
  '<div className="space-y-2">\n                      <Label className="text-[10px] font-bold uppercase text-slate-500">Add Plates (pcs)</Label>',
  '{settings.enablePlate && (<div className="space-y-2">\n                      <Label className="text-[10px] font-bold uppercase text-slate-500">Add Plates (pcs)</Label>'
);
code = code.replace(
  'onChange={e => setDeliveryAddQuantity({ ...deliveryAddQuantity, plate: e.target.value })}\n                      className="font-bold h-12 rounded-xl"\n                      />\n                    </div>',
  'onChange={e => setDeliveryAddQuantity({ ...deliveryAddQuantity, plate: e.target.value })}\n                      className="font-bold h-12 rounded-xl"\n                      />\n                    </div>)}'
);

fs.writeFileSync('src/pages/Settings.tsx', code);
