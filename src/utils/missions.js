import { query } from "../database/db.js";

export function seoulDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function ensureDailyMission(guildId, userId) {
  const today = seoulDate();

  await query(
    `
      INSERT INTO daily_missions (
        guild_id,
        user_id,
        mission_date
      )
      VALUES ($1, $2, $3)

      ON CONFLICT (
        guild_id,
        user_id,
        mission_date
      )
      DO NOTHING
    `,
    [guildId, userId, today]
  );

  // 오늘 이미 출석했다면 미션에도 자동 반영
  await query(
    `
      UPDATE daily_missions
      SET attendance = GREATEST(attendance, 1),
          updated_at = NOW()
      WHERE guild_id = $1
        AND user_id = $2
        AND mission_date = $3
        AND EXISTS (
          SELECT 1
          FROM users
          WHERE guild_id = $1
            AND user_id = $2
            AND last_attendance = $3::date
        )
    `,
    [guildId, userId, today]
  );

  return today;
}

export async function addMissionProgress(
  guildId,
  userId,
  type,
  amount = 1
) {
  if (!process.env.DATABASE_URL) return;

  const allowed = [
    "attendance",
    "quiz_correct",
    "games_played",
  ];

  if (!allowed.includes(type)) {
    throw new Error(`잘못된 미션 타입: ${type}`);
  }

  const today = await ensureDailyMission(guildId, userId);

  await query(
    `
      UPDATE daily_missions
      SET ${type} = ${type} + $1,
          updated_at = NOW()
      WHERE guild_id = $2
        AND user_id = $3
        AND mission_date = $4
    `,
    [amount, guildId, userId, today]
  );
}
