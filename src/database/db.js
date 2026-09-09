import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn("⚠️ DATABASE_URL이 아직 설정되지 않았습니다.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : undefined,
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function initDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log("⚠️ DB 초기화 건너뜀: DATABASE_URL 없음");
    return;
  }

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,

      ep BIGINT NOT NULL DEFAULT 0,

      last_attendance DATE,
      attendance_streak INTEGER NOT NULL DEFAULT 0,
      total_attendance INTEGER NOT NULL DEFAULT 0,

      rps_wins INTEGER NOT NULL DEFAULT 0,
      rps_losses INTEGER NOT NULL DEFAULT 0,

      quiz_correct INTEGER NOT NULL DEFAULT 0,
      chosung_correct INTEGER NOT NULL DEFAULT 0,
      number_guess_wins INTEGER NOT NULL DEFAULT 0,

      total_sent BIGINT NOT NULL DEFAULT 0,

      last_jackpot DATE,

      title TEXT DEFAULT NULL,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      PRIMARY KEY (guild_id, user_id)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS jackpot (
      guild_id TEXT PRIMARY KEY,
      pool BIGINT NOT NULL DEFAULT 5000,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS user_titles (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      PRIMARY KEY (guild_id, user_id, title)
    );
  `);

    await query(`
    CREATE TABLE IF NOT EXISTS user_items (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      item TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      PRIMARY KEY (guild_id, user_id, item)
    );
  `);

  console.log("✅ PostgreSQL 테이블 준비 완료");
}

export async function ensureUser(guildId, userId) {
  await query(
    `
      INSERT INTO users (guild_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (guild_id, user_id)
      DO NOTHING
    `,
    [guildId, userId]
  );
}

export async function getUser(guildId, userId) {
  await ensureUser(guildId, userId);

  const result = await query(
    `
      SELECT *
      FROM users
      WHERE guild_id = $1
        AND user_id = $2
    `,
    [guildId, userId]
  );

  return result.rows[0];
}
