"use strict";

/* ===== 設定區 ===== */
const API_URL = "https://twitch-last-stream.f1078987.workers.dev";
const CUSTOM_BG = "https://i.meee.com.tw/ilOcteV.png";
/* ================= */

let anchorTime = null; // 計時起點（Date）
let mode = "offline"; // live | offline
let timerId = null;

/* ---------- 工具 ---------- */
function fmt(ms) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000) % 24;
  const d = Math.floor(ms / 86400000);
  return `${d} 天 ${h} 小時 ${m} 分 ${s} 秒`;
}

function $(id) {
  return document.getElementById(id);
}

function setBg(url) {
  const bg = document.querySelector(".bg");
  if (bg && url) bg.style.backgroundImage = `url("${url}")`;
}

/* ---------- 主流程 ---------- */
async function init() {
  try {
    setBg(CUSTOM_BG);

    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();

    // 基本資訊
    if ($("avatar") && data.profile_image_url) {
      $("avatar").src = data.profile_image_url;
    }
    if ($("subline")) {
      $("subline").textContent = `實況主：${data.display_name || data.login}`;
    }
    if ($("channelLink")) {
      $("channelLink").href = `https://www.twitch.tv/${data.login}`;
    }

    /* ===== 狀態判斷 ===== */

    // 🟢 LIVE：從開台時間開始計
    if (data.is_live && data.started_at) {
      mode = "live";
      anchorTime = new Date(data.started_at);

      $("status").textContent = "🟢 LIVE（開台中）";
      $("statusDesc").textContent = "目前正在直播。";

      $("timerLabel").textContent = "目前開台時數";
      $("timerDesc").textContent =
        `開始時間：${new Date(data.started_at).toLocaleString()}`;
    }

    // 🔴 OFFLINE：從「關台後」開始計
   else {
  mode = "offline";

  if (!data.ended_at) {
    throw new Error("找不到上次關台時間（ended_at）");
  }

  anchorTime = new Date(data.ended_at);

  $("status").textContent = "🔴 OFFLINE（未開台）";
  $("statusDesc").textContent = "目前沒有直播。";

  $("timerLabel").textContent = "距離上次關台";
  $("timerDesc").textContent =
    `關台時間：${new Date(data.ended_at).toLocaleString()}`;
}

    startTimer();

  } catch (err) {
    console.error(err);
    if ($("status")) $("status").textContent = "載入失敗";
    if ($("statusDesc")) $("statusDesc").textContent = err.message;
    if ($("timer")) $("timer").textContent = "—";
  }
}

/* ---------- 計時 ---------- */
function startTimer() {
  if (!anchorTime) return;
  if (timerId) clearInterval(timerId);

  tick();
  timerId = setInterval(tick, 1000);
}

function tick() {
  const diff = Date.now() - anchorTime.getTime();
  if ($("timer")) $("timer").textContent = fmt(diff);
}

/* ---------- 啟動 ---------- */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
