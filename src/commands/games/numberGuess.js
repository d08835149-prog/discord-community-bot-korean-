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
  );

export async function execute(interaction) {
  const userId = interaction.user.id;

  const guess =
    interaction.options.getInteger("숫자");

  let game =
    activeGames.get(userId);

  if (!game) {
    game = {
      answer: randomNumber(1, 100),
      attempts: 0,
    };

    activeGames.set(
      userId,
      game
    );
  }

  game.attempts++;

  if (guess === game.answer) {
    const attempts =
      game.attempts;

    activeGames.delete(userId);

    if (process.env.DATABASE_URL) {
      await ensureUser(
        interaction.guildId,
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
          interaction.guildId,
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

  if (game.attempts >= 10) {
    const answer =
      game.answer;

    activeGames.delete(userId);

    return interaction.reply({
      content:
        `💀 10번 안에 못 맞혔어요!\n` +
        `정답은 **${answer}**였습니다.\n\n` +
        `다시 \`/숫자맞추기\`를 사용하면 새 게임이 시작됩니다.`,
    });
  }

  const hint =
    guess < game.answer
      ? "📈 UP!"
      : "📉 DOWN!";

  await interaction.reply(
    `${hint}\n` +
    `현재 시도: **${game.attempts}/10**\n` +
    `남은 기회: **${10 - game.attempts}번**`
  );
}
