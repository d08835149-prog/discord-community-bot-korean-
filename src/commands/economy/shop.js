import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

import {
  pool,
  ensureUser,
  query,
} from "../../database/db.js";

const PRODUCTS = {
  새싹: {
    price: 1000,
    emoji: "🌱",
    description: "커뮤니티 생활을 시작한 신입!",
  },

  행운아: {
    price: 2500,
    emoji: "🍀",
    description: "오늘 뭔가 잘 풀릴 것 같은 사람",
  },

  퀴즈왕: {
    price: 5000,
    emoji: "🧠",
    description: "지식으로 서버를 지배한다",
  },

  승부사: {
    price: 7500,
    emoji: "🎲",
    description: "승부 앞에서는 물러서지 않는다",
  },

  전설: {
    price: 15000,
    emoji: "👑",
    description: "서버에 이름을 남긴 전설",
  },
};

function productChoices() {
  return Object.entries(PRODUCTS).map(
    ([name, data]) => ({
      name:
        `${data.emoji} ${name} - ` +
        `${data.price.toLocaleString()} EP`,
      value: name,
    })
  );
}

export const data = new SlashCommandBuilder()
  .setName("상점")
  .setDescription("EP 상점을 이용합니다.")

  .addSubcommand(subcommand =>
    subcommand
      .setName("보기")
      .setDescription("판매 중인 상품을 확인합니다.")
  )

  .addSubcommand(subcommand =>
    subcommand
      .setName("구매")
      .setDescription("EP로 칭호를 구매합니다.")
      .addStringOption(option =>
        option
          .setName("상품")
          .setDescription("구매할 칭호")
          .setRequired(true)
          .addChoices(...productChoices())
      )
  )

  .addSubcommand(subcommand =>
    subcommand
      .setName("장착")
      .setDescription("보유 중인 칭호를 장착합니다.")
      .addStringOption(option =>
        option
          .setName("칭호")
          .setDescription("장착할 칭호")
          .setRequired(true)
          .addChoices(...productChoices())
      )
  )

  .addSubcommand(subcommand =>
    subcommand
      .setName("보유")
      .setDescription("내가 가지고 있는 칭호를 확인합니다.")
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

  await ensureUser(guildId, userId);

  const subcommand =
    interaction.options.getSubcommand();

  if (subcommand === "보기") {
    const userResult = await query(
      `
        SELECT ep
        FROM users
        WHERE guild_id = $1
          AND user_id = $2
      `,
      [guildId, userId]
    );

    const balance =
      Number(userResult.rows[0].ep);

    const lines =
      Object.entries(PRODUCTS).map(
        ([name, product]) =>
          `${product.emoji} **${name}**\n` +
          `${product.description}\n` +
          `💰 ${product.price.toLocaleString()} EP`
      );

    const embed = new EmbedBuilder()
      .setTitle("🛒 EP 상점")
      .setDescription(
        `${lines.join("\n\n")}\n\n` +
        `현재 잔액: **${balance.toLocaleString()} EP**`
      )
      .setFooter({
        text: "/상점 구매 로 칭호를 구매하세요.",
      });

    return interaction.reply({
      embeds: [embed],
    });
  }

  if (subcommand === "보유") {
    const result = await query(
      `
        SELECT title
        FROM user_titles
        WHERE guild_id = $1
          AND user_id = $2
        ORDER BY purchased_at ASC
      `,
      [guildId, userId]
    );

    if (result.rows.length === 0) {
      return interaction.reply({
        content:
          "📦 아직 보유한 칭호가 없습니다.\n" +
          "`/상점 보기`에서 확인해보세요.",
        ephemeral: true,
      });
    }

    const titles =
      result.rows
        .map(row => {
          const product =
            PRODUCTS[row.title];

          return (
            `${product?.emoji ?? "🏷️"} ` +
            `**${row.title}**`
          );
        })
        .join("\n");

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("📦 보유 중인 칭호")
          .setDescription(titles),
      ],
    });
  }

  const selected =
    interaction.options.getString(
      subcommand === "구매"
        ? "상품"
        : "칭호"
    );

  const product =
    PRODUCTS[selected];

  if (!product) {
    return interaction.reply({
      content: "❌ 존재하지 않는 상품입니다.",
      ephemeral: true,
    });
  }

  if (subcommand === "장착") {
    const owned = await query(
      `
        SELECT 1
        FROM user_titles
        WHERE guild_id = $1
          AND user_id = $2
          AND title = $3
      `,
      [guildId, userId, selected]
    );

    if (owned.rows.length === 0) {
      return interaction.reply({
        content:
          `❌ **${selected}** 칭호를 가지고 있지 않습니다.`,
        ephemeral: true,
      });
    }

    await query(
      `
        UPDATE users
        SET title = $1,
            updated_at = NOW()
        WHERE guild_id = $2
          AND user_id = $3
      `,
      [selected, guildId, userId]
    );

    return interaction.reply(
      `${product.emoji} 칭호 **「${selected}」** 장착 완료!`
    );
  }

  if (subcommand === "구매") {
    const client =
      await pool.connect();

    try {
      await client.query("BEGIN");

      const ownedResult =
        await client.query(
          `
            SELECT 1
            FROM user_titles
            WHERE guild_id = $1
              AND user_id = $2
              AND title = $3
          `,
          [
            guildId,
            userId,
            selected,
          ]
        );

      if (ownedResult.rows.length > 0) {
        await client.query("ROLLBACK");

        return interaction.reply({
          content:
            `❌ 이미 **${selected}** 칭호를 가지고 있습니다.`,
          ephemeral: true,
        });
      }

      const userResult =
        await client.query(
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
        Number(
          userResult.rows[0].ep
        );

      if (balance < product.price) {
        await client.query("ROLLBACK");

        return interaction.reply({
          content:
            `❌ EP가 부족합니다.\n\n` +
            `필요: **${product.price.toLocaleString()} EP**\n` +
            `보유: **${balance.toLocaleString()} EP**`,
          ephemeral: true,
        });
      }

      await client.query(
        `
          UPDATE users
          SET ep = ep - $1,
              updated_at = NOW()
          WHERE guild_id = $2
            AND user_id = $3
        `,
        [
          product.price,
          guildId,
          userId,
        ]
      );

      await client.query(
        `
          INSERT INTO user_titles (
            guild_id,
            user_id,
            title
          )
          VALUES ($1, $2, $3)
        `,
        [
          guildId,
          userId,
          selected,
        ]
      );

      await client.query("COMMIT");

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🛍️ 구매 완료!")
            .setDescription(
              `${product.emoji} **「${selected}」**\n\n` +
              `-${product.price.toLocaleString()} EP\n\n` +
              `\`/상점 장착\`으로 사용할 수 있습니다.`
            ),
        ],
      });

    } catch (error) {
      await client.query("ROLLBACK");
      throw error;

    } finally {
      client.release();
    }
  }
}
