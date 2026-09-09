import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

import {
  pool,
  ensureUser,
} from "../../database/db.js";

function seoulDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export const data = new SlashCommandBuilder()
  .setName("잭팟")
  .setDescription("EP 잭팟에 도전합니다.")
  .addBooleanOption(option =>
    option
      .setName("티켓사용")
      .setDescription("🎟️ 잭팟 티켓으로 추가 도전합니다.")
      .setRequired(false)
  );

export async function execute(interaction) {
  if (!process.env.DATABASE_URL) {
    return interaction.reply({
      content: "❌ 데이터베이스가 아직 연결되지 않았습니다.",
      ephemeral: true,
    });
  }

  const ENTRY_FEE = 200;
  const BASE_POOL = 5000;
  const WIN_CHANCE = 0.05;

  const guildId = interaction.guildId;
  const userId = interaction.user.id;
  const today = seoulDate();

  const useTicket =
    interaction.options.getBoolean("티켓사용") ?? false;

  await ensureUser(guildId, userId);

  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    // ─────────────────────────
    // 잭팟 풀 준비
    // ─────────────────────────

    await client.query(
      `
        INSERT INTO jackpot (
          guild_id,
          pool
        )
        VALUES ($1, $2)

        ON CONFLICT (guild_id)
        DO NOTHING
      `,
      [
        guildId,
        BASE_POOL,
      ]
    );

    const userResult =
      await client.query(
        `
          SELECT ep, last_jackpot
          FROM users
          WHERE guild_id = $1
            AND user_id = $2
          FOR UPDATE
        `,
        [
          guildId,
          userId,
        ]
      );

    const user =
      userResult.rows[0];

    const lastJackpot =
      user.last_jackpot
        ? new Date(user.last_jackpot)
            .toISOString()
            .slice(0, 10)
        : null;

    // ─────────────────────────
    // 일반 참가
    // ─────────────────────────

    if (!useTicket) {
      if (lastJackpot === today) {
        await client.query("ROLLBACK");

        return interaction.reply({
          content:
            "❌ 오늘은 이미 일반 잭팟에 참가했어요!\n\n" +
            "🎟️ **잭팟 티켓**이 있다면\n" +
            "`/잭팟 티켓사용:true`로 추가 도전할 수 있습니다.",
          ephemeral: true,
        });
      }

      if (Number(user.ep) < ENTRY_FEE) {
        await client.query("ROLLBACK");

        return interaction.reply({
          content:
            `❌ 참가비가 부족합니다.\n` +
            `필요: **${ENTRY_FEE} EP**`,
          ephemeral: true,
        });
      }

      await client.query(
        `
          UPDATE users
          SET ep = ep - $1,
              last_jackpot = $2,
              updated_at = NOW()
          WHERE guild_id = $3
            AND user_id = $4
        `,
        [
          ENTRY_FEE,
          today,
          guildId,
          userId,
        ]
      );

      await client.query(
        `
          UPDATE jackpot
          SET pool = pool + $1,
              updated_at = NOW()
          WHERE guild_id = $2
        `,
        [
          ENTRY_FEE,
          guildId,
        ]
      );
    }

    // ─────────────────────────
    // 잭팟 티켓 참가
    // ─────────────────────────

    else {
      const ticketResult =
        await client.query(
          `
            UPDATE user_items
            SET quantity = quantity - 1,
                updated_at = NOW()
            WHERE guild_id = $1
              AND user_id = $2
              AND item = '잭팟 티켓'
              AND quantity > 0
            RETURNING quantity
          `,
          [
            guildId,
            userId,
          ]
        );

      if (ticketResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return interaction.reply({
          content:
            "❌ 🎟️ **잭팟 티켓**을 가지고 있지 않습니다.\n" +
            "`/상점 구매`에서 구매할 수 있습니다.",
          ephemeral: true,
        });
      }
    }

    // ─────────────────────────
    // 현재 잭팟 금액
    // ─────────────────────────

    const jackpotResult =
      await client.query(
        `
          SELECT pool
          FROM jackpot
          WHERE guild_id = $1
          FOR UPDATE
        `,
        [
          guildId,
        ]
      );

    const currentPool =
      Number(
        jackpotResult.rows[0].pool
      );

    const win =
      Math.random() < WIN_CHANCE;

    // ─────────────────────────
    // 당첨
    // ─────────────────────────

    if (win) {
      await client.query(
        `
          UPDATE users
          SET ep = ep + $1,
              updated_at = NOW()
          WHERE guild_id = $2
            AND user_id = $3
        `,
        [
          currentPool,
          guildId,
          userId,
        ]
      );

      await client.query(
        `
          UPDATE jackpot
          SET pool = $1,
              updated_at = NOW()
          WHERE guild_id = $2
        `,
        [
          BASE_POOL,
          guildId,
        ]
      );
    }

    const balanceResult =
      await client.query(
        `
          SELECT ep
          FROM users
          WHERE guild_id = $1
            AND user_id = $2
        `,
        [
          guildId,
          userId,
        ]
      );

    const balance =
      Number(
        balanceResult.rows[0].ep
      );

    let remainingTickets = null;

    if (useTicket) {
      const ticketBalanceResult =
        await client.query(
          `
            SELECT quantity
            FROM user_items
            WHERE guild_id = $1
              AND user_id = $2
              AND item = '잭팟 티켓'
          `,
          [
            guildId,
            userId,
          ]
        );

      remainingTickets =
        ticketBalanceResult.rows.length > 0
          ? Number(
              ticketBalanceResult.rows[0].quantity
            )
          : 0;
    }

    await client.query("COMMIT");

    // ─────────────────────────
    // 결과 출력
    // ─────────────────────────

    const entryText =
      useTicket
        ? `🎟️ 잭팟 티켓 1개 사용\n` +
          `남은 티켓: **${remainingTickets}개**`
        : `참가비: **-${ENTRY_FEE} EP**`;

    const embed =
      new EmbedBuilder()
        .setTitle(
          win
            ? "🎰💥 JACKPOT!!!"
            : "🎰 잭팟 결과"
        )
        .setDescription(
          win
            ?
              `🎉 대박!!!\n\n` +
              `💰 **${currentPool.toLocaleString()} EP** 당첨!\n\n` +
              `${entryText}\n\n` +
              `현재 잔액: **${balance.toLocaleString()} EP**`
            :
              `아쉽다... 꽝! 😭\n\n` +
              `${entryText}\n` +
              `현재 잭팟: **${currentPool.toLocaleString()} EP**\n\n` +
              `현재 잔액: **${balance.toLocaleString()} EP**`
        )
        .setFooter({
          text:
            useTicket
              ? "🎟️ 티켓 도전 · 당첨 확률 5%"
              : "일반 도전 하루 1회 · 당첨 확률 5%",
        });

    return interaction.reply({
      embeds: [embed],
    });

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
}
