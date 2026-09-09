import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("밸런스게임")
  .setDescription("두 선택지 중 하나를 골라 투표합니다.")
  .addStringOption(option =>
    option
      .setName("a")
      .setDescription("첫 번째 선택지")
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName("b")
      .setDescription("두 번째 선택지")
      .setRequired(true)
  );

export async function execute(interaction) {
  const a = interaction.options.getString("a");
  const b = interaction.options.getString("b");

  if (a === b) {
    return interaction.reply({
      content: "❌ 서로 다른 선택지를 입력해주세요.",
      ephemeral: true,
    });
  }

  const votes = new Map();

  const makeEmbed = () => {
    let aVotes = 0;
    let bVotes = 0;

    for (const vote of votes.values()) {
      if (vote === "A") aVotes++;
      if (vote === "B") bVotes++;
    }

    const total = aVotes + bVotes;

    const aPercent = total === 0 ? 0 : Math.round((aVotes / total) * 100);
    const bPercent = total === 0 ? 0 : 100 - aPercent;

    return new EmbedBuilder()
      .setTitle("⚖️ 밸런스 게임")
      .setDescription(
        `🅰️ **${a}**\n${aVotes}표 · ${aPercent}%\n\n` +
        `🅱️ **${b}**\n${bVotes}표 · ${bPercent}%\n\n` +
        `총 ${total}표`
      )
      .setFooter({ text: "버튼을 눌러 투표하세요!" });
  };

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("balance_a")
      .setLabel(`A. ${a}`.slice(0, 80))
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("balance_b")
      .setLabel(`B. ${b}`.slice(0, 80))
      .setStyle(ButtonStyle.Success)
  );

  const response = await interaction.reply({
    embeds: [makeEmbed()],
    components: [row],
    fetchReply: true,
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 60000,
  });

  collector.on("collect", async buttonInteraction => {
    const choice =
      buttonInteraction.customId === "balance_a" ? "A" : "B";

    votes.set(buttonInteraction.user.id, choice);

    await buttonInteraction.update({
      embeds: [makeEmbed()],
      components: [row],
    });
  });

  collector.on("end", async () => {
    const disabledRow = new ActionRowBuilder().addComponents(
      row.components.map(button =>
        ButtonBuilder.from(button).setDisabled(true)
      )
    );

    await interaction.editReply({
      embeds: [makeEmbed()],
      components: [disabledRow],
    }).catch(() => {});
  });
}
