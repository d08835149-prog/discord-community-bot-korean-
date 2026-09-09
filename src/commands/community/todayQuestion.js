import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { questions } from "../../data/questions.js";
import { dailyItem } from "../../utils/random.js";

export const data = new SlashCommandBuilder()
  .setName("오늘의질문")
  .setDescription("오늘의 랜덤 질문을 확인합니다.");

export async function execute(interaction) {
  const question = dailyItem(questions, interaction.guildId ?? "global");

  const embed = new EmbedBuilder()
    .setTitle("💬 오늘의 질문")
    .setDescription(`**${question}**`)
    .setFooter({ text: "오늘 하루 서버에서 같은 질문이 나옵니다." })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
