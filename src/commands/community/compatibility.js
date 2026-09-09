import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { deterministicNumber } from "../../utils/random.js";

export const data = new SlashCommandBuilder()
  .setName("궁합")
  .setDescription("다른 유저와의 궁합을 확인합니다.")
  .addUserOption(option =>
    option
      .setName("상대")
      .setDescription("궁합을 확인할 유저")
      .setRequired(true)
  );

export async function execute(interaction) {
  const target = interaction.options.getUser("상대");

  if (target.id === interaction.user.id) {
    return interaction.reply({
      content: "ㅋㅋ 자기 자신과의 궁합은 **100%**지!",
      ephemeral: true,
    });
  }

  const ids = [interaction.user.id, target.id].sort().join("-");
  const score = deterministicNumber(`compatibility-${ids}`, 0, 100);

  let message = "😐 그냥 무난한 사이!";
  if (score >= 90) message = "💘 이건 운명인데?";
  else if (score >= 75) message = "😍 상당히 잘 맞는 조합!";
  else if (score >= 60) message = "😊 꽤 괜찮은 궁합!";
  else if (score >= 40) message = "🙂 노력하면 잘 맞을지도?";
  else if (score >= 20) message = "😅 조금 힘든 조합...";
  else message = "💀 서로 도망쳐!!";

  const embed = new EmbedBuilder()
    .setTitle("💞 궁합 테스트")
    .setDescription(
      `${interaction.user} ❤️ ${target}\n\n# ${score}%\n${message}`
    );

  await interaction.reply({ embeds: [embed] });
}
