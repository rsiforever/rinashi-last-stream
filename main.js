const API_URL = "https://twitch-last-stream.f1078987.workers.dev"; // 換成你的 Worker URL

let lastStreamTime;

async function init() {
  const res = await fetch(API_URL);
  const data = await res.json();

  lastStreamTime = new Date(data.last_stream);

  update();
  setInterval(update, 1000);
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
