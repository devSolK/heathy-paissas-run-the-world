import { SlashCommandBuilder } from "discord.js";
import { DateTime } from "luxon";
import { checkHour } from "../../utils.js";
import { REGION_TO_TZ } from "../../constants.js";
import { getUser, upsertUser, writeBoard, isEmojiTaken } from "../../board.js";

export const data = new SlashCommandBuilder()
  .setName("register")
  .setDescription(
    "매일 알람을 위해 시작/종료 시각, 목표, 이모지, 시간대를 등록합니다!"
  )
  .addIntegerOption((o) =>
    o
      .setName("start_hour")
      .setDescription("start hour (0-23)")
      .setRequired(true)
  )
  .addIntegerOption((o) =>
    o.setName("end_hour").setDescription("end hour (0-23)").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("goal").setDescription("what to accomplish!?").setRequired(true)
  )
  .addStringOption((o) =>
    o.setName("emoji").setDescription("좋아하는 emoji 있어?").setRequired(true)
  )
  .addStringOption((o) =>
    o
      .setName("timezone")
      .setDescription("KST / PST / EST")
      .addChoices(
        { name: "KST (한국)", value: "KST" },
        { name: "PST (North America Pacific)", value: "PST" },
        { name: "EST (North America Eastern)", value: "EST" }
      )
  );

export async function execute(itx, boardMsg, board) {
  // ==== Pursing Input (including test code) ====
  let startRaw, endRaw;
  try {
    startRaw = checkHour(itx.options.getInteger("start_hour", true));
    endRaw = checkHour(itx.options.getInteger("end_hour", true));
  } catch (e) {
    await itx.reply({
      content: e.message,
      flags: 64,
    });
    return;
  }

  const goal = itx.options.getString("goal", true).trim();
  const emoji = itx.options.getString("emoji", true).trim();
  const timezoneOp = itx.options.getString("timezone");

  if (emoji.length > 4) {
    await itx.reply({
      content: "emoji",
      flags: 64,
    });
    return;
  }
  if (isEmojiTaken(board, emoji, itx.user.id)) {
    await itx.reply({
      content: "이런, 이 이모지는 이미 다른 파이싸가 가져가버렸어!",
      flags: 64,
    });
    return;
  }

  // ==== Timezone Setting ====
  const current = getUser(board, itx.user.id);
  let timezone = current?.timezone || null;
  if (timezoneOp) {
    if (!REGION_TO_TZ[timezoneOp]) {
      await itx.reply({
        content: "Only KST/PST/EST supported. Sorry!",
        flags: 64,
      });
      return;
    }
    timezone = timezoneOp;
  }
  if (!timezone) {
    await itx.reply({
      content: "등록시, 시간대 옵션(KST/PST/EST)을 지정해 주세요.",
      flags: 64,
    });
    return;
  }

  // ==== Convert to UTC (if test code, ignore) ====
  const nowUTC = DateTime.now();
  const tz = REGION_TO_TZ[timezone];
  const localNow = nowUTC.setZone(tz);

  const startHour =
    startRaw === 77
      ? current?.startHour ?? localNow.hour // use the current time if no existing value
      : startRaw;

  const endHour =
    endRaw === 77
      ? current?.endHour ?? (startHour + 1) % 24 // + 1 if no existing value
      : endRaw;

  const testNow = startRaw === 77 || endRaw === 77;

  // ==== Save ====
  upsertUser(board, itx.user.id, {
    timezone: timezone,
    startHour,
    endHour,
    goal,
    emoji,
    lastSentISO: null,
    lastMessageId: null,
    lastAckISO: null,
  });
  console.log("After upsertUser, board users:", board.users.length);
  console.log(
    "User data:",
    board.users.find((u) => u.uid === itx.user.id)
  );

  await writeBoard(boardMsg, board);
  console.log("Board written to message");
  // ==== Response ====
  await itx.reply({
    content: [
      `등록 성공! ${startHour}시 ~ ${endHour} 시 사이에, ${goal}(을/를) 달성하면 ${emoji}를 눌러 알려주세요!`,
      "※ 하루 한 번만 인정됩니다!",
      testNow ? "< Test Mode Message. >" : "",
    ]
      .filter(Boolean)
      .join("\n"),
    flags: 64,
  });

  // ==== Test mode ====
  if (testNow) {
    const todayISO = localNow.toISODate();
    const u = getUser(board, itx.user.id);
    const sent = await boardMsg.channel.send(
      `오늘의 체크✅️ — <@${u.uid}> [${todayISO} ${
        localNow.hour
      } ${timezone}]\n🎯: ${u.goal ?? "(TEST)"}`
    );
    if (u.emoji) {
      try {
        await sent.react(u.emoji);
      } catch {}
    }
    u.lastMessageId = sent.id;
    await writeBoard(boardMsg, board);
  }
}
