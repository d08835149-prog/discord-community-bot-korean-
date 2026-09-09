import "dotenv/config";

import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
} from "discord.js";

import path from "path";
import { fileURLToPath } from "url";

import { loadCommands } from "./utils/loadCommands.js";
import { initDatabase } from "./database/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

await initDatabase();

const commandsPath = path.join(
  __dirname,
  "commands"
);

const commands =
  await loadCommands(commandsPath);

for (const command of commands) {
  client.commands.set(
    command.data.name,
    command
  );
}

client.once(
  Events.ClientReady,
  readyClient => {
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log(
      `✅ 로그인 완료: ${readyClient.user.tag}`
    );
    console.log(
      `📦 불러온 명령어: ${client.commands.size}개`
    );
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
  }
);

client.on(
  Events.InteractionCreate,
  async interaction => {
    if (!interaction.isChatInputCommand()) {
      return;
    }

    const command =
      client.commands.get(
        interaction.commandName
      );

    if (!command) {
      console.error(
        `❌ 명령어 없음: ${interaction.commandName}`
      );
      return;
    }

    try {
      await command.execute(interaction);

    } catch (error) {
      console.error(
        `❌ /${interaction.commandName} 실행 오류`,
        error
      );

      const errorMessage = {
        content:
          "❌ 명령어 실행 중 오류가 발생했습니다.",
        flags: MessageFlags.Ephemeral,
      };

      if (
        interaction.replied ||
        interaction.deferred
      ) {
        await interaction.followUp(
          errorMessage
        );
      } else {
        await interaction.reply(
          errorMessage
        );
      }
    }
  }
);

if (!process.env.DISCORD_TOKEN) {
  throw new Error(
    "❌ .env에 DISCORD_TOKEN이 없습니다."
  );
}

client.login(process.env.DISCORD_TOKEN);
