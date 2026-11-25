
const urlInput = document.getElementById("urlInput");
const scanBtn = document.getElementById("scanBtn");
const clearBtn = document.getElementById("clearBtn");
const result = document.getElementById("result");
const resultTitle = document.getElementById("resultTitle");
const riskScore = document.getElementById("riskScore");
const resultSummary = document.getElementById("resultSummary");
const findings = document.getElementById("findings");
const meterFill = document.getElementById("meterFill");
const historyList = document.getElementById("historyList");
const clearHistory = document.getElementById("clearHistory");

const STORAGE_KEY = "scamShieldPhishingHistory";

function getHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveScan(item) {
  const history = getHistory();
  history.unshift(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
  renderHistory();
}

function renderHistory() {
  historyList.replaceChildren();
  const history = getHistory();

  if (!history.length) {
    const li = document.createElement("li");
    li.textContent = "No link scans yet.";
    historyList.appendChild(li);
    return;
  }

  history.forEach(item => {
    const li = document.createElement("li");
    li.textContent =
      `${item.time} — ${item.url} — ${item.level} risk (${item.score}/100)`;
    historyList.appendChild(li);
  });
}

function playBeep() {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;

    const ctx = new Audio();
    ctx.resume().then(() => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 880;
      gain.gain.value = 0.15;

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.4);
      oscillator.onended = () => ctx.close();
    }).catch(() => {});
  } catch (error) {
    console.warn("Audio unavailable", error);
  }
}

function scanURL(value) {
  let url;

  try {
    url = new URL(value);
  } catch {
    return { valid: false, message: "Enter a valid full URL, e.g. https://example.com" };
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    return { valid: false, message: "Only HTTP and HTTPS URLs are supported." };
  }

  if (url.username || url.password) {
    return {
      valid: false,
      message: "This URL contains embedded login credentials. Do not open it."
    };
  }

  let score = 0;
  const reasons = [];
  const host = url.hostname.toLowerCase();
  const text = (host + url.pathname + url.search).toLowerCase();

  function flag(points, reason) {
    score += points;
    reasons.push(reason);
  }

  if (url.protocol === "http:") {
    flag(10, "The link uses HTTP instead of encrypted HTTPS.");
  }

  if (host.split(".").some(part => part.startsWith("xn--"))) {
    flag(25, "The domain contains encoded international characters.");
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    flag(20, "The hostname is an IP address.");
  }

  if (host.length > 45) {
    flag(10, "The hostname is unusually long.");
  }

  if (host.split(".").length >= 5) {
    flag(10, "The URL contains many subdomains.");
  }

  if (/login|verify|password|wallet|banking|signin/.test(text)) {
    flag(15, "The URL contains account or login-related keywords.");
  }

  if (host.includes("-")) {
    flag(5, "The domain contains hyphens; verify its owner.");
  }

  if (url.href.length > 150) {
    flag(10, "The URL is unusually long.");
  }

  score = Math.min(score, 100);

  const level = score >= 50 ? "High" : score >= 25 ? "Medium" : "Low";

  if (!reasons.length) {
    reasons.push("No configured suspicious URL patterns were found. This does not prove safety.");
  }

  return { valid: true, url: url.href, score, level, reasons };
}

function showResult(data) {
  result.hidden = false;
  result.className = "result " +
    (data.level === "High" ? "danger" :
      data.level === "Medium" ? "warning" : "safe");

  resultTitle.textContent =
    data.level === "High" ? "🚨 High Risk — Suspicious Link" :
    data.level === "Medium" ? "⚠️ Medium Risk — Check Carefully" :
    "🟢 Low Risk — No Major Patterns Found";

  riskScore.textContent = data.score;
  meterFill.style.width = data.score + "%";
  meterFill.style.background =
    data.level === "High" ? "#ef4444" :
    data.level === "Medium" ? "#f59e0b" : "#22c55e";

  resultSummary.textContent =
    data.level === "High"
      ? "Avoid opening this link until independently verified."
      : data.level === "Medium"
      ? "Check the domain carefully before proceeding."
      : "Pattern-based screening only. The link may still be malicious.";

  findings.replaceChildren();

  data.reasons.forEach(reason => {
    const li = document.createElement("li");
    li.textContent = reason;
    findings.appendChild(li);
  });
}

scanBtn.addEventListener("click", () => {
  const value = urlInput.value.trim();

  if (!value) {
    alert("Please enter a URL.");
    return;
  }

  const data = scanURL(value);

  if (!data.valid) {
    result.hidden = false;
    result.className = "result warning";
    resultTitle.textContent = "Invalid URL";
    riskScore.textContent = "—";
    meterFill.style.width = "0";
    resultSummary.textContent = data.message;
    findings.replaceChildren();
    return;
  }

  showResult(data);

  if (data.level === "High") {
    playBeep();
  }

  saveScan({
    url: data.url,
    score: data.score,
    level: data.level,
    time: new Date().toLocaleString()
  });
});

clearBtn.addEventListener("click", () => {
  urlInput.value = "";
  result.hidden = true;
  urlInput.focus();
});

clearHistory.addEventListener("click", () => {
  if (confirm("Clear phishing scan history?")) {
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  }
});

urlInput.addEventListener("keydown", event => {
  if (event.key === "Enter") scanBtn.click();
});

renderHistory();
