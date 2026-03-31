const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', 'backend', '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');

try {
  const vapidKeys = webpush.generateVAPIDKeys();
  console.log('Generated new VAPID keys.');

  const updateEnv = (filePath, publicKey, privateKey) => {
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Update public key
    const pubRegex = /^VAPID_PUBLIC_KEY=.*$/m;
    const vitePubRegex = /^VITE_VAPID_PUBLIC_KEY=.*$/m;
    
    if (pubRegex.test(content)) {
      content = content.replace(pubRegex, `VAPID_PUBLIC_KEY="${publicKey}"`);
    } else if (vitePubRegex.test(content)) {
      content = content.replace(vitePubRegex, `VITE_VAPID_PUBLIC_KEY="${publicKey}"`);
    } else {
      content += `\nVAPID_PUBLIC_KEY="${publicKey}"\n`;
    }

    // Update private key
    const privRegex = /^VAPID_PRIVATE_KEY=.*$/m;
    if (privRegex.test(content)) {
      content = content.replace(privRegex, `VAPID_PRIVATE_KEY="${privateKey}"`);
    } else if (!filePath.includes('.env') || filePath.includes('backend')) {
      // Don't add private key to frontend env
      if (!content.includes('VAPID_PRIVATE_KEY')) {
         content += `VAPID_PRIVATE_KEY="${privateKey}"\n`;
      }
    }

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  };

  updateEnv(envPath, vapidKeys.publicKey, vapidKeys.privateKey);
  updateEnv(rootEnvPath, vapidKeys.publicKey, null);

  console.log('SUCCESS: VAPID keys updated in both .env files.');
  console.log('Public Key:', vapidKeys.publicKey);
} catch (err) {
  console.error('FAILED:', err);
  process.exit(1);
}
