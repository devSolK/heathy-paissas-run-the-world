import { SlashCommandBuilder } from "discord.js";
import { getUser, deleteUser, writeBoard } from "../../board.js";

export const data = new SlashCommandBuilder()
  .setName("unregister")
  .setDescription("파이싸 나라를 떠나기");

export async function execute(itx, boardMsg, board) {
  const me = getUser(board, itx.user.id);
  if (!me) {
    await itx.reply({ content: "등록된 정보가 없어요!", flags: 64 });
    return;
  }
  deleteUser(board, itx.user.id);
  await writeBoard(boardMsg, board);
  await itx.reply({ content: "등록을 해제했어요!", flags: 64 });
}
