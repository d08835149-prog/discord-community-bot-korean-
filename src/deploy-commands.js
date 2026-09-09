import "dotenv/config";

import { REST, Routes } from "discord.js";
import path from "path";
import { fileURLToPath } from "url";
import { loadCommands } from "./utils/loadCommands.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DISCORD_TOKEN) {
  throw new Error("❌ DISCORD_TOKEN이 없습니다.");
}

if (!process.env.CLIENT_ID) {
  throw new Error("❌ CLIENT_ID가 없습니다.");
}

if (!process.env.GUILD_ID) {
  throw new Error("❌ GUILD_ID가 없습니다.");
}

const commandsPath = path.join(__dirname, "commands");
const loadedCommands = await loadCommands(commandsPath);

const commands = loadedCommands.map(command => command.data.toJSON());

const rest = new REST({ version: "10" }).setToken(
  process.env.DISCORD_TOKEN
);

try {
  console.log(`🔄 ${commands.length}개 명령어 등록 중...`);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );

  console.log("✅ 슬래시 명령어 등록 완료!");

  for (const command of commands) {
    console.log(`  /${command.name}`);
  }
} catch (error) {
  console.error("❌ 명령어 등록 실패:", error);
}
