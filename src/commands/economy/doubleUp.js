import { addMissionProgress } from "../../utils/missions.js";
import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

import {
  ensureUser,
  query,
} from "../../database/db.js";

export const data = new SlashCommandBuilder()
  .setName("더블업")
  .setDescription("EP를 걸고 50% 확률 게임에 도전합니다.")
  .addIntegerOption(option =>
    option
      .setName("금액")
      .setDescription("걸 EP")
      .setMinValue(100)
      .setMaxValue(100000)
      .setRequired(true)
  );

export async function execute(interaction) {
  if (!process.env.DATABASE_URL) {
    return interaction.reply({
      content: "❌ 데이터베이스가 아직 연결되지 않았습니다.",
      ephemeral: true,
    });
  }

  const amount =
    interaction.options.getInteger("금액");

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  await ensureUser(guildId, userId);

  const result = await query(
    `
      SELECT ep
      FROM users
      WHERE guild_id = $1
        AND user_id = $2
    `,
    [guildId, userId]
  );

  const balance =
    Number(result.rows[0].ep);

  if (balance < amount) {
    return interaction.reply({
      content:
        `❌ EP가 부족합니다.\n` +
        `현재 잔액: **${balance.toLocaleString()} EP**`,
      ephemeral: true,
    });
  }

  const win = Math.random() < 0.5;

  if (win) {
    await query(
      `
        UPDATE users
        SET ep = ep + $1,
            updated_at = NOW()
        WHERE guild_id = $2
          AND user_id = $3
      `,
      [amount, guildId, userId]
    );
  } else {
    await query(
      `
        UPDATE users
        SET ep = ep - $1,
            updated_at = NOW()
        WHERE guild_id = $2
          AND user_id = $3
      `,
      [amount, guildId, userId]
    );
  }

  const updated = await query(
    `
      SELECT ep
      FROM users
      WHERE guild_id = $1
        AND user_id = $2
    `,
    [guildId, userId]
  );

  const finalBalance =
    Number(updated.rows[0].ep);

  await addMissionProgress(
    guildId,
    userId,
    "games_played"
  );

  const embed = new EmbedBuilder()
    .setTitle(
      win
        ? "🎉 더블업 성공!"
        : "💀 더블업 실패!"
    )
    .setDescription(
      win
        ? `🪙 **+${amount.toLocaleString()} EP**\n\n현재 잔액: **${finalBalance.toLocaleString()} EP**`
        : `🪙 **-${amount.toLocaleString()} EP**\n\n현재 잔액: **${finalBalance.toLocaleString()} EP**`
    )
    .setFooter({
      text: "성공 확률 50% · 실제 돈과 무관한 게임 포인트입니다.",
    });

  await interaction.reply({ embeds: [embed] });
}
