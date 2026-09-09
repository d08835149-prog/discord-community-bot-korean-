import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

import {
  pool,
  getUser,
  query,
  ensureUser,
} from "../../database/db.js";

function buildAchievements(user, titleCount) {
  return [
    {
      id: "first_attendance",
      name: "👋 첫 출석",
      description: "출석체크 1회",
      reward: 300,
      unlocked: user.total_attendance >= 1,
    },
    {
      id: "streak_3",
      name: "🔥 꾸준함의 시작",
      description: "연속 출석 3일",
      reward: 500,
      unlocked: user.attendance_streak >= 3,
    },
    {
      id: "attendance_30",
      name: "📅 출석왕",
      description: "총 출석 30일",
      reward: 3000,
      unlocked: user.total_attendance >= 30,
    },
    {
      id: "ep_10000",
      name: "💰 부자",
      description: "10,000 EP 보유",
      reward: 1000,
      unlocked: Number(user.ep) >= 10000,
    },
    {
      id: "ep_50000",
      name: "👑 EP 재벌",
      description: "50,000 EP 보유",
      reward: 5000,
      unlocked: Number(user.ep) >= 50000,
    },
    {
      id: "rps_1",
      name: "✌️ 승리의 맛",
      description: "가위바위보 1승",
      reward: 300,
      unlocked: user.rps_wins >= 1,
    },
    {
      id: "rps_10",
      name: "🏆 승부의 달인",
      description: "가위바위보 10승",
      reward: 2000,
      unlocked: user.rps_wins >= 10,
    },
    {
      id: "quiz_10",
      name: "🧠 지식인",
      description: "일반 퀴즈 10개 정답",
      reward: 1500,
      unlocked: user.quiz_correct >= 10,
    },
    {
      id: "chosung_10",
      name: "🔤 초성 마스터",
      description: "초성퀴즈 10개 정답",
      reward: 1500,
      unlocked: user.chosung_correct >= 10,
    },
    {
      id: "number_5",
      name: "🔢 숫자의 신",
      description: "숫자맞추기 5승",
      reward: 1500,
      unlocked: user.number_guess_wins >= 5,
    },
    {
      id: "sent_10000",
      name: "💸 큰손",
      description: "총 10,000 EP 송금",
      reward: 2000,
      unlocked: Number(user.total_sent) >= 10000,
    },
    {
      id: "titles_3",
      name: "🏷️ 수집가",
      description: "칭호 3개 보유",
      reward: 2000,
      unlocked: titleCount >= 3,
    },
  ];
}

export const data =
  new SlashCommandBuilder()
    .setName("업적")
    .setDescription("업적을 확인하고 보상을 받습니다.")

    .addSubcommand(subcommand =>
      subcommand
        .setName("보기")
        .setDescription("내 업적을 확인합니다.")
        .addUserOption(option =>
          option
            .setName("유저")
            .setDescription("확인할 유저")
            .setRequired(false)
        )
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName("받기")
        .setDescription("달성한 업적 보상을 받습니다.")
    );

export async function execute(interaction) {
  if (!process.env.DATABASE_URL) {
    return interaction.reply({
      content: "❌ 데이터베이스가 연결되지 않았습니다.",
      ephemeral: true,
    });
  }

  const subcommand =
    interaction.options.getSubcommand();

  const guildId = interaction.guildId;

  if (subcommand === "보기") {
    const target =
      interaction.options.getUser("유저") ??
      interaction.user;

    if (target.bot) {
      return interaction.reply({
        content: "🤖 봇의 업적은 확인할 수 없습니다.",
        ephemeral: true,
      });
    }

    const user =
      await getUser(guildId, target.id);

    const titleResult = await query(
      `
        SELECT COUNT(*) AS count
        FROM user_titles
        WHERE guild_id = $1
          AND user_id = $2
      `,
      [guildId, target.id]
    );

    const titleCount =
      Number(titleResult.rows[0].count);

    const achievements =
      buildAchievements(user, titleCount);

    const claimsResult = await query(
      `
        SELECT achievement_id
        FROM achievement_claims
        WHERE guild_id = $1
          AND user_id = $2
      `,
      [guildId, target.id]
    );

    const claimed =
      new Set(
        claimsResult.rows.map(
          row => row.achievement_id
        )
      );

    const unlocked =
      achievements.filter(
        item => item.unlocked
      ).length;

    const lines =
      achievements.map(item => {
        let icon = "🔒";

        if (item.unlocked) icon = "✅";
        if (claimed.has(item.id)) icon = "🎁";

        return (
          `${icon} **${item.name}**\n` +
          `└ ${item.description}\n` +
          `└ 보상: ${item.reward.toLocaleString()} EP` +
          (
            claimed.has(item.id)
              ? " · 수령 완료"
              : ""
          )
        );
      });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(
            `🏆 ${target.displayName}님의 업적`
          )
          .setDescription(
            `${lines.join("\n\n")}\n\n` +
            `**달성도: ${unlocked}/${achievements.length}**`
          )
          .setThumbnail(
            target.displayAvatarURL()
          )
          .setFooter({
            text: "✅ 달성 · 🎁 보상 수령 완료",
          }),
      ],
    });
  }

  const userId = interaction.user.id;

  await ensureUser(guildId, userId);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `
        SELECT *
        FROM users
        WHERE guild_id = $1
          AND user_id = $2
        FOR UPDATE
      `,
      [guildId, userId]
    );

    const user = userResult.rows[0];

    const titleResult = await client.query(
      `
        SELECT COUNT(*) AS count
        FROM user_titles
        WHERE guild_id = $1
          AND user_id = $2
      `,
      [guildId, userId]
    );

    const titleCount =
      Number(titleResult.rows[0].count);

    const achievements =
      buildAchievements(user, titleCount);

    const claimsResult = await client.query(
      `
        SELECT achievement_id
        FROM achievement_claims
        WHERE guild_id = $1
          AND user_id = $2
      `,
      [guildId, userId]
    );

    const claimed =
      new Set(
        claimsResult.rows.map(
          row => row.achievement_id
        )
      );

    const available =
      achievements.filter(
        item =>
          item.unlocked &&
          !claimed.has(item.id)
      );

    if (available.length === 0) {
      await client.query("ROLLBACK");

      return interaction.reply({
        content:
          "🏆 지금 받을 수 있는 업적 보상이 없습니다.",
        ephemeral: true,
      });
    }

    const reward =
      available.reduce(
        (sum, item) =>
          sum + item.reward,
        0
      );

    for (const item of available) {
      await client.query(
        `
          INSERT INTO achievement_claims (
            guild_id,
            user_id,
            achievement_id
          )
          VALUES ($1, $2, $3)

          ON CONFLICT (
            guild_id,
            user_id,
            achievement_id
          )
          DO NOTHING
        `,
        [guildId, userId, item.id]
      );
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

    const balance =
      Number(balanceResult.rows[0].ep);

    await client.query("COMMIT");

    const rewardLines =
      available.map(
        item =>
          `${item.name} +${item.reward.toLocaleString()} EP`
      );

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🏆 업적 보상!")
          .setDescription(
            `${rewardLines.join("\n")}\n\n` +
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
