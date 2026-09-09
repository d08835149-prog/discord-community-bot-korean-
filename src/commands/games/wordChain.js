import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

import { wordChainWords } from "../../data/wordChainWords.js";
import { randomItem } from "../../utils/random.js";

const games = new Map();

function normalize(word) {
  return word.replace(/\s/g, "").trim();
}

function getLastChar(word) {
  return [...word].at(-1);
}

function getFirstChar(word) {
  return [...word][0];
}

function findBotWord(lastChar, usedWords) {
  const candidates = wordChainWords.filter(word =>
    getFirstChar(word) === lastChar &&
    !usedWords.has(word)
  );

  if (candidates.length === 0) return null;

  return randomItem(candidates);
}

export const data = new SlashCommandBuilder()
  .setName("끝말잇기")
  .setDescription("봇과 끝말잇기를 합니다.")
  .addStringOption(option =>
    option
      .setName("단어")
      .setDescription("시작 또는 이어갈 단어")
      .setRequired(false)
  );

export async function execute(interaction) {
  const userId = interaction.user.id;
  const input = interaction.options.getString("단어");
  let game = games.get(userId);

  if (!game) {
    if (!input) {
      const startWord = randomItem(wordChainWords);

      game = {
        currentWord: startWord,
        usedWords: new Set([startWord]),
      };

      games.set(userId, game);

      const embed = new EmbedBuilder()
        .setTitle("🔗 끝말잇기 시작!")
        .setDescription(
          `내가 먼저 할게!\n\n# ${startWord}\n\n` +
          `**"${getLastChar(startWord)}"** 로 시작하는 단어를 입력해!\n\n` +
          `예: \`/끝말잇기 단어:...\``
        );

      return interaction.reply({ embeds: [embed] });
    }

    game = {
      currentWord: input,
      usedWords: new Set([input]),
    };

    games.set(userId, game);
  }

  if (!input) {
    return interaction.reply({
      content:
        `현재 단어는 **${game.currentWord}** 입니다.\n` +
        `**"${getLastChar(game.currentWord)}"** 로 시작하는 단어를 입력하세요.`,
      ephemeral: true,
    });
  }

  const word = normalize(input);

  if (word.length < 2) {
    return interaction.reply({
      content: "❌ 두 글자 이상의 단어를 입력해주세요.",
      ephemeral: true,
    });
  }

  if (game.usedWords.has(word)) {
    return interaction.reply({
      content: "❌ 이미 나온 단어예요!",
      ephemeral: true,
    });
  }

  const requiredFirst = getLastChar(game.currentWord);

  if (getFirstChar(word) !== requiredFirst) {
    return interaction.reply({
      content:
        `❌ **"${requiredFirst}"** 로 시작해야 해요!\n` +
        `현재 단어: **${game.currentWord}**`,
      ephemeral: true,
    });
  }

  game.usedWords.add(word);
  game.currentWord = word;

  const botWord = findBotWord(getLastChar(word), game.usedWords);

  if (!botWord) {
    games.delete(userId);

    const embed = new EmbedBuilder()
      .setTitle("🏆 당신의 승리!")
      .setDescription(
        `당신: **${word}**\n\n` +
        `으악... **"${getLastChar(word)}"** 으로 시작하는 단어를 못 찾겠어 😭`
      );

    return interaction.reply({ embeds: [embed] });
  }

  game.usedWords.add(botWord);
  game.currentWord = botWord;

  const embed = new EmbedBuilder()
    .setTitle("🔗 끝말잇기")
    .setDescription(
      `당신: **${word}**\n\n` +
      `🤖 나: **${botWord}**\n\n` +
      `이제 **"${getLastChar(botWord)}"** 로 시작하는 단어!`
    )
    .setFooter({
      text: `지금까지 ${game.usedWords.size}개의 단어 사용`,
    });

  await interaction.reply({ embeds: [embed] });
}
