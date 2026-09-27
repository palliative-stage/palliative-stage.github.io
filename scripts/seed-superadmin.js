/**
 * Same as scripts/create-superadmin.js.
 *
 *   SUPERADMIN_PASSWORD='...' node scripts/seed-superadmin.js
 */

const { main } = require('./create-superadmin');

if (require.main === module) {
  main().catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  });
}
