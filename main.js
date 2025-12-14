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
    }

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
