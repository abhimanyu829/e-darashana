const fs = require('fs');
const path = require('path');
const webpush = require('web-push');

const backendEnvPath = path.join(__dirname, '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');

function updateEnvFile(filePath, keysToUpdate) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');

  for (const [key, value] of Object.entries(keysToUpdate)) {
    let found = false;
    for (let i = 0; i < lines.length; i++) {
        // Match key (with or without quotes)
        if (lines[i].startsWith(`${key}=`)) {
            lines[i] = `${key}="${value}"`;
            found = true;
            break;
        }
    }
    if (!found) {
        lines.push(`${key}="${value}"`);
    }
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log(`Updated ${filePath}`);
}

try {
    const keys = webpush.generateVAPIDKeys();
    console.log('Generated new VAPID keys.');

    // Update backend .env
    updateEnvFile(backendEnvPath, {
        VAPID_PUBLIC_KEY: keys.publicKey,
        VAPID_PRIVATE_KEY: keys.privateKey
    });

    // Update root .env
    updateEnvFile(rootEnvPath, {
        VITE_VAPID_PUBLIC_KEY: keys.publicKey
    });

    console.log('--- Success ---');
    console.log('Public Key:', keys.publicKey);
} catch (err) {
    console.error('Error fixing VAPID keys:', err);
}
