const STORAGE_KEY = "scamShieldScanHistory";
const historyList = document.getElementById("historyList");
const emptyState = document.getElementById("emptyState");
const clearButton = document.getElementById("clearHistory");
const totalScans = document.getElementById("totalScans");
const highScans = document.getElementById("highScans");
const mediumScans = document.getElementById("mediumScans");
const lowScans = document.getElementById("lowScans");

function getHistory() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderHistory() {
  const history = getHistory();
  totalScans.textContent = history.length;
  highScans.textContent = history.filter(x => x.level === "high").length;
  mediumScans.textContent = history.filter(x => x.level === "medium").length;
  lowScans.textContent = history.filter(x => x.level === "low").length;
  historyList.replaceChildren();
  emptyState.hidden = history.length > 0;
  clearButton.disabled = history.length === 0;

  history.forEach(record => {
    const card = el("article", "history-item");
    const top = el("div", "item-top");
    const validLevel = ["high", "medium", "low"].includes(record.level) ? record.level : "low";
    const labels = { high: "HIGH RISK", medium: "MEDIUM RISK", low: "LOW DETECTED RISK" };
    top.append(
      el("span", `risk-badge risk-${validLevel}`, labels[validLevel]),
      el("span", "item-score", `Score: ${Number(record.score) || 0}/100`)
    );
    card.append(top, el("div", "item-message", record.message || "(Message unavailable)"));
    const date = new Date(record.date);
    card.append(el("div", "item-date", Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString()));

    if (Array.isArray(record.findings) && record.findings.length) {
      const reasons = record.findings.map(item => typeof item === "string" ? item : item?.reason || "").filter(Boolean);
      if (reasons.length) card.append(el("div", "item-findings", "⚠️ Warning signs: " + reasons.join(" • ")));
    }
    historyList.append(card);
  });
}

clearButton.addEventListener("click", () => {
  if (!getHistory().length) return;
  if (!window.confirm("Delete all saved scan history?")) return;
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
});

window.addEventListener("storage", event => {
  if (event.key === STORAGE_KEY) renderHistory();
});

renderHistory();
