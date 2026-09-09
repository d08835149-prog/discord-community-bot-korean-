import { addMissionProgress } from "../../utils/missions.js";
import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

import { chosungQuiz } from "../../data/chosungQuiz.js";
import { randomItem } from "../../utils/random.js";

import {
  ensureUser,
  query,
} from "../../database/db.js";

const activeQuiz = new Map();
const REWARD = 200;

export const data = new SlashCommandBuilder()
  .setName("초성퀴즈")
  .setDescription("초성퀴즈를 시작하거나 정답을 제출합니다.")
  .addStringOption(option =>
    option
      .setName("정답")
      .setDescription("진행 중인 초성퀴즈의 정답")
      .setRequired(false)
  );

export async function execute(interaction) {
  if (process.env.DATABASE_URL) {
    await addMissionProgress(
      interaction.guildId,
      interaction.user.id,
      "games_played"
    );
  }

  const userId = interaction.user.id;

  const submitted =
    interaction.options.getString("정답");

  if (!submitted) {
    const quiz = randomItem(chosungQuiz);

    activeQuiz.set(userId, quiz);

    const embed = new EmbedBuilder()
      .setTitle("🔤 초성 퀴즈")
      .setDescription(
        `# ${quiz.consonants}\n\n` +
        `힌트: **${quiz.hint}**\n\n` +
        `정답을 알겠다면\n` +
        `\`/초성퀴즈 정답:정답\`\n` +
        `으로 입력하세요.\n\n` +
        `💰 정답 보상: **${REWARD} EP**`
      );

    return interaction.reply({
      embeds: [embed],
    });
  }

  const quiz =
    activeQuiz.get(userId);

  if (!quiz) {
    return interaction.reply({
      content:
        "❌ 진행 중인 초성퀴즈가 없습니다. 먼저 `/초성퀴즈`를 실행하세요.",
      ephemeral: true,
    });
  }

  const normalizedInput =
    submitted
      .replace(/\s/g, "")
      .toLowerCase();

  const normalizedAnswer =
    quiz.answer
      .replace(/\s/g, "")
      .toLowerCase();

  if (
    normalizedInput ===
    normalizedAnswer
  ) {
    activeQuiz.delete(userId);

    if (process.env.DATABASE_URL) {
      await ensureUser(
        interaction.guildId,
        userId
      );

      await query(
        `
          UPDATE users
          SET ep = ep + $1,
              chosung_correct = chosung_correct + 1,
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

    return interaction.reply(
      `🎉 정답입니다!\n\n` +
      `**${quiz.answer}** ✅\n\n` +
      `💰 **+${REWARD} EP**`
    );
  }

  await interaction.reply({
    content:
      "❌ 틀렸습니다! 다시 도전해보세요.",
    ephemeral: true,
  });
}
