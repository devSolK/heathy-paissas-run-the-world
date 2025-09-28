import { DateTime } from "luxon";
import { REGION_TO_TZ } from "./constants.js";

export function checkHour(n) {
  const hour = Number(n);
  if (!Number.isInteger(hour)) {
    throw new Error("시각은 0~23 사이의 정수여야 합니다.");
  }
  if (hour === 77) return 77; // test code
  if (hour >= 0 && hour <= 23) return hour;
  throw new Error("시각은 0~23 사이의 정수여야 합니다.");
}

// Hourly Basis
export function inWindowByHour(nowUTC, startHour, endHour, tz) {
  const localNow = nowUTC.setZone(tz);
  const hour = localNow.hour;
  if (endHour === startHour) {
    return hour === startHour;
  } else if (endHour < startHour) {
    return hour >= startHour || hour < endHour;
  } else {
    return hour >= startHour && hour < endHour;
  }
}

// Personal Stats Summary
export function countStatsFor(user, days, nowUTC = DateTime.now()) {
  const tz = REGION_TO_TZ[user.timezone];
  if (!tz || !user.history?.length) {
    // no record
    return {
      ok: 0,
      fail: 0,
      total: 0,
    };
  } else {
    const localNow = nowUTC.setZone(tz).startOf("day");
    const startDay = localNow.minus({ days: days - 1 });
    let ok = 0,
      fail = 0;
    for (const h of user.history) {
      const d = DateTime.fromISO(h.dateISO, { zone: tz }).startOf("day");
      if (d < startDay) continue;
      if (h.ok) {
        ok++;
      } else {
        fail++;
      }
    }
    return { ok, fail, total: ok + fail };
  }
}
