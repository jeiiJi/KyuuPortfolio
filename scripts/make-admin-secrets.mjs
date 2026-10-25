import readline from 'readline';
import crypto from 'crypto';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const toBase64Url = (buffer) =>
  Buffer.from(buffer).toString('base64').replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

rl.question('Enter your new admin password: ', (password) => {
  rl.question('Confirm your new admin password: ', (confirmPassword) => {
    if (password !== confirmPassword) {
      console.error('Error: Passwords do not match.');
      rl.close();
      process.exit(1);
    }

    const sessionSecret = crypto.randomBytes(32).toString('hex');
    const iterations = 10000;
    const salt = crypto.randomBytes(16);

    crypto.pbkdf2(password, salt, iterations, 32, 'sha256', (err, derivedKey) => {
      if (err) throw err;
      
      const passwordHash = `pbkdf2$${iterations}$${toBase64Url(salt)}${toBase64Url(derivedKey)}`;

      console.log('\n--- Copy these into your environment variables ---');
      console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
      console.log(`SESSION_SECRET=${sessionSecret}`);
      console.log('--------------------------------------------------\n');
      
      rl.close();
    });
  });
});