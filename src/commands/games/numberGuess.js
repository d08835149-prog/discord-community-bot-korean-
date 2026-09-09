import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

import {
  randomNumber,
} from "../../utils/random.js";

import {
  ensureUser,
  query,
} from "../../database/db.js";

const activeGames = new Map();
const REWARD = 300;

function gameKey(guildId, userId) {
  return `${guildId}:${userId}`;
}

export const data = new SlashCommandBuilder()
  .setName("숫자맞추기")
  .setDescription("1~100 사이 숫자를 맞혀보세요.")
  .addIntegerOption(option =>
    option
      .setName("숫자")
      .setDescription("1부터 100 사이 숫자")
      .setMinValue(1)
      .setMaxValue(100)
      .setRequired(true)
  )
  .addBooleanOption(option =>
    option
      .setName("힌트권사용")
      .setDescription("🎯 숫자 힌트권 1개를 사용합니다.")
      .setRequired(false)
  );

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  const guess =
    interaction.options.getInteger("숫자");

  const useHint =
    interaction.options.getBoolean("힌트권사용") ?? false;

  const key =
    gameKey(guildId, userId);

  let game =
    activeGames.get(key);

  if (!game) {
    game = {
      answer: randomNumber(1, 100),
      attempts: 0,
    };

    activeGames.set(
      key,
      game
    );
  }

  game.attempts++;

  // ─────────────────────────
  // 정답
  // ─────────────────────────

  if (guess === game.answer) {
    const attempts =
      game.attempts;

    activeGames.delete(key);

    if (process.env.DATABASE_URL) {
      await ensureUser(
        guildId,
        userId
      );

      await query(
        `
          UPDATE users
          SET ep = ep + $1,
              number_guess_wins = number_guess_wins + 1,
              updated_at = NOW()
          WHERE guild_id = $2
            AND user_id = $3
        `,
        [
          REWARD,
          guildId,
          userId,
        ]
      );
    }

    const embed =
      new EmbedBuilder()
        .setTitle("🎉 정답!")
        .setDescription(
          `정답은 **${guess}**였습니다!\n\n` +
          `시도 횟수: **${attempts}회**\n\n` +
          `💰 **+${REWARD} EP**`
        );

    return interaction.reply({
      embeds: [embed],
    });
  }

  // ─────────────────────────
  // 10회 실패
  // ─────────────────────────

  if (game.attempts >= 10) {
    const answer =
      game.answer;

    activeGames.delete(key);

    return interaction.reply({
      content:
        `💀 10번 안에 못 맞혔어요!\n` +
        `정답은 **${answer}**였습니다.\n\n` +
        `다시 \`/숫자맞추기\`를 사용하면 새 게임이 시작됩니다.`,
    });
  }

  const basicHint =
    guess < game.answer
      ? "📈 UP!"
      : "📉 DOWN!";

  // ─────────────────────────
  // 숫자 힌트권 사용
  // ─────────────────────────

  if (useHint) {
    if (!process.env.DATABASE_URL) {
      return interaction.reply({
        content:
          `${basicHint}\n\n` +
          "❌ 데이터베이스가 연결되지 않아 힌트권을 사용할 수 없습니다.",
        ephemeral: true,
      });
    }

    await ensureUser(
      guildId,
      userId
    );

    const itemResult =
      await query(
        `
          UPDATE user_items
          SET quantity = quantity - 1,
              updated_at = NOW()
          WHERE guild_id = $1
            AND user_id = $2
            AND item = '숫자 힌트권'
            AND quantity > 0
          RETURNING quantity
        `,
        [
          guildId,
          userId,
        ]
      );

    if (itemResult.rows.length === 0) {
      return interaction.reply({
        content:
          `${basicHint}\n\n` +
          "❌ 🎯 **숫자 힌트권**을 가지고 있지 않습니다.\n" +
          "`/상점 구매`에서 구매할 수 있습니다.\n\n" +
          `현재 시도: **${game.attempts}/10**`,
        ephemeral: true,
      });
    }

    // 정답을 포함하는 최대 약 20칸 범위
    let min =
      Math.max(
        1,
        game.answer - randomNumber(5, 10)
      );

    let max =
      Math.min(
        100,
        game.answer + randomNumber(5, 10)
      );

    // 너무 좁아지지 않도록 보정
    if (max - min < 8) {
      min = Math.max(
        1,
        game.answer - 5
      );

      max = Math.min(
        100,
        game.answer + 5
      );
    }

    const remaining =
      Number(
        itemResult.rows[0].quantity
      );

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎯 숫자 힌트!")
          .setDescription(
            `${basicHint}\n\n` +
            `🔍 정답은 **${min} ~ ${max}** 사이에 있습니다!\n\n` +
            `현재 시도: **${game.attempts}/10**\n` +
            `남은 기회: **${10 - game.attempts}번**\n\n` +
            `🎯 남은 힌트권: **${remaining}개**`
          )
          .setFooter({
            text: "숫자 힌트권 1개 사용",
          }),
      ],
    });
  }

  // ─────────────────────────
  // 일반 오답
  // ─────────────────────────

  return interaction.reply(
    `${basicHint}\n` +
    `현재 시도: **${game.attempts}/10**\n` +
    `남은 기회: **${10 - game.attempts}번**`
  );
}
