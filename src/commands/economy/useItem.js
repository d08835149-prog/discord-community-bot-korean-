import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

import {
  pool,
  ensureUser,
} from "../../database/db.js";

import {
  randomItem,
  randomNumber,
} from "../../utils/random.js";

import { fortunes } from "../../data/fortunes.js";

const ITEMS = {
  "운세 재뽑기권": "🔮",
  "랜덤 박스": "🎁",
};

function randomBoxReward() {
  const roll = Math.random() * 100;

  if (roll < 35) return 500;
  if (roll < 60) return 1000;
  if (roll < 80) return 2000;
  if (roll < 90) return 3000;
  if (roll < 97) return 5000;
  return 10000;
}

export const data = new SlashCommandBuilder()
  .setName("아이템사용")
  .setDescription("보유 중인 아이템을 사용합니다.")
  .addStringOption(option =>
    option
      .setName("아이템")
      .setDescription("사용할 아이템")
      .setRequired(true)
      .addChoices(
        {
          name: "🔮 운세 재뽑기권",
          value: "운세 재뽑기권",
        },
        {
          name: "🎁 랜덤 박스",
          value: "랜덤 박스",
        }
      )
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

  const selected =
    interaction.options.getString("아이템");

  if (!ITEMS[selected]) {
    return interaction.reply({
      content: "❌ 사용할 수 없는 아이템입니다.",
      ephemeral: true,
    });
  }

  await ensureUser(guildId, userId);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const itemResult =
      await client.query(
        `
          SELECT quantity
          FROM user_items
          WHERE guild_id = $1
            AND user_id = $2
            AND item = $3
          FOR UPDATE
        `,
        [
          guildId,
          userId,
          selected,
        ]
      );

    const quantity =
      itemResult.rows.length > 0
        ? Number(itemResult.rows[0].quantity)
        : 0;

    if (quantity <= 0) {
      await client.query("ROLLBACK");

      return interaction.reply({
        content:
          `❌ ${ITEMS[selected]} **${selected}**을 가지고 있지 않습니다.\n` +
          "`/상점 구매`에서 구매할 수 있습니다.",
        ephemeral: true,
      });
    }

    // 아이템 1개 소모
    await client.query(
      `
        UPDATE user_items
        SET quantity = quantity - 1,
            updated_at = NOW()
        WHERE guild_id = $1
          AND user_id = $2
          AND item = $3
      `,
      [
        guildId,
        userId,
        selected,
      ]
    );

    // ─────────────────────────
    // 운세 재뽑기권
    // ─────────────────────────

    if (selected === "운세 재뽑기권") {
      const fortune =
        randomItem(fortunes);

      const luck =
        randomNumber(1, 100);

      const money =
        randomNumber(1, 100);

      const love =
        randomNumber(1, 100);

      await client.query("COMMIT");

      const embed =
        new EmbedBuilder()
          .setTitle(
            `🔮 ${interaction.user.displayName}님의 재뽑기 운세`
          )
          .setDescription(fortune)
          .addFields(
            {
              name: "🍀 행운",
              value: `${luck}%`,
              inline: true,
            },
            {
              name: "💰 금전운",
              value: `${money}%`,
              inline: true,
            },
            {
              name: "💖 애정운",
              value: `${love}%`,
              inline: true,
            }
          )
          .setFooter({
            text: "🔮 운세 재뽑기권 1개 사용",
          })
          .setTimestamp();

      return interaction.reply({
        embeds: [embed],
      });
    }

    // ─────────────────────────
    // 랜덤 박스
    // ─────────────────────────

    if (selected === "랜덤 박스") {
      const reward =
        randomBoxReward();

      await client.query(
        `
          UPDATE users
          SET ep = ep + $1,
              updated_at = NOW()
          WHERE guild_id = $2
            AND user_id = $3
        `,
        [
          reward,
          guildId,
          userId,
        ]
      );

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
        Number(balanceResult.rows[0].ep);

      await client.query("COMMIT");

      let message = "🎁 상자를 열었습니다!";

      if (reward >= 10000) {
        message = "🌟 대박!!!";
      } else if (reward >= 5000) {
        message = "✨ 오! 좋은 보상!";
      } else if (reward <= 1000) {
        message = "🥲 다음엔 더 좋은 게 나올지도...";
      }

      const embed =
        new EmbedBuilder()
          .setTitle(message)
          .setDescription(
            `🎁 랜덤 박스에서\n\n` +
            `💰 **${reward.toLocaleString()} EP** 획득!\n\n` +
            `현재 잔액: **${balance.toLocaleString()} EP**`
          )
          .setFooter({
            text: "랜덤 박스 1개 사용",
          });

      return interaction.reply({
        embeds: [embed],
      });
    }

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;

  } finally {
    client.release();
  }
}
