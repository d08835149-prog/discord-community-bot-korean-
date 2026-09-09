import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { randomItem } from "../../utils/random.js";

export const data = new SlashCommandBuilder()
  .setName("동전던지기")
  .setDescription("동전을 던집니다.");

export async function execute(interaction) {
  const result = randomItem(["앞면", "뒷면"]);
  const icon = result === "앞면" ? "🟡" : "⚪";

  const embed = new EmbedBuilder()
    .setTitle("🪙 동전 던지기")
    .setDescription(`동전이 빙글빙글...\n\n# ${icon} ${result}!`);

  await interaction.reply({ embeds: [embed] });
}
