import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { countStatsFor } from "../../utils.js";

export const data = new SlashCommandBuilder()
  .setName("stats_all")
  .setDescription("이번주동안 우리 파이싸들이 뭘 했는지 볼까?")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(itx, _boardMsg, board) {
  const lines = ["최근 7일간의 점령일지:"];
  for (const u of board.users) {
    const s7 = countStatsFor(u, 7);
    successPercent = Math.ceil(s7.ok * 100) / s7.total;
    lines.push(
      `- <@${u.uid}> (${u.timezone || "-"}) : ✅ ${s7.ok} (${successPercent})%)`
    );
  }
  await itx.reply({ content: lines.join("\n"), ephemeral: true });
}
