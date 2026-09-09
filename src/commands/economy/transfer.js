import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

import {
  pool,
  ensureUser,
} from "../../database/db.js";

export const data = new SlashCommandBuilder()
  .setName("송금")
  .setDescription("다른 유저에게 EP를 보냅니다.")
  .addUserOption(option =>
    option
      .setName("유저")
      .setDescription("EP를 받을 유저")
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName("금액")
      .setDescription("보낼 EP")
      .setMinValue(1)
      .setRequired(true)
  );

export async function execute(interaction) {
  if (!process.env.DATABASE_URL) {
    return interaction.reply({
      content: "❌ 데이터베이스가 아직 연결되지 않았습니다.",
      ephemeral: true,
    });
  }

  const sender = interaction.user;
  const receiver =
    interaction.options.getUser("유저");

  const amount =
    interaction.options.getInteger("금액");

  if (receiver.bot) {
    return interaction.reply({
      content: "❌ 봇에게 EP를 보낼 수 없습니다.",
      ephemeral: true,
    });
  }

  if (receiver.id === sender.id) {
    return interaction.reply({
      content: "ㅋㅋ 자기 자신에게 송금할 수는 없어요.",
      ephemeral: true,
    });
  }

  await ensureUser(
    interaction.guildId,
    sender.id
  );

  await ensureUser(
    interaction.guildId,
    receiver.id
  );

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const senderResult = await client.query(
      `
        SELECT ep
        FROM users
        WHERE guild_id = $1
          AND user_id = $2
        FOR UPDATE
      `,
      [interaction.guildId, sender.id]
    );

    const balance =
      Number(senderResult.rows[0].ep);

    if (balance < amount) {
      await client.query("ROLLBACK");

      return interaction.reply({
        content:
          `❌ EP가 부족합니다.\n` +
          `현재 잔액: **${balance.toLocaleString()} EP**`,
        ephemeral: true,
      });
    }

    await client.query(
      `
        UPDATE users
        SET ep = ep - $1,
            total_sent = total_sent + $1,
            updated_at = NOW()
        WHERE guild_id = $2
          AND user_id = $3
      `,
      [
        amount,
        interaction.guildId,
        sender.id,
      ]
    );

    await client.query(
      `
        UPDATE users
        SET ep = ep + $1,
            updated_at = NOW()
        WHERE guild_id = $2
          AND user_id = $3
      `,
      [
        amount,
        interaction.guildId,
        receiver.id,
      ]
    );

    await client.query("COMMIT");

    const embed = new EmbedBuilder()
      .setTitle("💸 EP 송금 완료")
      .setDescription(
        `${sender} ➡️ ${receiver}\n\n` +
        `💰 **${amount.toLocaleString()} EP**`
      );

    await interaction.reply({ embeds: [embed] });

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
}
