import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

// The password reset and session management are at the bottom. 
// We want to move them inside the first block: {activeTab === 'settings' && role === 'owner' ? ( ... ) : activeTab === 'inventory' ? ( ... ) }
// Actually, it's easier to just wrap the bottom sections.

const bottomSectionRegex = /\{\/\* Password Reset Section \(always visible at the bottom of Admin\/Inventory page\) \*\/\}([\s\S]*?)<\/Card>\s*\{\/\* Session Management Section \*\/\}([\s\S]*?)<\/Card>/;

const replacement = `{activeTab === 'settings' && role === 'owner' && (
        <>
          {/* Password Reset Section */}
$1</Card>
          {/* Session Management Section */}
$2</Card>
        </>
      )}`;

content = content.replace(bottomSectionRegex, replacement);

fs.writeFileSync('src/pages/Settings.tsx', content);
