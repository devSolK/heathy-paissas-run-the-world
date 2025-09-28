import { SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("list")
  .setDescription("우리 멤버들을 소개하지!");

export async function execute(itx, _boardMsg, board) {
  if (!board.users.length) {
    await itx.reply({ content: "아무도 없는데!?", ephemeral: true });
    return;
  }
  const lines = ["건강한 파이싸들: "];
  for (const u of board.users) {
    lines.push(
      `- <@${u.uid}> | ${u.startHour ?? "-"}시~${u.endHour ?? "-"}시 | ${
        u.emoji ?? "-"
      } | ${u.goal ?? "-"} | ${u.timezone ?? "-"}`
    );
  }
  const text = lines.join("\n");
  await itx.reply({
    content:
      text.length <= 1800 ? text : lines.slice(0, 100).join("\n") + "\n…",
    ephemeral: true,
  });
}
