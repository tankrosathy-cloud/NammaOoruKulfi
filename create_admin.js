import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import fs from 'fs';

const fbConfigPath = 'firebase-applet-config.json';
if (fs.existsSync(fbConfigPath)) {
  const config = JSON.parse(fs.readFileSync(fbConfigPath, 'utf8'));
  const app = initializeApp(config.firebaseConfig);
  const auth = getAuth(app);
  createUserWithEmailAndPassword(auth, 'superadmin@gmail.com', 'admin123')
    .then(() => { console.log("Super admin created."); process.exit(0); })
    .catch(e => { console.log(e.message); process.exit(0); });
} else {
  console.log("No config");
}
