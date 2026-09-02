const fs = require('fs');

// Settings
let set = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
set = set.replace(
  "const availablePot = availableStats.availablePot;",
  "const availablePot = availableStats.availablePot;\n  const availablePlate = availableStats.availablePlate;"
);
fs.writeFileSync('src/pages/Settings.tsx', set);

// AddEntry
let ae = fs.readFileSync('src/pages/AddEntry.tsx', 'utf8');
ae = ae.replace(
  "const { availableStick, availablePot } = useMemo(() => {",
  "const { availableStick, availablePot, availablePlate } = useMemo(() => {"
);
ae = ae.replace(
  "return { availableStick: stats.availableStick, availablePot: stats.availablePot };",
  "return { availableStick: stats.availableStick, availablePot: stats.availablePot, availablePlate: stats.availablePlate };"
);
ae = ae.replace(
  "return { availableStick: 0, availablePot: 0 };",
  "return { availableStick: 0, availablePot: 0, availablePlate: 0 };"
);

// Fix duplicated `plateLoaded`
// Actually, let's just find and replace the specific chunk to clean it
// The chunk is:
//         plateLoaded: parseInt(formData.plateLoaded) || 0,
//         ...(formData.plateBalance !== '' ? { plateBalance: parseInt(formData.plateBalance) } : {}),
//         plateSold,
//         plateLoaded: parseInt(formData.plateLoaded) || 0,
//         ...(formData.plateBalance !== '' ? { plateBalance: parseInt(formData.plateBalance) } : {}),
//         plateSold,

ae = ae.replace(/plateLoaded: parseInt\(formData\.plateLoaded\) \|\| 0,\n        \.\.\.\(formData\.plateBalance !== '' \? \{ plateBalance: parseInt\(formData\.plateBalance\) \} : \{\}\),\n        plateSold,\n        plateLoaded: parseInt\(formData\.plateLoaded\) \|\| 0,\n        \.\.\.\(formData\.plateBalance !== '' \? \{ plateBalance: parseInt\(formData\.plateBalance\) \} : \{\}\),\n        plateSold,/g, "plateLoaded: parseInt(formData.plateLoaded) || 0,\n        ...(formData.plateBalance !== '' ? { plateBalance: parseInt(formData.plateBalance) } : {}),\n        plateSold,");

// One with less indentation
ae = ae.replace(/plateLoaded: parseInt\(formData\.plateLoaded\) \|\| 0,\n      \.\.\.\(formData\.plateBalance !== '' \? \{ plateBalance: parseInt\(formData\.plateBalance\) \} : \{\}\),\n      plateSold,\n      plateLoaded: parseInt\(formData\.plateLoaded\) \|\| 0,\n      \.\.\.\(formData\.plateBalance !== '' \? \{ plateBalance: parseInt\(formData\.plateBalance\) \} : \{\}\),\n      plateSold,/g, "plateLoaded: parseInt(formData.plateLoaded) || 0,\n      ...(formData.plateBalance !== '' ? { plateBalance: parseInt(formData.plateBalance) } : {}),\n      plateSold,");

fs.writeFileSync('src/pages/AddEntry.tsx', ae);
