import { createClient } from "@libsql/client/http";
import bcrypt from "bcrypt";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Create tables if they don't exist
async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      doc_hash TEXT,
      file_name TEXT,
      result TEXT,
      timestamp TEXT NOT NULL
    )
  `);

  // Seed 4 demo accounts if users table is empty
  const result = await db.execute("SELECT COUNT(*) as count FROM users");
  const userCount = result.rows[0].count;

  if (userCount === 0) {
    const seedUsers = [
      { email: "admin@gov.in", password: "admin123", role: "admin", name: "Government Admin" },
      { email: "user@example.com", password: "user123", role: "user", name: "Demo User" },
      { email: "student@college.edu", password: "student123", role: "student", name: "Demo Student" },
      { email: "hr@company.com", password: "company123", role: "company", name: "Demo Company HR" },
    ];

    for (const u of seedUsers) {
      const hashedPassword = bcrypt.hashSync(u.password, 10);
      await db.execute({
        sql: "INSERT INTO users (email, password, role, name) VALUES (?, ?, ?, ?)",
        args: [u.email, hashedPassword, u.role, u.name],
      });
    }
    console.log("Seeded 4 demo accounts (admin, user, student, company)");
  }
}

await initDb();

export default db;