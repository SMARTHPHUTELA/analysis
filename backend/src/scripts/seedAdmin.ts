import bcrypt              from 'bcrypt';
import { pool }            from '../config/database';
import { config }          from '../config/config';
import dotenv              from 'dotenv';

dotenv.config();

async function seedAdmin() {
  const email    = process.env['ADMIN_EMAIL']    ?? 'admin@example.com';
  const password = process.env['ADMIN_PASSWORD'] ?? 'Admin@123456';
  const name     = process.env['ADMIN_NAME']     ?? 'Super Admin';

  const client = await pool.connect();

  try {
    // Check if admin already exists
    const existing = await client.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (existing.rows.length > 0) {
      console.log(`Admin already exists: ${email}`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await client.query(
      `INSERT INTO users (name, email, password_hash, role, organization_id)
       VALUES ($1, $2, $3, 'admin', NULL)`,
      [name, email, passwordHash]
    );

    console.log('✅ Admin created successfully');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log('   ⚠️  Change this password after first login!');
  } finally {
    client.release();
    await pool.end();
  }
}

seedAdmin().catch((err) => {
  console.error('Failed to seed admin:', err);
  process.exit(1);
});