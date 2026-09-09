import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { fortunes } from "../../data/fortunes.js";
import {
  dailyItem,
  deterministicNumber,
  getTodayKey,
} from "../../utils/random.js";

export const data = new SlashCommandBuilder()
  .setName("서버운세")
  .setDescription("오늘 서버 전체의 운세를 확인합니다.");

export async function execute(interaction) {
  const guildId = interaction.guildId ?? "global";
  const today = getTodayKey();

  const fortune = dailyItem(fortunes, `${guildId}-server`);
  const score = deterministicNumber(`${guildId}-${today}`, 1, 100);

  const embed = new EmbedBuilder()
    .setTitle("🏠 오늘의 서버 운세")
    .setDescription(fortune)
    .addFields({
      name: "✨ 오늘의 서버 행운지수",
      value: `**${score}%**`,
    })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
