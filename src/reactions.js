import { DateTime } from "luxon";
import { REGION_TO_TZ } from "./constants.js";
import { inWindowByHour } from "./utils.js";
import {
  readBoard,
  writeBoard,
  getOwnerByEmoji,
  pushHistoryOnce,
} from "./board.js";

export function setupReactionHandler(client) {
  client.on("messageReactionAdd", async (reaction, user) => {
    try {
      if (user.bot) return;
      if (reaction.partial) await reaction.fetch();
      if (reaction.message.partial) await reaction.message.fetch();

      const ctx = await readBoard(client);
      if (!ctx) return;
      const { msg: boardMsg, data: board } = ctx;

      const emoji = reaction.emoji.name;
      const owner = getOwnerByEmoji(board, emoji);

      console.log("Looking for emoji:", emoji);
      console.log(
        "Available users:",
        board.users.map((u) => ({ uid: u.uid, emoji: u.emoji }))
      );
      console.log("Found owner:", owner);
      // Delete if not registered
      if (!owner) {
        console.log("Emoji not registered, removing reaction");
        await reaction.users.remove(user.id).catch(() => {});
        return;
      }
      // Delete if emoji not for this user
      if (user.id !== owner.uid) {
        console.log("Wrong user for emoji, removing reaction");
        await reaction.users.remove(user.id).catch(() => {});
        return;
      }
      // Delete if not msg for today for this user
      if (!owner.lastMessageId || reaction.message.id !== owner.lastMessageId) {
        console.log("Wrong message ID, removing reaction");
        await reaction.users.remove(user.id).catch(() => {});
        return;
      }

      const tz = REGION_TO_TZ[owner.timezone];
      if (!tz) {
        console.log("Invalid timezone, removing reaction");
        await reaction.users.remove(user.id).catch(() => {});
        return;
      }

      const nowUTC = DateTime.now();
      const localNow = nowUTC.setZone(tz);
      const todayISO = localNow.toISODate();

      // Remove reaction if already checked
      if (owner.lastAckISO === todayISO) {
        console.log("Already checked today, removing reaction");
        await reaction.users.remove(user.id).catch(() => {});
        return;
      }

      const ok = inWindowByHour(
        nowUTC,
        Number(owner.startHour),
        Number(owner.endHour),
        tz
      );
      const timeStr = localNow.toFormat("HH:mm");

      await reaction.message.channel.send(
        ok
          ? `(${timeStr})에 완료했어요. 완벽해요! 내일도 오늘처럼만 합시다!`
          : `(${timeStr})에 완료했어요. 잘했어요, 하지만 시간 내로 할 수 있도록 노력해봅시다!`
      );

      owner.lastAckISO = todayISO;
      pushHistoryOnce(owner, todayISO, ok);

      await writeBoard(boardMsg, board);
    } catch (e) {
      console.error("Msg Reaction Error:", e);
    }
  });
}
