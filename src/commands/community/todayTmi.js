import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { tmiQuestions } from "../../data/tmiQuestions.js";
import { dailyItem } from "../../utils/random.js";

export const data = new SlashCommandBuilder()
  .setName("오늘의tmi")
  .setDescription("오늘의 TMI 질문을 확인합니다.");

export async function execute(interaction) {
  const question = dailyItem(
    tmiQuestions,
    `${interaction.guildId}-tmi`
  );

  const embed = new EmbedBuilder()
    .setTitle("🤫 오늘의 TMI")
    .setDescription(`**${question}**`)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
