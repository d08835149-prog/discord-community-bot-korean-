import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

import {
  pool,
  ensureUser,
  query,
} from "../../database/db.js";

const TITLES = {
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

  열정러: {
    price: 10000,
    emoji: "🔥",
    description: "누구보다 열심히 활동하는 멤버",
  },

  전설: {
    price: 15000,
    emoji: "👑",
    description: "서버에 이름을 남긴 전설",
  },

  VIP: {
    price: 25000,
    emoji: "💎",
    description: "평범함을 거부하는 특별한 멤버",
  },

  신화: {
    price: 50000,
    emoji: "🌌",
    description: "전설을 넘어선 존재",
  },

  "서버의 지배자": {
    price: 100000,
    emoji: "🏆",
    description: "서버 정상에 오른 자",
  },

  초월자: {
    price: 250000,
    emoji: "🌠",
    description: "EP의 한계를 넘어선 존재",
  },
};

const ITEMS = {
  "운세 재뽑기권": {
    price: 500,
    emoji: "🔮",
    description: "오늘의 운세를 한 번 다시 뽑을 수 있습니다.",
  },

  "숫자 힌트권": {
    price: 700,
    emoji: "🎯",
    description: "숫자맞추기에서 강력한 힌트를 받을 수 있습니다.",
  },

  "잭팟 티켓": {
    price: 1000,
    emoji: "🎟️",
    description: "잭팟에서 사용할 수 있는 특별 티켓입니다.",
  },

  "랜덤 박스": {
    price: 3000,
    emoji: "🎁",
    description: "열면 랜덤한 EP 보상을 받을 수 있습니다.",
  },
};

const ALL_PRODUCTS = {
  ...TITLES,
  ...ITEMS,
};

function productChoices() {
  return Object.entries(ALL_PRODUCTS).map(
    ([name, data]) => ({
      name:
        `${data.emoji} ${name} - ` +
        `${data.price.toLocaleString()} EP`,
      value: name,
    })
  );
}

function titleChoices() {
  return Object.entries(TITLES).map(
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
      .setDescription("EP로 상품을 구매합니다.")
      .addStringOption(option =>
        option
          .setName("상품")
          .setDescription("구매할 상품")
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
          .addChoices(...titleChoices())
      )
  )

  .addSubcommand(subcommand =>
    subcommand
      .setName("보유")
      .setDescription("내가 가지고 있는 칭호와 아이템을 확인합니다.")
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

  // ─────────────────────────
  // 상점 보기
  // ─────────────────────────

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

    const titleLines =
      Object.entries(TITLES).map(
        ([name, product]) =>
          `${product.emoji} **${name}**\n` +
          `${product.description}\n` +
          `💰 ${product.price.toLocaleString()} EP`
      );

    const itemLines =
      Object.entries(ITEMS).map(
        ([name, product]) =>
          `${product.emoji} **${name}**\n` +
          `${product.description}\n` +
          `💰 ${product.price.toLocaleString()} EP`
      );

    const embed = new EmbedBuilder()
      .setTitle("🛒 EP 상점")
      .setDescription(
        `## 🏷️ 칭호\n\n` +
        `${titleLines.join("\n\n")}\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `## 🎒 아이템\n\n` +
        `${itemLines.join("\n\n")}\n\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `💰 현재 잔액: **${balance.toLocaleString()} EP**`
      )
      .setFooter({
        text: "/상점 구매 로 상품을 구매하세요.",
      });

    return interaction.reply({
      embeds: [embed],
    });
  }

  // ─────────────────────────
  // 보유 상품
  // ─────────────────────────

  if (subcommand === "보유") {
    const titlesResult = await query(
      `
        SELECT title
        FROM user_titles
        WHERE guild_id = $1
          AND user_id = $2
        ORDER BY purchased_at ASC
      `,
      [guildId, userId]
    );

    const itemsResult = await query(
      `
        SELECT item, quantity
        FROM user_items
        WHERE guild_id = $1
          AND user_id = $2
          AND quantity > 0
        ORDER BY item ASC
      `,
      [guildId, userId]
    );

    const titleText =
      titlesResult.rows.length > 0
        ? titlesResult.rows
            .map(row => {
              const product =
                TITLES[row.title];

              return (
                `${product?.emoji ?? "🏷️"} ` +
                `**${row.title}**`
              );
            })
            .join("\n")
        : "없음";

    const itemText =
      itemsResult.rows.length > 0
        ? itemsResult.rows
            .map(row => {
              const product =
                ITEMS[row.item];

              return (
                `${product?.emoji ?? "📦"} ` +
                `**${row.item}** × ${row.quantity}`
              );
            })
            .join("\n")
        : "없음";

    const embed = new EmbedBuilder()
      .setTitle("🎒 내 보관함")
      .addFields(
        {
          name: "🏷️ 보유 칭호",
          value: titleText,
        },
        {
          name: "🎁 보유 아이템",
          value: itemText,
        }
      );

    return interaction.reply({
      embeds: [embed],
    });
  }

  // ─────────────────────────
  // 칭호 장착
  // ─────────────────────────

  if (subcommand === "장착") {
    const selected =
      interaction.options.getString("칭호");

    const product =
      TITLES[selected];

    if (!product) {
      return interaction.reply({
        content: "❌ 존재하지 않는 칭호입니다.",
        ephemeral: true,
      });
    }

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

  // ─────────────────────────
  // 구매
  // ─────────────────────────

  if (subcommand === "구매") {
    const selected =
      interaction.options.getString("상품");

    const product =
      ALL_PRODUCTS[selected];

    if (!product) {
      return interaction.reply({
        content: "❌ 존재하지 않는 상품입니다.",
        ephemeral: true,
      });
    }

    const isTitle =
      Object.prototype.hasOwnProperty.call(
        TITLES,
        selected
      );

    const client =
      await pool.connect();

    try {
      await client.query("BEGIN");

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
        Number(userResult.rows[0].ep);

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

      // 칭호 구매
      if (isTitle) {
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
      }

      // 아이템 구매
      else {
        await client.query(
          `
            INSERT INTO user_items (
              guild_id,
              user_id,
              item,
              quantity
            )
            VALUES ($1, $2, $3, 1)

            ON CONFLICT (
              guild_id,
              user_id,
              item
            )

            DO UPDATE SET
              quantity =
                user_items.quantity + 1,
              updated_at = NOW()
          `,
          [
            guildId,
            userId,
            selected,
          ]
        );
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

      await client.query("COMMIT");

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🛍️ 구매 완료!")
            .setDescription(
              `${product.emoji} **「${selected}」**\n\n` +
              `💸 -${product.price.toLocaleString()} EP\n\n` +
              (
                isTitle
                  ? "`/상점 장착`으로 칭호를 사용할 수 있습니다."
                  : "🎒 아이템이 보관함에 추가되었습니다."
              )
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
