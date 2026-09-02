const fs = require('fs');
let code = fs.readFileSync('src/store.tsx', 'utf8');

code = code.replace(
  `const DEFAULT_SETTINGS: Settings = {
  enableStick: true,
  enablePot: true,
  enablePlate: false,
  stickPrice: 40,
  potPrice: 50,
  platePrice: 75,
  platformFee: 15,
  monthlyGoal: 150000,
};`,
  `const DEFAULT_SETTINGS: Settings = {
  enableStick: true,
  enablePot: true,
  enablePlate: true,
  enablePlatformFee: false,
  stickPrice: 40,
  potPrice: 50,
  platePrice: 75,
  platformFee: 0,
  monthlyGoal: 150000,
};`
);

fs.writeFileSync('src/store.tsx', code);
