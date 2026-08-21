import fs from 'fs';

let content = fs.readFileSync('src/store.tsx', 'utf-8');

content = content.replace(
  'const unsubEntries = onSnapshot(query(collection(db, \'entries\'), orderBy(\'date\', \'desc\'), limit(entriesLimit)), (snapshot) => {',
  `const unsubEntries = onSnapshot(query(collection(db, 'entries'), orderBy('date', 'desc'), limit(entriesLimit)), (snapshot) => {`
);

// Actually, I'll just check if there's any error callback.
if (!content.includes('Error fetching entries in realtime')) {
  content = content.replace(
    '      setEntriesLoading(false);\n    });',
    '      setEntriesLoading(false);\n    }, (err) => console.error("Error fetching entries in realtime:", err));'
  );
  fs.writeFileSync('src/store.tsx', content);
}
