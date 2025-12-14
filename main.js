const API_URL = "https://twitch-last-stream.f1078987.workers.dev"; // 你的 Worker

let lastStreamTime;

async function init() {
  try {
    const res = await fetch(API_URL, { cache: "no-store" });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`API ${res.status}: ${txt}`);
    }
    const data = await res.json();

    if (!data.last_stream) {
      throw new Error(`API 回傳缺少 last_stream：${JSON.stringify(data)}`);
    }const API_URL = "https://twitch-last-stream.f1078987.workers.dev"; // ←換成你的

let mode = "offline";      // "live" | "offline"
let anchorTime = null;     // Date：LIVE 用 started_at、OFFLINE 用 last_stream
let info = null;

function fmt(diffMs){
  const s = Math.floor(diffMs / 1000) % 60;
  const m = Math.floor(diffMs / 60000) % 60;
  const h = Math.floor(diffMs / 3600000) % 24;
  const d = Math.floor(diffMs / 86400000);
  return `${d} 天 ${h} 小時 ${m} 分 ${s} 秒`;
}

async function init(){
  try{
    const res = await fetch(API_URL, { cache: "no-store" });
    const data = await res.json();
    info = data;

    // 套背景圖（用 offline_image_url）
    if (data.offline_image_url) {
      document.querySelector(".bg").style.backgroundImage = `url("${data.offline_image_url}")`;
    }

    // 頭像
    if (data.profile_image_url) {
      const avatar = document.getElementById("avatar");
      avatar.src = data.profile_image_url;
    }

    // 連結
    const link = document.getElementById("channelLink");
    link.href = `https://www.twitch.tv/${data.login || "rinashiry"}`;

    // 上方副標
    document.getElementById("subline").textContent =
      `實況主：${data.display_name || data.login || "rinashiry"}`;

    // 模式判斷
    if (data.is_live && data.started_at) {
      mode = "live";
      anchorTime = new Date(data.started_at);
      document.getElementById("status").textContent = "🟢 LIVE（開台中）";
      document.getElementById("statusDesc").textContent = "目前正在直播。";
      document.getElementById("timerLabel").textContent = "目前開台時數";
      document.getElementById("timerDesc").textContent = `開始時間：${new Date(data.started_at).toLocaleString()}`;
    } else {
      mode = "offline";
      if (!data.last_stream) throw new Error("API 沒有回 last_stream（可能沒有 VOD 或權限）");
      anchorTime = new Date(data.last_stream);
      document.getElementById("status").textContent = "🔴 OFFLINE（未開台）";
      document.getElementById("statusDesc").textContent = "目前沒有直播。";
      document.getElementById("timerLabel").textContent = "距離上次開台";
      document.getElementById("timerDesc").textContent = `上次直播：${new Date(data.last_stream).toLocaleString()}`;
    }

    tick();
    setInterval(tick, 1000);
  }catch(err){
    document.getElementById("status").textContent = "載入失敗";
    document.getElementById("timer").textContent = "—";
    document.getElementById("statusDesc").textContent = err.message;
    console.error(err);
  }
}

function tick(){
  const now = new Date();
  const diff = now - anchorTime;
  document.getElementById("timer").textContent = fmt(diff);
}

init();


    lastStreamTime = new Date(data.last_stream);
    update();
    setInterval(update, 1000);
  } catch (err) {
    document.getElementById("timer").textContent = `載入失敗：${err.message}`;
    console.error(err);
  }
}

function update() {
  const now = new Date();
  const diff = now - lastStreamTime;

  const s = Math.floor(diff / 1000) % 60;
  const m = Math.floor(diff / 60000) % 60;
  const h = Math.floor(diff / 3600000) % 24;
  const d = Math.floor(diff / 86400000);

  document.getElementById("timer").textContent =
    `${d} 天 ${h} 小時 ${m} 分 ${s} 秒`;
}

init();
