import 'dotenv/config';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';

// Usage: npm run admin:create -- admin@example.com "Full Name" 'password'
async function main() {
  const [email, fullName, password] = process.argv.slice(2);
  if (!email || !fullName || !password || password.length < 8) {
    console.error('Usage: npm run admin:create -- <email> "<full name>" <password (8+ chars)>');
    process.exit(1);
  }
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 1, onnotice: () => {} });
  const hash = await bcrypt.hash(password, 10);
  const [existing] = await sql`select id from users where lower(email) = ${email.toLowerCase()}`;
  if (existing) {
    await sql`update users set is_super_admin = true where id = ${existing.id}`;
    console.log(`Granted super admin to existing user ${email}`);
  } else {
    await sql`insert into users (email, password_hash, full_name, role, is_super_admin) values (${email.toLowerCase()}, ${hash}, ${fullName}, 'owner', true)`;
    console.log(`Created super admin ${email}`);
  }
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
