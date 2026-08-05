import fs from 'fs';
let content = fs.readFileSync('src/pages/Settings.tsx', 'utf-8');

const regex = /const \[passwordLoading, setPasswordLoading\] = useState\(false\);/;
const replacement = `const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/pages/Settings.tsx', content);
