"use strict";

// 1) 一定要放最上面，避免 before initialization
const API_URL = "https://twitch-last-stream.f1078987.workers.dev"; // ←換成你的 Worker

let anchorTime = null; // Date

function fmt(diffMs) {
  const s = Math.floor(diffMs / 1000) % 60;
  const m = Math.floor(diffMs / 60000) % 60;
  const h = Math.floor(diffMs / 3600000) % 24;
  const d = Math.floor(diffMs / 86400000);
  return `${d} 天 ${h} 小時 ${m} 分 ${s} 秒`;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setBg(url) {
  const bg = document.querySelector(".bg");
  if (bg && url) bg.style.backgroundImage = `url("${url}")`;
}

async function init() {
  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`API ${res.status}: ${txt}`);
    }
    const data = await res.json();

    // 背景 + 頭像 + 連結
    setBg(data.offline_image_url);

    const avatar = document.getElementById("avatar");
    if (avatar && data.profile_image_url) avatar.src = data.profile_image_url;

    const link = document.getElementById("channelLink");
    if (link) link.href = `https://www.twitch.tv/${data.login || "rinashiry"}`;

    setText("subline", `實況主：${data.display_name || data.login || "rinashiry"}`);

    // 直播狀態 & 計時模式
    if (data.is_live && data.started_at) {
      setText("status", "🟢 LIVE（開台中）");
      setText("statusDesc", "目前正在直播。");
      setText("timerLabel", "目前開台時數");
      setText("timerDesc", `開始時間：${new Date(data.started_at).toLocaleString()}`);
      anchorTime = new Date(data.started_at);
    } else {
      setText("status", "🔴 OFFLINE（未開台）");
      setText("statusDesc", "目前沒有直播。");
      setText("timerLabel", "距離上次開台");

      if (!data.last_stream) {
        throw new Error("API 沒有回 last_stream（可能沒有 VOD 或尚未更新）");
      }
      setText("timerDesc", `上次直播：${new Date(data.last_stream).toLocaleString()}`);
      anchorTime = new Date(data.last_stream);
    }

    // 開始每秒更新
    tick();
    setInterval(tick, 1000);
  } catch (err) {
    setText("status", "載入失敗");
    setText("statusDesc", err.message);
    setText("timer", "—");
    console.error(err);
  }
}

function tick() {
  if (!anchorTime) return;
  const diff = Date.now() - anchorTime.getTime();
  setText("timer", fmt(diff));
}

// 2) 一定放最後：等 DOM 好再跑
window.addEventListener("DOMContentLoaded", init);
