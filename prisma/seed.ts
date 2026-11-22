import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

/** Optional: creates the first admin from env vars. Without them, use the /setup page. The system starts with no data. */
async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@sunbula.qa').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password === 'change-me') {
    console.log('ADMIN_PASSWORD not set: skipping. Create the admin from /setup on first visit.');
    return;
  }
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} already exists.`);
    return;
  }
  await db.user.create({
    data: { name: 'مدير النظام', email, role: 'ADMIN', passwordHash: await bcrypt.hash(password, 10) },
  });
  console.log(`Created admin ${email}`);
}

main().finally(() => db.$disconnect());
