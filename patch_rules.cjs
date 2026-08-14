const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

const newRule = `
    match /specialOrders/{document=**} {
      allow read, write, delete: if request.auth != null;
    }
    match /logs/{document=**} {
`;

code = code.replace(/match \/logs\/\{document=\*\*\} \{/, newRule);
fs.writeFileSync('firestore.rules', code);
