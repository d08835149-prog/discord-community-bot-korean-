import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

async function getJsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await getJsFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }

  return files;
}

export async function loadCommands(commandsPath) {
  const files = await getJsFiles(commandsPath);
  const commands = [];

  for (const file of files) {
    const command = await import(pathToFileURL(file).href);

    if (!command.data || !command.execute) {
      console.warn(`⚠️ 명령어 형식 오류: ${file}`);
      continue;
    }

    commands.push(command);
  }

  return commands;
}
