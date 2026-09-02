const fs = require('fs');
let code = fs.readFileSync('src/components/Login.tsx', 'utf8');

code = code.replace(
  'if (!window.recaptchaVerifier) {',
  'if (!(window as any).recaptchaVerifier) {'
);
code = code.replace(
  "window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {",
  "(window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {"
);
code = code.replace(
  'linkWithPhoneNumber(userCred.user, phone, window.recaptchaVerifier)',
  'linkWithPhoneNumber(userCred.user, phone, (window as any).recaptchaVerifier)'
);
code = code.replace(
  'signInWithPhoneNumber(auth, phone, window.recaptchaVerifier)',
  'signInWithPhoneNumber(auth, phone, (window as any).recaptchaVerifier)'
);

fs.writeFileSync('src/components/Login.tsx', code);
