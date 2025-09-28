import cron from "node-cron";
import { DateTime } from "luxon";
import { REGION_TO_TZ } from "./constants.js";
import { readBoard, writeBoard } from "./board.js";

export function startScheduler(client) {
  cron.schedule("* * * * *", async () => {
    try {
      const ctx = await readBoard(client);
      if (!ctx) return;
      const { msg: boardMsg, data: board } = ctx;
      const channel = boardMsg.channel;
      const nowUTC = DateTime.now();
      let mutated = false;

      for (const u of board.users) {
        const tz = REGION_TO_TZ[u.timzone];
        if (!tz || u.startHour == null) continue;

        const localNow = nowUTC.setZone(tz);
        const todayISO = localNow.toISODate();

        if (u.lastSentISO === todayISO) continue; // Set only one msg per a day
        if (localNow.minute !== 0) continue; // Exact time
        if (localNow.hour !== Number(u.startHour)) continue;

        const sent = await channel.send(
          `오늘의 체크✅️! <@${u.uid}> [${todayISO} ${localNow.hour} ${
            u.timezone
          }]\n🎯: ${u.goal ?? "null"}`
        );
        if (u.emoji) {
          try {
            await sent.react(u.emoji);
          } catch {}
        }

        u.lastSentISO = todayISO;
        u.lastMessageId = sent.id;
        mutated = true;
      }

      if (mutated) await writeBoard(boardMsg, board);
    } catch (e) {
      console.error("tickPerMinute ERROR:", e);
    }
  });
}
