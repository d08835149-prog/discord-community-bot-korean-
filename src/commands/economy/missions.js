import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

import {
  pool,
  ensureUser,
} from "../../database/db.js";

import {
  ensureDailyMission,
  torontoDate,
} from "../../utils/missions.js";

const MISSIONS = {
  attendance: {
    name: "✅ 출석하기",
    target: 1,
    reward: 300,
    column: "attendance",
    claimed: "attendance_claimed",
  },

  quiz: {
    name: "🧠 퀴즈 정답 맞히기",
    target: 3,
    reward: 500,
    column: "quiz_correct",
    claimed: "quiz_claimed",
  },

  games: {
    name: "🎮 게임 플레이",
    target: 5,
    reward: 700,
    column: "games_played",
    claimed: "games_claimed",
  },
};

const ALL_REWARD = 1000;

export const data =
  new SlashCommandBuilder()
    .setName("미션")
    .setDescription("오늘의 일일 미션을 확인합니다.")

    .addSubcommand(subcommand =>
      subcommand
        .setName("보기")
        .setDescription("오늘의 미션 진행도를 확인합니다.")
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName("받기")
        .setDescription("완료한 미션 보상을 받습니다.")
    );

export async function execute(interaction) {
  if (!process.env.DATABASE_URL) {
    return interaction.reply({
      content: "❌ 데이터베이스가 연결되지 않았습니다.",
      ephemeral: true,
    });
  }

  const guildId = interaction.guildId;
  const userId = interaction.user.id;
  const subcommand = interaction.options.getSubcommand();

  await ensureUser(guildId, userId);
  await ensureDailyMission(guildId, userId);

  const today = torontoDate();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
        SELECT *
        FROM daily_missions
        WHERE guild_id = $1
          AND user_id = $2
          AND mission_date = $3
        FOR UPDATE
      `,
      [guildId, userId, today]
    );

    const mission = result.rows[0];

    if (subcommand === "보기") {
      await client.query("COMMIT");

      const lines = Object.values(MISSIONS).map(item => {
        const progress = Math.min(
          Number(mission[item.column]),
          item.target
        );

        const completed = progress >= item.target;
        const claimed = mission[item.claimed];

        let icon = "⬜";
        if (completed) icon = "✅";
        if (claimed) icon = "🎁";

        return (
          `${icon} **${item.name}**\n` +
          `└ ${progress}/${item.target} · ` +
          `${item.reward.toLocaleString()} EP` +
          (claimed ? " · 수령 완료" : "")
        );
      });

      const allComplete =
        Object.values(MISSIONS).every(
          item => Number(mission[item.column]) >= item.target
        );

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("📋 오늘의 미션")
            .setDescription(
              `${lines.join("\n\n")}\n\n` +
              `━━━━━━━━━━━━━━━━━━\n\n` +
              `${mission.all_claimed ? "🎁" : allComplete ? "✅" : "🔒"} ` +
              `**전체 완료 보너스**\n` +
              `└ ${ALL_REWARD.toLocaleString()} EP` +
              (mission.all_claimed ? " · 수령 완료" : "")
            )
            .setFooter({
              text: "매일 토론토 날짜 기준 갱신",
            }),
        ],
      });
    }

    let reward = 0;
    const claimedNames = [];

    for (const item of Object.values(MISSIONS)) {
      const completed =
        Number(mission[item.column]) >= item.target;

      if (completed && !mission[item.claimed]) {
        reward += item.reward;

        claimedNames.push(
          `${item.name} +${item.reward.toLocaleString()} EP`
        );

        await client.query(
          `
            UPDATE daily_missions
            SET ${item.claimed} = TRUE,
                updated_at = NOW()
            WHERE guild_id = $1
              AND user_id = $2
              AND mission_date = $3
          `,
          [guildId, userId, today]
        );

        mission[item.claimed] = true;
      }
    }

    const allComplete =
      Object.values(MISSIONS).every(
        item => Number(mission[item.column]) >= item.target
      );

    if (allComplete && !mission.all_claimed) {
      reward += ALL_REWARD;

      claimedNames.push(
        `🏆 전체 완료 보너스 +${ALL_REWARD.toLocaleString()} EP`
      );

      await client.query(
        `
          UPDATE daily_missions
          SET all_claimed = TRUE,
              updated_at = NOW()
          WHERE guild_id = $1
            AND user_id = $2
            AND mission_date = $3
        `,
        [guildId, userId, today]
      );
    }

    if (reward === 0) {
      await client.query("ROLLBACK");

      return interaction.reply({
        content: "📋 지금 받을 수 있는 미션 보상이 없습니다.",
        ephemeral: true,
      });
    }

    const balanceResult = await client.query(
      `
        UPDATE users
        SET ep = ep + $1,
            updated_at = NOW()
        WHERE guild_id = $2
          AND user_id = $3
        RETURNING ep
      `,
      [reward, guildId, userId]
    );

    const balance = Number(balanceResult.rows[0].ep);

    await client.query("COMMIT");

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎁 미션 보상!")
          .setDescription(
            `${claimedNames.join("\n")}\n\n` +
            `💰 총 **+${reward.toLocaleString()} EP**\n\n` +
            `현재 잔액: **${balance.toLocaleString()} EP**`
          ),
      ],
    });

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
}
