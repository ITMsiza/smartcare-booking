// scripts/set-admin.js
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// IMPORTANT:
// 1. Download your service account key JSON file from the Firebase console.
//    (Project settings > Service accounts > Generate new private key)
// 2. Save it in the root of your project with the filename 'serviceAccountKey.json'.
// 3. Make sure to add 'serviceAccountKey.json' to your .gitignore file
//    to prevent it from being checked into version control.
const serviceAccount = require('../serviceAccountKey.json');

// Initialize the Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccount),
});

const auth = getAuth();
const email = process.argv[2]; // Get email from command-line argument

if (!email) {
  console.error('Error: Please provide an email address as a command-line argument.');
  console.log('Usage: node scripts/set-admin.js <user-email>');
  process.exit(1);
}

(async () => {
  try {
    // 1. Get the user by email
    const user = await auth.getUserByEmail(email);

    // 2. Set the custom claim 'admin' to true
    await auth.setCustomUserClaims(user.uid, { admin: true });

    console.log(`Success! User with email "${email}" has been made an admin.`);
    console.log('You can verify their custom claims in the Firebase console or by checking their ID token.');

  } catch (error) {
    console.error(`Error setting custom claim for user with email "${email}":`, error.message);
    if (error.code === 'auth/user-not-found') {
      console.error(`Could not find a user with the email address: ${email}`);
    }
  }
})();
