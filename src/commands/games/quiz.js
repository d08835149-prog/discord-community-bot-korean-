import { addMissionProgress } from "../../utils/missions.js";
import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";

import { generalQuiz } from "../../data/generalQuiz.js";
import { randomItem } from "../../utils/random.js";
import {
  ensureUser,
  query,
} from "../../database/db.js";

const REWARD = 150;

export const data = new SlashCommandBuilder()
  .setName("퀴즈")
  .setDescription("랜덤 객관식 퀴즈에 도전합니다.");

export async function execute(interaction) {
  const quiz = randomItem(generalQuiz);

  const labels = ["A", "B", "C", "D"];

  const row = new ActionRowBuilder().addComponents(
    quiz.choices.map((choice, index) =>
      new ButtonBuilder()
        .setCustomId(`quiz_${index}`)
        .setLabel(
          `${labels[index]}. ${choice}`.slice(0, 80)
        )
        .setStyle(ButtonStyle.Secondary)
    )
  );

  const embed = new EmbedBuilder()
    .setTitle(`🧠 랜덤 퀴즈 · ${quiz.category}`)
    .setDescription(`**${quiz.question}**`)
    .setFooter({
      text: `20초 안에 선택 · 정답 보상 ${REWARD} EP`,
    });

  const response = await interaction.reply({
    embeds: [embed],
    components: [row],
    fetchReply: true,
  });

  try {
    const answer =
      await response.awaitMessageComponent({
        componentType: ComponentType.Button,
        filter: i =>
          i.user.id === interaction.user.id,
        time: 20000,
      });

    const selected =
      Number(answer.customId.split("_")[1]);

    const correct =
      selected === quiz.answer;

    if (
      correct &&
      process.env.DATABASE_URL
    ) {
      await ensureUser(
        interaction.guildId,
        interaction.user.id
      );

      await query(
        `
          UPDATE users
          SET ep = ep + $1,
              quiz_correct = quiz_correct + 1,
              updated_at = NOW()
          WHERE guild_id = $2
            AND user_id = $3
        `,
        [
          REWARD,
          interaction.guildId,
          interaction.user.id,
        ]
      );

      await addMissionProgress(
        interaction.guildId,
        interaction.user.id,
        "quiz_correct"
      );
    }

    const disabledRow =
      new ActionRowBuilder().addComponents(
        row.components.map(
          (button, index) =>
            ButtonBuilder.from(button)
              .setDisabled(true)
              .setStyle(
                index === quiz.answer
                  ? ButtonStyle.Success
                  : index === selected
                    ? ButtonStyle.Danger
                    : ButtonStyle.Secondary
              )
        )
      );

    if (correct) {
      await answer.update({
        embeds: [
          EmbedBuilder.from(embed)
            .setDescription(
              `**${quiz.question}**\n\n` +
              `🎉 정답!\n` +
              `정답: **${quiz.choices[quiz.answer]}**\n\n` +
              `💰 **+${REWARD} EP**`
            ),
        ],
        components: [disabledRow],
      });

    } else {
      await answer.update({
        embeds: [
          EmbedBuilder.from(embed)
            .setDescription(
              `**${quiz.question}**\n\n` +
              `❌ 오답!\n` +
              `정답: **${quiz.choices[quiz.answer]}**`
            ),
        ],
        components: [disabledRow],
      });
    }

  } catch {
    const disabledRow =
      new ActionRowBuilder().addComponents(
        row.components.map(button =>
          ButtonBuilder.from(button)
            .setDisabled(true)
        )
      );

    await interaction.editReply({
      embeds: [
        EmbedBuilder.from(embed)
          .setDescription(
            `**${quiz.question}**\n\n` +
            `⏰ 시간 초과!\n` +
            `정답: **${quiz.choices[quiz.answer]}**`
          ),
      ],
      components: [disabledRow],
    });
  }
}
