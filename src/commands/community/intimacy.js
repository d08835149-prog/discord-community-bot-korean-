import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { deterministicNumber } from "../../utils/random.js";

export const data = new SlashCommandBuilder()
  .setName("친밀도")
  .setDescription("두 사람의 친밀도를 확인합니다.")
  .addUserOption(option =>
    option
      .setName("상대")
      .setDescription("친밀도를 확인할 상대")
      .setRequired(true)
  );

export async function execute(interaction) {
  const target = interaction.options.getUser("상대");

  const ids = [interaction.user.id, target.id].sort().join("-");
  const score = deterministicNumber(`intimacy-${ids}`, 0, 100);

  let icon = "🙂";
  if (score >= 90) icon = "🫶";
  else if (score >= 70) icon = "🥰";
  else if (score >= 50) icon = "😎";
  else if (score >= 30) icon = "😅";
  else icon = "🧊";

  const embed = new EmbedBuilder()
    .setTitle("🤝 친밀도 측정")
    .setDescription(
      `${interaction.user} × ${target}\n\n# ${icon} ${score}%`
    );

  await interaction.reply({ embeds: [embed] });
}
