import * as setchannel from "./setchannel.js";
import * as settimezone from "./settimezone.js";
import * as register from "./register/register.js";
import * as unregister from "./register/unregister.js";
import * as list from "./list.js";
import * as stats from "./stats/stats.js";
import * as stats_all from "./stats/stats_all.js";
import {
  readBoard,
  writeBoard,
  ensureBoardInChannel,
  getUser,
  upsertUser,
  deleteUser,
  emptyBoardData,
  renderBoardEmbeds,
} from "../board.js";

export const definitions = [
  setchannel.data,
  settimezone.data,
  register.data,
  unregister.data,
  list.data,
  stats.data,
  stats_all.data,
];

const map = {
  setchannel,
  settimezone,
  register,
  unregister,
  list,
  stats,
  stats_all,
};

export async function handleInteraction(itx, client) {
  if (!itx.isChatInputCommand()) return;

  const name = itx.commandName;
  const mod = map[name];
  if (!mod) return;

  if (name === "setchannel") {
    await mod.execute(itx);
    return;
  }

  // Board Required
  const ctx = await readBoard(client);
  if (!ctx) {
    await itx.reply({
      content: "우선 우리가 점령할 채널에서 /setchannel 을 실행하라고!",
      ephemeral: true,
    });
    return;
  }
  const { msg: boardMsg, data: board } = ctx;
  await mod.execute(itx, boardMsg, board);
}
