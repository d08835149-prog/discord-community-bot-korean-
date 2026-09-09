import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { fortunes } from "../../data/fortunes.js";
import {
  dailyItem,
  deterministicNumber,
  getTodayKey,
} from "../../utils/random.js";

export const data = new SlashCommandBuilder()
  .setName("오늘의운세")
  .setDescription("나의 오늘 운세를 확인합니다.");

export async function execute(interaction) {
  const key = `${interaction.user.id}-${getTodayKey()}`;
  const fortune = dailyItem(fortunes, interaction.user.id);

  const luck = deterministicNumber(`${key}-luck`, 1, 100);
  const money = deterministicNumber(`${key}-money`, 1, 100);
  const love = deterministicNumber(`${key}-love`, 1, 100);

  const embed = new EmbedBuilder()
    .setTitle(`🔮 ${interaction.user.displayName}님의 오늘의 운세`)
    .setDescription(fortune)
    .addFields(
      { name: "🍀 행운", value: `${luck}%`, inline: true },
      { name: "💰 금전운", value: `${money}%`, inline: true },
      { name: "💖 애정운", value: `${love}%`, inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
