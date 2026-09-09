import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("핑")
  .setDescription("봇의 응답 속도를 확인합니다.");

export async function execute(interaction) {
  const start = Date.now();

  await interaction.reply("🏓 측정 중...");

  const latency = Date.now() - start;

  await interaction.editReply(
    `🏓 퐁!\n응답 속도: **${latency}ms**\nDiscord API: **${interaction.client.ws.ping}ms**`
  );
}
