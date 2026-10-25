import readline from 'readline';
import crypto from 'crypto';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter your new admin password: ', (password) => {
  rl.question('Confirm your new admin password: ', (confirmPassword) => {
    if (password !== confirmPassword) {
      console.error('Error: Passwords do not match.');
      rl.close();
      process.exit(1);
    }

    // Generate a secure session secret
    const sessionSecret = crypto.randomBytes(32).toString('hex');

    // Hash the password using scrypt (built-in Node crypto)
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) throw err;
      const passwordHash = `${salt}:${derivedKey.toString('hex')}`;

      console.log('\n--- Copy these into your environment variables ---');
      console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
      console.log(`SESSION_SECRET=${sessionSecret}`);
      console.log('--------------------------------------------------\n');
      
      rl.close();
    });
  });
});