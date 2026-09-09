import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { randomItem } from "../../utils/random.js";

export const data = new SlashCommandBuilder()
  .setName("랜덤선택")
  .setDescription("여러 선택지 중 하나를 골라줍니다.")
  .addStringOption(option =>
    option
      .setName("선택지")
      .setDescription("쉼표로 구분하세요. 예: 치킨, 피자, 햄버거")
      .setRequired(true)
  );

export async function execute(interaction) {
  const input = interaction.options.getString("선택지");

  const choices = input
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);

  if (choices.length < 2) {
    return interaction.reply({
      content: "❌ 선택지를 최소 2개 입력해주세요.\n예: `치킨, 피자, 햄버거`",
      ephemeral: true,
    });
  }

  const result = randomItem(choices);

  const embed = new EmbedBuilder()
    .setTitle("🎲 랜덤 선택")
    .setDescription(
      `후보: ${choices.join(" / ")}\n\n내 선택은...\n# 👉 ${result}`
    );

  await interaction.reply({ embeds: [embed] });
}
