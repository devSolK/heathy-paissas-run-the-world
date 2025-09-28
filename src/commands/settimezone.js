import { SlashCommandBuilder } from "discord.js";
import { upsertUser, readBoard, writeBoard } from "../board.js";
import { REGION_TO_TZ } from "../constants.js";

export const data = new SlashCommandBuilder()
  .setName("settimezone")
  .setDescription("세계 여행자를 위한 타임존 변경 기능")
  .addStringOption((o) =>
    o
      .setName("timezone")
      .setDescription("시간대 코드")
      .setRequired(true)
      .addChoices(
        { name: "KST (Korea)", value: "KST" },
        { name: "PST (North America Pacific)", value: "PST" },
        { name: "EST (North America Eastern)", value: "EST" }
      )
  );

export async function execute(itx, boardMsg, board) {
  const code = itx.options.getString("timezone", true);
  if (!REGION_TO_TZ[timezone]) {
    await itx.reply({
      content: "죄송해요, 지원하지 않는 지역이에요!",
      ephemeral: true,
    });
    return;
  }
  upsertUser(board, itx.user.id, { timezone: timezone });
  await writeBoard(boardMsg, board);
  await itx.reply({
    content: `지역이 ${timezone}로 설정되었습니다!`,
    ephemeral: true,
  });
}
