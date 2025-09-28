import { SlashCommandBuilder } from "discord.js";
import { getUser } from "../../board.js";
import { countStatsFor } from "../../utils.js";

export const data = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("지난 30일간 어떻게 지냈는지 볼까?");

export async function execute(itx, _boardMsg, board) {
  const me = getUser(board, itx.user.id);
  if (!me) {
    await itx.reply({ content: "등록 이력이 없어요.", ephemeral: true });
    return;
  }
  const s7 = countStatsFor(me, 7);
  const s30 = countStatsFor(me, 30);
  successPercent = Math.ceil(s30.ok * 100) / s30.total;
  await itx.reply({
    content: [
      `한 달 동안의 성과를 살펴볼까요?`,
      `- 최근 30일: ✅️ ${s30.ok} (${successPercent}%)`,
    ].join("\n"),
    ephemeral: true,
  });
}
