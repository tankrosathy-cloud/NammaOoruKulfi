const fs = require('fs');
let code = fs.readFileSync('src/components/Login.tsx', 'utf8');

const oldEffect = `  useEffect(() => {
    // Setup invisible recaptcha
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
    }
  }, []);`;

const newEffect = `  useEffect(() => {
    // Clean up any existing verifier first to prevent the "client element has been removed" error
    if ((window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier.clear();
      } catch (e) {}
      (window as any).recaptchaVerifier = null;
    }
    
    // Setup invisible recaptcha
    if (!(window as any).recaptchaVerifier) {
      try {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
        });
      } catch (e) {
        console.error("Recaptcha setup error:", e);
      }
    }

    return () => {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {}
        (window as any).recaptchaVerifier = null;
      }
    };
  }, []);`;

code = code.replace(oldEffect, newEffect);
fs.writeFileSync('src/components/Login.tsx', code);
