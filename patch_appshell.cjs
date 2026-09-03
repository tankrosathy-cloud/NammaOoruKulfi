const fs = require('fs');
let content = fs.readFileSync('src/AppShell.tsx', 'utf8');

content = content.replace(
  /export default function AppShell\(\) \{\s*const \{ profile \} = useFranchise\(\);\s*setCurrentFranchiseId\(profile\?\.franchiseId \|\| null\);\s*return \(\s*<StoreProvider franchiseId=\{profile\?\.franchiseId\}>\s*<AppShellContent \/>\s*<\/StoreProvider>\s*\);\s*\}/m,
  `export default function AppShell() {
  const { profile, franchise } = useFranchise();
  
  let activeFid = franchise?.id || profile?.franchiseId || null;
  if (profile?.role === 'superadmin' && !franchise) {
    activeFid = 'all';
  }

  setCurrentFranchiseId(activeFid);

  return (
    <StoreProvider franchiseId={activeFid}>
      <AppShellContent />
    </StoreProvider>
  );
}`
);

fs.writeFileSync('src/AppShell.tsx', content);
console.log('AppShell patched');
