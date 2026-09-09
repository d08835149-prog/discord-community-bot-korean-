import { addMissionProgress } from "../../utils/missions.js";\nimport {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

import {
  ensureUser,
  query,
} from "../../database/db.js";

import {
  addMissionProgress,
} from "../../utils/missions.js";

function torontoDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function yesterdayToronto() {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const todayString = formatter.format(now);

  const [year, month, day] = todayString
    .split("-")
    .map(Number);

  const yesterday = new Date(
    Date.UTC(year, month - 1, day - 1)
  );

  return yesterday.toISOString().slice(0, 10);
}

export const data = new SlashCommandBuilder()
  .setName("출석체크")
  .setDescription("하루 한 번 출석하고 EP를 받습니다.");

export async function execute(interaction) {
  if (!process.env.DATABASE_URL) {
    return interaction.reply({
      content: "❌ 데이터베이스가 아직 연결되지 않았습니다.",
      ephemeral: true,
    });
  }

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  await ensureUser(guildId, userId);

  const result = await query(
    `
      SELECT ep,
             last_attendance,
             attendance_streak,
             total_attendance
      FROM users
      WHERE guild_id = $1
        AND user_id = $2
    `,
    [guildId, userId]
  );

  const user = result.rows[0];
  const today = torontoDate();

  const lastAttendance = user.last_attendance
    ? new Date(user.last_attendance)
        .toISOString()
        .slice(0, 10)
    : null;

  if (lastAttendance === today) {
    return interaction.reply({
      content:
        `✅ 오늘은 이미 출석했어요!\n` +
        `🔥 현재 연속 출석: **${user.attendance_streak}일**`,
      ephemeral: true,
    });
  }

  let streak = 1;

  if (lastAttendance === yesterdayToronto()) {
    streak = user.attendance_streak + 1;
  }

  const baseReward = 500;
  const streakBonus = Math.min(
    Math.max(streak - 1, 0) * 50,
    500
  );

  const reward = baseReward + streakBonus;

  const update = await query(
    `
      UPDATE users
      SET ep = ep + $1,
          last_attendance = $2,
          attendance_streak = $3,
          total_attendance = total_attendance + 1,
          updated_at = NOW()
      WHERE guild_id = $4
        AND user_id = $5
      RETURNING ep, total_attendance
    `,
    [
      reward,
      today,
      streak,
      guildId,
      userId,
    ]
  );

  const updated = update.rows[0];

  await addMissionProgress(
  guildId,
  userId,
  "attendance"
  );

  const embed = new EmbedBuilder()
    .setTitle("✅ 출석 완료!")
    .setDescription(
      `${interaction.user}님 출석 완료!\n\n` +
      `💰 **+${reward.toLocaleString()} EP**\n` +
      `🔥 연속 출석: **${streak}일**\n` +
      `📅 총 출석: **${updated.total_attendance}일**\n\n` +
      `현재 잔액: **${Number(updated.ep).toLocaleString()} EP**`
    )
    .setFooter({
      text:
        streakBonus > 0
          ? `연속 출석 보너스 +${streakBonus} EP`
          : "매일 출석해서 연속 보너스를 받아보세요!",
    });

  await interaction.reply({ embeds: [embed] });
}
