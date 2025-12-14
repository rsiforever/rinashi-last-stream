"use strict";

const API_URL = "https://api.你的網域"; // 🔴 換成你現在用的 API

const CUSTOM_BG = "https://i.meee.com.tw/ilOcteV.png";

let anchorTime = null; // 計時基準時間

function fmt(ms) {
  const s = Math.floor(ms / 1000) % 60;
  const m = Math.floor(ms / 60000) % 60;
  const h = Math.floor(ms / 3600000) % 24;
  const d = Math.floor(ms / 86400000);
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
    setBg(CUSTOM_BG);

    const res = await fetch(API_URL, { cache: "no-store" });
    const data = await res.json();

    // 頭像
    if (data.profile_image_url) {
      document.getElementById("avatar").src = data.profile_image_url;
    }

    // 頻道連結
    document.getElementById("channelLink").href =
      `https://www.twitch.tv/${data.login}`;

    setText("subline", `實況主：${data.display_name}`);

    if (data.is_live && data.started_at) {
      // 🟢 LIVE：從開台時間算
      anchorTime = new Date(data.started_at);

      setText("status", "🟢 LIVE（開台中）");
      setText("statusDesc", "目前正在直播");
      setText("timerLabel", "目前開台時數");
      setText(
        "timerDesc",
        `開始時間：${new Date(data.started_at).toLocaleString()}`
      );

    } else if (data.ended_at) {
      // 🔴 OFFLINE：從「關台時間」算
      anchorTime = new Date(data.ended_at);

      setText("status", "🔴 OFFLINE（未開台）");
      setText("statusDesc", "目前沒有直播");
      setText("timerLabel", "距離上次關台");
      setText(
        "timerDesc",
        `關台時間：${new Date(data.ended_at).toLocaleString()}`
      );

    } else {
      throw new Error("API 尚未提供 ended_at（第一次啟用時正常）");
    }

    tick();
    setInterval(tick, 1000);

  } catch (e) {
    setText("status", "載入失敗");
    setText("statusDesc", e.message);
    console.error(e);
  }
}

function tick() {
  if (!anchorTime) return;
  setText("timer", fmt(Date.now() - anchorTime.getTime()));
}

// 永遠啟動
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
