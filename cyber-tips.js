const searchInput = document.getElementById("tipSearch");
const tipsGrid = document.getElementById("tipsGrid");
const tipCount = document.getElementById("tipCount");
const noResults = document.getElementById("noResults");
const cards = Array.from(tipsGrid.querySelectorAll(".tip"));

const STORAGE_KEY = "scamShieldReadCyberTips";
function getReadTips() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
let readTips = getReadTips();

cards.forEach((card, index) => {
  const id = String(index + 1);
  const button = card.querySelector(".read-btn");
  card.dataset.tipId = id;

  function updateReadState(isRead) {
    card.classList.toggle("is-read", isRead);
    button.textContent = isRead ? "✅ Read — click to undo" : "Mark as read ✓";
    button.setAttribute("aria-pressed", String(isRead));
  }

  updateReadState(readTips.includes(id));
  button.addEventListener("click", () => {
    if (readTips.includes(id)) {
      readTips = readTips.filter(item => item !== id);
      updateReadState(false);
    } else {
      readTips.push(id);
      updateReadState(true);
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readTips));
    } catch (error) {
      console.warn("Could not save reading progress", error);
    }
    filterTips();
  });
});

function filterTips() {
  const query = searchInput.value.trim().toLowerCase();
  let visible = 0;
  cards.forEach(card => {
    const text = (card.textContent + " " + (card.dataset.keywords || "")).toLowerCase();
    const matches = text.includes(query);
    card.hidden = !matches;
    if (matches) visible++;
  });
  noResults.hidden = visible !== 0;
  const readCount = cards.filter(card => card.classList.contains("is-read")).length;
  tipCount.textContent = `${visible} tips shown · ${readCount} of ${cards.length} read`;
}
searchInput.addEventListener("input", filterTips);
filterTips();
