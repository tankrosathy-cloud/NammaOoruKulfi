import fs from 'fs';
let content = fs.readFileSync('src/pages/AddEntry.tsx', 'utf-8');

// Remove handleDelete function
const handleDeleteRegex = /const handleDelete = async \(\) => \{[\s\S]*?finally \{\s*setLoading\(false\);\s*\}\s*\};/;
content = content.replace(handleDeleteRegex, '');

// Remove DELETE ENTRY button
const deleteBtnRegex = /\{isEditing && \(\s*<Button type="button" onClick=\{handleDelete\}.*?>\s*DELETE ENTRY\s*<\/Button>\s*\)\}/;
content = content.replace(deleteBtnRegex, '');

fs.writeFileSync('src/pages/AddEntry.tsx', content);
