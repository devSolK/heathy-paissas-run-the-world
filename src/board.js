// ==== Board ====
// @User😊 • 🎯 goal • 🕒 start~end • 📈 success rate (100%) • Timezone
// This board is used as the default registration data storage.

import { DateTime } from "luxon";
import { BOARD_MARKER, HISTORY_LIMIT } from "./constants.js";
import { countStatsFor } from "./utils.js";

// init

export function emptyBoardData() {
  return { users: [] };
}

let boardCache = { channelId: null, messageId: null };

// json
export function serializeBoard(obj) {
  return `${BOARD_MARKER}\n\`\`\`json\n${JSON.stringify(obj, null, 2)}\n\`\`\``;
}

export function parseBoard(content) {
  if (!content?.startsWith(BOARD_MARKER)) return null;
  const m = /```json\s*([\s\S]*?)\s*```/m.exec(content);
  if (!m) return null;
  try {
    const data = JSON.parse(m[1]);
    if (!Array.isArray(data.users)) return null;
    return data;
  } catch {
    return null;
  }
}

function formatUserLine(u) {
  const span = `${u.startHour ?? "-"}~${u.endHour ?? "-"}`;
  const s7 = countStatsFor(u, 7);
  const pct = s7.total ? Math.round((s7.ok * 100) / s7.total) : null;
  const stat = s7.total ? `📈 ${s7.ok}/${s7.total} (${pct}%)` : "📈 -";
  const goal = u.goal ? `🎯 ${u.goal}` : "";
  const emoji = u.emoji || " ";
  const timezone = u.timezone || "-";
  return [
    `<@${u.uid}>`,
    emoji,
    "•",
    goal,
    `🕒 ${span}`,
    "•",
    stat,
    "•",
    timezone,
  ]
    .filter(Boolean)
    .join(" ");
}

function paginateLinesToEmbeds(lines, baseTitle, metaLine, color = 0xf28b00) {
  const MAX = 3900; // buffer
  const embeds = [];
  let buf = [];
  let acc = 0;

  const pushEmbed = (title, desc) => {
    embeds.push({
      title,
      description: desc,
      color,
      footer: { text: "이 메세지를 지우면 모든 데이터가 사라져요!" },
    });
  };

  // Initial Embed
  let head = [metaLine, ""].join("\n"); // Meta
  for (const ln of lines.length
    ? lines
    : ["파이싸 모집 중! 우리 가게 정상 영업 합니다"]) {
    // length calculation
    const addLen = ln.length + 1;
    if (head.length + acc + addLen > MAX) {
      pushEmbed(
        embeds.length === 0 ? baseTitle : `${baseTitle} — CONTINUE`,
        head + buf.join("\n")
      );
      buf = [ln];
      acc = addLen;
      head = ""; // no meta after initial embed
    } else {
      buf.push(ln);
      acc += addLen;
    }
  }
  pushEmbed(
    embeds.length === 0 ? baseTitle : `${baseTitle} — END`,
    (head ? head : "") + buf.join("\n")
  );
  return embeds;
}

export function renderBoardEmbeds(board) {
  const order = { KST: 0, EST: 1, PST: 2 };
  const sorted = [...board.users].sort((a, b) => {
    const ra = a.timezone ?? "NNN",
      rb = b.timezone ?? "NNN";
    const oa = order[ra] ?? 99,
      ob = order[rb] ?? 99;
    if (oa !== ob) return oa - ob;
    const sa = a.startHour ?? 25,
      sb = b.startHour ?? 25;
    if (sa !== sb) return sa - sb;
    return String(a.uid).localeCompare(String(b.uid));
  });

  const lines = sorted.map(formatUserLine);

  // Meta
  const now = DateTime.now().toUTC();
  const chips = [
    "`" + `👥 ${board.users.length}` + "`",
    "`" + `📅 ${now.toFormat("yyyy-LL-dd")} UTC` + "`",
    "`" + `⏱️ updated ${now.toFormat("HH:mm")}` + "`",
  ].join("  ");

  return paginateLinesToEmbeds(lines, "Today's Check Board", chips);
}

// ==== Board IO ====
export async function getBoardMessage(client) {
  if (boardCache.channelId && boardCache.messageId) {
    try {
      const ch = await client.channels.fetch(boardCache.channelId);
      const msg = await ch.messages.fetch(boardCache.messageId);
      if (parseBoard(msg.content)) return msg;
    } catch {}
    boardCache = { channelId: null, messageId: null };
  }

  // Find pinned channel
  for (const [, guild] of client.guilds.cache) {
    const channels = await guild.channels.fetch();
    for (const [, ch] of channels) {
      if (!ch?.isTextBased?.() || ch.isThread()) continue;
      try {
        const pins = await ch.messages.fetchPins();
        if (pins && pins.size > 0) {
          const found = pins.find(
            (m) =>
              m.author?.id === client.user.id &&
              m.content.startsWith(BOARD_MARKER)
          );
          if (found && parseBoard(found.content)) {
            boardCache = { channelId: ch.id, messageId: found.id };
            return found;
          }
        }
      } catch {}
    }
  }
  return null;
}

export async function ensureBoardInChannel(channel) {
  let pins;
  try {
    pins = await channel.messages.fetchPins();
  } catch {
    pins = null;
  }

  let boardMsg = null;
  if (pins && pins.size > 0) {
    boardMsg = pins.find(
      (m) =>
        m.author?.id === channel.client.user.id &&
        m.content.startsWith(BOARD_MARKER)
    );
  }

  if (boardMsg && parseBoard(boardMsg.content)) {
    boardCache = { channelId: channel.id, messageId: boardMsg.id };
    const data = parseBoard(boardMsg.content);
    await boardMsg.edit({
      content: serializeBoard(data),
      embeds: renderBoardEmbeds(data),
    });
    return boardMsg;
  }

  const data = emptyBoardData();
  const created = await channel.send({
    content: serializeBoard(data),
    embeds: renderBoardEmbeds(data),
  });

  try {
    await created.pin();
  } catch {}

  boardCache = { channelId: channel.id, messageId: created.id };
  return created;
}

export async function readBoard(client) {
  const msg = await getBoardMessage(client);
  if (!msg) return null;
  const data = parseBoard(msg.content) || emptyBoardData();
  return { msg, data };
}

export async function writeBoard(msg, boardObj) {
  await msg.edit({
    content: serializeBoard(boardObj),
    embeds: renderBoardEmbeds(boardObj),
  });
}

// CRUD User
export function getUser(board, uid) {
  return board.users.find((u) => u.uid === uid);
}

export function upsertUser(board, uid, patch) {
  const idx = board.users.findIndex((u) => u.uid === uid);
  if (idx === -1) {
    board.users.push({
      uid,
      timezone: null,
      startHour: null,
      endHour: null,
      goal: null,
      emoji: null,
      lastSentISO: null,
      lastMessageId: null,
      lastAckISO: null,
      history: [],
      ...patch,
    });
  } else {
    const prev = board.users[idx];
    board.users[idx] = { ...prev, ...patch, history: prev.history || [] };
  }
}

export function deleteUser(board, uid) {
  const i = board.users.findIndex((u) => u.uid === uid);
  if (i >= 0) board.users.splice(i, 1);
}

export function isEmojiTaken(board, emoji, exceptUid = null) {
  return board.users.some((u) => u.emoji === emoji && u.uid !== exceptUid);
}

export function getOwnerByEmoji(board, emoji) {
  return board.users.find((u) => u.emoji === emoji);
}

export function pushHistoryOnce(user, dateISO, ok) {
  user.history = user.history || [];
  if (!user.history.find((h) => h.dateISO === dateISO)) {
    user.history.push({ dateISO, ok });
    if (user.history.length > HISTORY_LIMIT)
      user.history = user.history.slice(-HISTORY_LIMIT);
  }
}
