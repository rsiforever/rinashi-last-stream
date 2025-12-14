"use strict";

// 1) 一定要放最上面，避免 before initialization
const API_URL = "https://twitch-last-stream.f1078987.workers.dev"; // 你的 Worker
const CUSTOM_BG = "https://i.meee.com.tw/ilOcteV.png"; // 指定背景圖

let anchorTime = null;   // Date
let timerHandle = null;  // interval id
let mode = "idle";       // "live" | "offline" | "idle"

function fmt(diffMs) {
  // diffMs 可能會有負數（例如時區/資料錯誤），這裡保護一下
  diffMs = Math.max(0, diffMs);

  const s = Math.floor(diffMs / 1000) % 60;
  const m = Math.floor(diffMs / 60000) % 60;
  const h = Math.floor(diffMs / 3600000) % 24;
  const d = Math.floor(diffMs / 86400000);

  const pad2 = (n) => String(n).padStart(2, "0");
  return `${d} 天 ${pad2(h)} 小時 ${pad2(m)} 分 ${pad2(s)} 秒`;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setBg(url) {
  const bg = document.querySelector(".bg");
  if (bg && url) bg.style.backgroundImage = `url("${url}")`;
}

function toDateSafe(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

// 從 data 裡挑出「關台時間」：ended_at 最優先，沒有才退回其他可能欄位
function pickEndedAt(data) {
  const candidates = [
    data.ended_at,          // ✅ 建議 Worker 提供
    data.last_ended_at,      // 兼容其他命名
    data.last_stream_end,
    data.last_vod_ended_at,
    data.last_stream,        // 你原本的欄位（可能是開台 or 關台）
  ];

  for (const v of candidates) {
    const d = toDateSafe(v);
    if (d) return d;
  }
  return null;
}

// 從 data 裡挑出「開台時間」
function pickStartedAt(data) {
  const candidates = [
    data.started_at,
    data.stream_started_at,
    data.live_started_at,
  ];

  for (const v of candidates) {
    const d = toDateSafe(v);
    if (d) return d;
  }
  return null;
}

function stopTimer() {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
}

function startTimer() {
  stopTimer();
  tick();
  timerHandle = setInterval(tick, 1000);
}

async function init() {
  try {
    console.log("[main.js] init running");

    // 避免重複 init 造成多個 setInterval
    stopTimer();

    // 先套背景（不等 API）
    setBg(CUSTOM_BG);

    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`API ${res.status}: ${txt}`);
    }
    const data = await res.json();

    // 頭像
    const avatar = document.getElementById("avatar");
    if (avatar && data.profile_image_url) avatar.src = data.profile_image_url;

    // 頻道連結
    const link = document.getElementById("channelLink");
    if (link) link.href = `https://www.twitch.tv/${data.login || "rinashiry"}`;

    // 上方副標
    setText("subline", `實況主：${data.display_name || data.login || "rinashiry"}`);

    // 判斷直播狀態
    const isLive = !!data.is_live;

    if (isLive) {
      // 🟢 LIVE：從開始直播時間算「已開台多久」
      const startedAt = pickStartedAt(data);
      if (!startedAt) {
        throw new Error("API 顯示 is_live=true，但沒有回 started_at（或格式不正確）");
      }

      mode = "live";
      anchorTime = startedAt;

      setText("status", "🟢 LIVE（開台中）");
      setText("statusDesc", "目前正在直播。");
      setText("timerLabel", "目前開台時數");
      setText("timerDesc", `開始時間：${startedAt.toLocaleString()}`);

      startTimer();
      return;
    }

    // 🔴 OFFLINE：從「關台時間」算「距離上次關台」
    const endedAt = pickEndedAt(data);
    if (!endedAt) {
      throw new Error("API 沒有回 ended_at（關台時間）/ last_stream（備援欄位）");
    }

    mode = "offline";
    anchorTime = endedAt;

    setText("status", "🔴 OFFLINE（未開台）");
    setText("statusDesc", "目前沒有直播。");
    setText("timerLabel", "距離上次關台");
    setText("timerDesc", `上次關台：${endedAt.toLocaleString()}`);

    startTimer();

  } catch (err) {
    mode = "idle";
    anchorTime = null;
    stopTimer();

    setText("status", "載入失敗");
    setText("statusDesc", err?.message || String(err));
    setText("timerLabel", "計時");
    setText("timerDesc", "—");
    setText("timer", "—");

    console.error(err);
  }
}

function tick() {
  if (!anchorTime) return;

  const now = Date.now();
  const t = anchorTime.getTime();

  // LIVE / OFFLINE 都是「現在 - anchorTime」向上累加
  const diff = now - t;
  setText("timer", fmt(diff));
}

// 方便你 Console 手動測試 init()
window.init = init;

// 永遠會跑：DOMContentLoaded 前後都 OK
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
