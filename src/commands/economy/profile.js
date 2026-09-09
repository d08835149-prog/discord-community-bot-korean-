import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

import { getUser } from "../../database/db.js";

export const data = new SlashCommandBuilder()
  .setName("프로필")
  .setDescription("EP와 활동 기록을 확인합니다.")
  .addUserOption(option =>
    option
      .setName("유저")
      .setDescription("확인할 유저")
      .setRequired(false)
  );

export async function execute(interaction) {
  if (!process.env.DATABASE_URL) {
    return interaction.reply({
      content: "❌ 데이터베이스가 아직 연결되지 않았습니다.",
      ephemeral: true,
    });
  }

  const target =
    interaction.options.getUser("유저") ??
    interaction.user;

  if (target.bot) {
    return interaction.reply({
      content: "🤖 봇에게는 EP 프로필이 없어요.",
      ephemeral: true,
    });
  }

  const user = await getUser(
    interaction.guildId,
    target.id
  );

  const title = user.title
    ? `「${user.title}」`
    : "없음";

  const embed = new EmbedBuilder()
    .setTitle(`👤 ${target.displayName}님의 프로필`)
    .setThumbnail(target.displayAvatarURL())
    .addFields(
      {
        name: "💰 EP",
        value: `**${Number(user.ep).toLocaleString()} EP**`,
        inline: true,
      },
      {
        name: "🔥 연속 출석",
        value: `**${user.attendance_streak}일**`,
        inline: true,
      },
      {
        name: "📅 총 출석",
        value: `**${user.total_attendance}일**`,
        inline: true,
      },
      {
        name: "🎮 가위바위보",
        value:
          `${user.rps_wins}승 / ` +
          `${user.rps_losses}패`,
        inline: true,
      },
      {
        name: "🧠 퀴즈 정답",
        value: `**${user.quiz_correct}개**`,
        inline: true,
      },
      {
        name: "🔤 초성퀴즈",
        value: `**${user.chosung_correct}개**`,
        inline: true,
      },
      {
        name: "🔢 숫자맞추기",
        value: `**${user.number_guess_wins}승**`,
        inline: true,
      },
      {
        name: "📤 총 송금",
        value:
          `**${Number(user.total_sent).toLocaleString()} EP**`,
        inline: true,
      },
      {
        name: "🏷️ 칭호",
        value: title,
        inline: true,
      }
    )
    .setFooter({
      text: "업적과 상점은 다음 단계에서 추가됩니다.",
    });

  await interaction.reply({ embeds: [embed] });
}
