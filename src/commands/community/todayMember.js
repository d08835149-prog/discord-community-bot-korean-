import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getTodayKey, hashString } from "../../utils/random.js";

export const data = new SlashCommandBuilder()
  .setName("오늘의멤버")
  .setDescription("오늘의 서버 멤버를 한 명 선정합니다.");

export async function execute(interaction) {
  await interaction.guild.members.fetch();

  const members = interaction.guild.members.cache.filter(
    member => !member.user.bot
  );

  if (members.size === 0) {
    return interaction.reply("❌ 선택할 수 있는 멤버가 없습니다.");
  }

  const list = [...members.values()];
  const index =
    hashString(`${interaction.guildId}-${getTodayKey()}-member`) %
    list.length;

  const member = list[index];

  const embed = new EmbedBuilder()
    .setTitle("🌟 오늘의 멤버")
    .setDescription(`오늘의 멤버는 바로...\n\n🎉 ${member} 🎉`)
    .setThumbnail(member.user.displayAvatarURL())
    .setFooter({ text: "오늘 하루 동안 같은 멤버가 선정됩니다." });

  await interaction.reply({ embeds: [embed] });
}
