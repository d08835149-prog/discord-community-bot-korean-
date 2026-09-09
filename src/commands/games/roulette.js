import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

import { randomItem } from "../../utils/random.js";

export const data = new SlashCommandBuilder()
  .setName("룰렛")
  .setDescription("여러 선택지 중 하나를 룰렛처럼 뽑습니다.")
  .addStringOption(option =>
    option
      .setName("선택지")
      .setDescription("쉼표로 구분하세요. 예: 철수, 영희, 민수")
      .setRequired(true)
  );

export async function execute(interaction) {
  const input = interaction.options.getString("선택지");

  const choices = input
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);

  if (choices.length < 2) {
    return interaction.reply({
      content: "❌ 선택지를 최소 2개 입력해주세요.",
      ephemeral: true,
    });
  }

  if (choices.length > 20) {
    return interaction.reply({
      content: "❌ 선택지는 최대 20개까지 가능합니다.",
      ephemeral: true,
    });
  }

  await interaction.reply("🎡 룰렛 돌리는 중...");

  await new Promise(resolve => setTimeout(resolve, 1200));

  const result = randomItem(choices);

  const embed = new EmbedBuilder()
    .setTitle("🎡 룰렛 결과")
    .setDescription(
      `후보: ${choices.join(" / ")}\n\n# 🎯 ${result}`
    )
    .setFooter({ text: "룰렛이 선택했습니다!" });

  await interaction.editReply({
    content: "",
    embeds: [embed],
  });
}
