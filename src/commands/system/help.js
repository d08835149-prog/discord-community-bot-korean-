import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

export const data =
  new SlashCommandBuilder()
    .setName("도움말")
    .setDescription("Dot 봇의 명령어를 확인합니다.");

export async function execute(interaction) {
  const embed =
    new EmbedBuilder()
      .setTitle("🤖 Dot 명령어 도움말")
      .setDescription(
        "서버에서 사용할 수 있는 명령어 목록입니다."
      )
      .addFields(
        {
          name: "💬 커뮤니티",
          value:
            "`/오늘의질문`\n" +
            "`/오늘의tmi`\n" +
            "`/오늘의운세`\n" +
            "`/서버운세`\n" +
            "`/오늘의멤버`\n" +
            "`/궁합`\n" +
            "`/고백확률`\n" +
            "`/친밀도`",
          inline: true,
        },
        {
          name: "🎲 랜덤",
          value:
            "`/동전던지기`\n" +
            "`/랜덤선택`\n" +
            "`/룰렛`\n" +
            "`/밸런스게임`\n" +
            "`/이상형월드컵`",
          inline: true,
        },
        {
          name: "🎮 게임",
          value:
            "`/가위바위보`\n" +
            "`/숫자맞추기`\n" +
            "`/초성퀴즈`\n" +
            "`/퀴즈`\n" +
            "`/끝말잇기`",
          inline: true,
        },
        {
          name: "💰 EP 경제",
          value:
            "`/출석체크`\n" +
            "`/프로필`\n" +
            "`/랭킹`\n" +
            "`/송금`\n" +
            "`/더블업`\n" +
            "`/잭팟`\n" +
            "`/상점`\n" +
            "`/업적`",
          inline: true,
        },
        {
          name: "⚙️ 시스템",
          value:
            "`/핑`\n" +
            "`/도움말`\n" +
            "`/제작자`",
          inline: true,
        }
      )
      .setFooter({
        text:
          "게임을 플레이하고 EP를 모아 칭호를 구매해보세요!",
      });

  await interaction.reply({
    embeds: [embed],
  });
}
