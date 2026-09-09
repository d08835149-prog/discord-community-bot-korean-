import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

export const data =
  new SlashCommandBuilder()
    .setName("제작자")
    .setDescription("Dot 봇의 제작자와 프로젝트 정보를 확인합니다.");

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle("🤖 Dot")
    .setDescription(
      "**A Discord Community Bot**\n" +
      "Games · Community · EP Economy\n\n" +
      "✨ **Made by Ditto**"
    )
    .addFields(
      {
        name: "👨‍💻 Developer",
        value: "**Ditto**",
        inline: true,
      },
      {
        name: "📦 Version",
        value: "**v1.0.0**",
        inline: true,
      },
      {
        name: "⚡ Powered by",
        value:
          "`Node.js`\n" +
          "`discord.js`\n" +
          "`PostgreSQL`",
        inline: true,
      },
      {
        name: "🎮 Features",
        value:
          "💬 Community Commands\n" +
          "🎲 Mini Games\n" +
          "💰 EP Economy\n" +
          "🏆 Rankings & Achievements\n" +
          "🛒 Titles & Shop",
        inline: false,
      },
      {
        name: "💻 Source Code",
        value:
          "The source code for Dot is available on GitHub.",
        inline: false,
      }
    )
    .setFooter({
      text: "Dot • Made with ❤️ by Ditto",
    })
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel("GitHub Repository")
        .setEmoji("💻")
        .setStyle(ButtonStyle.Link)
        .setURL(
          "https://github.com/d08835149-prog/discord-community-bot-korean-"
        )
    );

  await interaction.reply({
    embeds: [embed],
    components: [row],
  });
}
