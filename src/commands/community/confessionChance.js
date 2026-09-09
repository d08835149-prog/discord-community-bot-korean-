import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { deterministicNumber, getTodayKey } from "../../utils/random.js";

export const data = new SlashCommandBuilder()
  .setName("고백확률")
  .setDescription("오늘의 고백 성공 확률을 확인합니다.")
  .addUserOption(option =>
    option
      .setName("상대")
      .setDescription("고백할 상대")
      .setRequired(true)
  );

export async function execute(interaction) {
  const target = interaction.options.getUser("상대");

  const score = deterministicNumber(
    `${interaction.user.id}-${target.id}-${getTodayKey()}-confession`,
    0,
    100
  );

  const embed = new EmbedBuilder()
    .setTitle("💌 오늘의 고백 성공 확률")
    .setDescription(
      `${interaction.user} ➡️ ${target}\n\n# 💖 ${score}%`
    )
    .setFooter({ text: "재미로만 봐주세요 😂" });

  await interaction.reply({ embeds: [embed] });
}
