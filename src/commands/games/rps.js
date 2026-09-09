import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

import {
  pool,
  ensureUser,
} from "../../database/db.js";

const choices = ["가위", "바위", "보"];

function getResult(user, bot) {
  if (user === bot) return "draw";

  if (
    (user === "가위" && bot === "보") ||
    (user === "바위" && bot === "가위") ||
    (user === "보" && bot === "바위")
  ) {
    return "win";
  }

  return "lose";
}

function emoji(choice) {
  if (choice === "가위") return "✌️";
  if (choice === "바위") return "✊";
  return "🖐️";
}

export const data = new SlashCommandBuilder()
  .setName("가위바위보")
  .setDescription("EP를 걸고 봇과 가위바위보를 합니다.")
  .addStringOption(option =>
    option
      .setName("선택")
      .setDescription("가위, 바위, 보 중 선택")
      .setRequired(true)
      .addChoices(
        { name: "✌️ 가위", value: "가위" },
        { name: "✊ 바위", value: "바위" },
        { name: "🖐️ 보", value: "보" }
      )
  )
  .addIntegerOption(option =>
    option
      .setName("베팅")
      .setDescription("걸 EP")
      .setRequired(true)
      .setMinValue(100)
      .setMaxValue(10000)
  );

export async function execute(interaction) {
  if (!process.env.DATABASE_URL) {
    return interaction.reply({
      content: "❌ 데이터베이스가 연결되지 않았습니다.",
      ephemeral: true,
    });
  }

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  const userChoice =
    interaction.options.getString("선택");

  const bet =
    interaction.options.getInteger("베팅");

  const botChoice =
    choices[Math.floor(Math.random() * choices.length)];

  const result =
    getResult(userChoice, botChoice);

  await ensureUser(guildId, userId);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `
        SELECT ep
        FROM users
        WHERE guild_id = $1
          AND user_id = $2
        FOR UPDATE
      `,
      [guildId, userId]
    );

    const balance =
      Number(userResult.rows[0].ep);

    if (balance < bet) {
      await client.query("ROLLBACK");

      return interaction.reply({
        content:
          `❌ EP가 부족합니다.\n` +
          `현재 잔액: **${balance.toLocaleString()} EP**`,
        ephemeral: true,
      });
    }

    if (result === "win") {
      await client.query(
        `
          UPDATE users
          SET ep = ep + $1,
              rps_wins = rps_wins + 1,
              updated_at = NOW()
          WHERE guild_id = $2
            AND user_id = $3
        `,
        [bet, guildId, userId]
      );
    }

    if (result === "lose") {
      await client.query(
        `
          UPDATE users
          SET ep = ep - $1,
              rps_losses = rps_losses + 1,
              updated_at = NOW()
          WHERE guild_id = $2
            AND user_id = $3
        `,
        [bet, guildId, userId]
      );
    }

    const finalResult = await client.query(
      `
        SELECT ep
        FROM users
        WHERE guild_id = $1
          AND user_id = $2
      `,
      [guildId, userId]
    );

    const finalBalance =
      Number(finalResult.rows[0].ep);

    await client.query("COMMIT");

    let title;
    let message;

    if (result === "win") {
      title = "🎉 가위바위보 승리!";
      message =
        `💰 **+${bet.toLocaleString()} EP**`;
    } else if (result === "lose") {
      title = "💀 가위바위보 패배!";
      message =
        `💸 **-${bet.toLocaleString()} EP**`;
    } else {
      title = "🤝 무승부!";
      message = "EP 변화 없음";
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(
        `당신: ${emoji(userChoice)} **${userChoice}**\n` +
        `Dot: ${emoji(botChoice)} **${botChoice}**\n\n` +
        `${message}\n\n` +
        `현재 잔액: **${finalBalance.toLocaleString()} EP**`
      )
      .setFooter({
        text: `베팅 ${bet.toLocaleString()} EP`,
      });

    await interaction.reply({
      embeds: [embed],
    });

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
}
