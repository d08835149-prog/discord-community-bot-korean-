import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";

import { worldCupPresets } from "../../data/worldCupOptions.js";

function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export const data = new SlashCommandBuilder()
  .setName("이상형월드컵")
  .setDescription("토너먼트 방식으로 최종 선택을 정합니다.")
  .addStringOption(option =>
    option
      .setName("주제")
      .setDescription("월드컵 주제를 선택하세요.")
      .setRequired(true)
      .addChoices(
        { name: "🍗 음식", value: "음식" },
        { name: "✈️ 여행", value: "여행" },
        { name: "🐶 동물", value: "동물" },
        { name: "🍫 간식", value: "간식" }
      )
  );

export async function execute(interaction) {
  const theme = interaction.options.getString("주제");
  let contenders = shuffle(worldCupPresets[theme]);

  await interaction.deferReply();

  while (contenders.length > 1) {
    const winners = [];

    for (let i = 0; i < contenders.length; i += 2) {
      const a = contenders[i];
      const b = contenders[i + 1];

      if (!b) {
        winners.push(a);
        continue;
      }

      const roundName =
        contenders.length === 8
          ? "8강"
          : contenders.length === 4
            ? "4강"
            : contenders.length === 2
              ? "결승"
              : `${contenders.length}강`;

      const embed = new EmbedBuilder()
        .setTitle(`🏆 ${theme} 이상형 월드컵 · ${roundName}`)
        .setDescription(
          `둘 중 하나를 선택하세요!\n\n` +
          `🅰️ **${a}**\n\nVS\n\n🅱️ **${b}**`
        );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("worldcup_a")
          .setLabel(`A. ${a}`.slice(0, 80))
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("worldcup_b")
          .setLabel(`B. ${b}`.slice(0, 80))
          .setStyle(ButtonStyle.Success)
      );

      const message = await interaction.editReply({
        embeds: [embed],
        components: [row],
      });

      try {
        const choice = await message.awaitMessageComponent({
          componentType: ComponentType.Button,
          filter: button =>
            button.user.id === interaction.user.id,
          time: 30000,
        });

        const winner =
          choice.customId === "worldcup_a" ? a : b;

        winners.push(winner);

        await choice.update({
          embeds: [
            EmbedBuilder.from(embed)
              .setDescription(
                `✅ 선택: **${winner}**\n\n다음 대결로 넘어갑니다...`
              )
          ],
          components: [],
        });

        await new Promise(resolve =>
          setTimeout(resolve, 700)
        );
      } catch {
        await interaction.editReply({
          content: "⏰ 시간이 초과되어 이상형 월드컵이 종료됐습니다.",
          embeds: [],
          components: [],
        });

        return;
      }
    }

    contenders = winners;
  }

  const champion = contenders[0];

  const finalEmbed = new EmbedBuilder()
    .setTitle("👑 이상형 월드컵 우승!")
    .setDescription(
      `${interaction.user}님의 **${theme} 이상형 월드컵** 최종 선택은...\n\n` +
      `# 🏆 ${champion}`
    )
    .setTimestamp();

  await interaction.editReply({
    content: "",
    embeds: [finalEmbed],
    components: [],
  });
}
