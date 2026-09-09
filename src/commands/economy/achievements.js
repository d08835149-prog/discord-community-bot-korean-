import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

import {
  getUser,
  query,
} from "../../database/db.js";

export const data = new SlashCommandBuilder()
  .setName("업적")
  .setDescription("내가 달성한 업적을 확인합니다.")
  .addUserOption(option =>
    option
      .setName("유저")
      .setDescription("확인할 유저")
      .setRequired(false)
  );

export async function execute(interaction) {
  if (!process.env.DATABASE_URL) {
    return interaction.reply({
      content: "❌ 데이터베이스가 연결되지 않았습니다.",
      ephemeral: true,
    });
  }

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
    await getUser(
      interaction.guildId,
      target.id
    );

  const titleResult = await query(
    `
      SELECT COUNT(*) AS count
      FROM user_titles
      WHERE guild_id = $1
        AND user_id = $2
    `,
    [
      interaction.guildId,
      target.id,
    ]
  );

  const titleCount =
    Number(titleResult.rows[0].count);

  const achievements = [
    {
      name: "👋 첫 출석",
      description: "출석체크 1회",
      unlocked:
        user.total_attendance >= 1,
    },
    {
      name: "🔥 꾸준함의 시작",
      description: "연속 출석 3일",
      unlocked:
        user.attendance_streak >= 3,
    },
    {
      name: "📅 출석왕",
      description: "총 출석 30일",
      unlocked:
        user.total_attendance >= 30,
    },
    {
      name: "💰 부자",
      description: "10,000 EP 보유",
      unlocked:
        Number(user.ep) >= 10000,
    },
    {
      name: "👑 EP 재벌",
      description: "50,000 EP 보유",
      unlocked:
        Number(user.ep) >= 50000,
    },
    {
      name: "✌️ 승리의 맛",
      description: "가위바위보 1승",
      unlocked:
        user.rps_wins >= 1,
    },
    {
      name: "🏆 승부의 달인",
      description: "가위바위보 10승",
      unlocked:
        user.rps_wins >= 10,
    },
    {
      name: "🧠 지식인",
      description: "일반 퀴즈 10개 정답",
      unlocked:
        user.quiz_correct >= 10,
    },
    {
      name: "🔤 초성 마스터",
      description: "초성퀴즈 10개 정답",
      unlocked:
        user.chosung_correct >= 10,
    },
    {
      name: "🔢 숫자의 신",
      description: "숫자맞추기 5승",
      unlocked:
        user.number_guess_wins >= 5,
    },
    {
      name: "💸 큰손",
      description: "총 10,000 EP 송금",
      unlocked:
        Number(user.total_sent) >= 10000,
    },
    {
      name: "🏷️ 수집가",
      description: "칭호 3개 보유",
      unlocked:
        titleCount >= 3,
    },
  ];

  const unlocked =
    achievements.filter(
      item => item.unlocked
    ).length;

  const lines =
    achievements.map(item =>
      item.unlocked
        ? `✅ **${item.name}**\n└ ${item.description}`
        : `🔒 **${item.name}**\n└ ${item.description}`
    );

  const embed =
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
      );

  await interaction.reply({
    embeds: [embed],
  });
}
