import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

import { query } from "../../database/db.js";

export const data = new SlashCommandBuilder()
  .setName("랭킹")
  .setDescription("서버 EP 랭킹 TOP 10을 확인합니다.");

export async function execute(interaction) {
  if (!process.env.DATABASE_URL) {
    return interaction.reply({
      content: "❌ 데이터베이스가 아직 연결되지 않았습니다.",
      ephemeral: true,
    });
  }

  const result = await query(
    `
      SELECT user_id, ep
      FROM users
      WHERE guild_id = $1
      ORDER BY ep DESC
      LIMIT 10
    `,
    [interaction.guildId]
  );

  if (result.rows.length === 0) {
    return interaction.reply(
      "아직 랭킹에 등록된 유저가 없습니다!"
    );
  }

  const medals = [
    "🥇",
    "🥈",
    "🥉",
  ];

  const lines = result.rows.map((row, index) => {
    const icon =
      medals[index] ?? `**${index + 1}.**`;

    return (
      `${icon} <@${row.user_id}> — ` +
      `**${Number(row.ep).toLocaleString()} EP**`
    );
  });

  const embed = new EmbedBuilder()
    .setTitle("🏆 EP 랭킹 TOP 10")
    .setDescription(lines.join("\n"))
    .setFooter({
      text: `${interaction.guild.name} 서버 랭킹`,
    });

  await interaction.reply({ embeds: [embed] });
}
