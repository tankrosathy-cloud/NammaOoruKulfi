const fs = require('fs');
const content = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const regex = /const \[inviteCopied, setInviteCopied\] = useState\(false\);/;
if (regex.test(content)) {
  console.log('Match found for state injection.');
}
