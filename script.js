
"use strict";

/* ==========================================
   SCAMSHIELD — DASHBOARD FUNCTIONALITY
   Local rule-based educational prototype
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initSmsAnalyzer();
  initUrlAnalyzer();
  initQrScanner();
  initAttackSimulation();
});

/* ========== 1. MOBILE NAVIGATION ========== */

function initNavigation() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  if (!menuToggle || !navLinks) return;

  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ========== 2. SMS SCAM ANALYZER ========== */

function initSmsAnalyzer() {
  const input = document.getElementById("smsInput");
  const analyzeButton = document.getElementById("analyzeSms");
  const sampleButton = document.getElementById("smsSample");

  if (!input || !analyzeButton) return;

  const rules = [
    {
      phrases: [
        "account will be blocked",
        "account blocked",
        "account suspended",
        "kyc expired",
        "verify kyc",
        "update kyc",
        "verify your account",
        "account will be suspended",
        "खाता बंद",
        "केवाईसी अपडेट",
        "account band",
        "account band ho jayega",
        "kyc update karo"
      ],
      label: "Account or KYC pressure",
      points: 25
    },
    {
      phrases: [
        "urgent",
        "immediately",
        "act now",
        "limited time",
        "within 24 hours",
        "last warning",
        "urgent action",
        "तुरंत",
        "abhi karo",
        "jaldi karo"
      ],
      label: "Urgency or pressure language",
      points: 15
    },
    {
      phrases: [
        "click here",
        "verify now",
        "tap here",
        "open this link",
        "click below",
        "link kholo",
        "abhi click karo",
        "यहां क्लिक करें"
      ],
      label: "Instruction to open a link",
      points: 15
    },
    {
      phrases: [
        "otp",
        "one time password",
        "upi pin",
        "share your password",
        "send your password",
        "card details",
        "bank details",
        "cvv",
        "password batao",
        "otp batao",
        "otp share karo",
        "upi pin batao"
      ],
      label: "Sensitive information request",
      points: 30
    },
    {
      phrases: [
        "claim your prize",
        "you have won",
        "won a prize",
        "lottery winner",
        "processing fee",
        "claim reward",
        "free gift",
        "inaam jeeto",
        "prize claim karo",
        "fee pay karo"
      ],
      label: "Prize, reward or fee bait",
      points: 20
    },
    {
      phrases: [
        "send money",
        "payment required",
        "pay immediately",
        "transfer money",
        "refund fee",
        "paise bhejo",
        "turant payment"
      ],
      label: "Payment or money-transfer pressure",
      points: 20
    }
  ];

  if (sampleButton) {
    sampleButton.addEventListener("click", () => {
      input.value =
        "URGENT: Your bank account will be blocked today. " +
        "Verify KYC immediately using this link and share your OTP.";
      input.focus();
    });
  }

  analyzeButton.addEventListener("click", () => {
    const message = input.value.trim();

    if (!message) {
      input.focus();
      showInlineNotice(
        "smsResult",
        "Please enter a message before analysis."
      );
      return;
    }

    const normalized = normalizeText(message);
    const indicators = [];
    let score = 0;

    rules.forEach(rule => {
      const matched = rule.phrases.some(phrase =>
        normalized.includes(normalizeText(phrase))
      );

      if (matched) {
        score += rule.points;
        indicators.push(rule.label);
      }
    });

    // A URL is a clue, not proof that a message is fraudulent.
    if (/(https?:\/\/|www\.)/i.test(message)) {
      score += 10;
      indicators.push("Contains a web link");
    }

    score = Math.min(score, 100);

    let verdict;
    let advice;

    if (score >= 60) {
      verdict = "High number of suspicious indicators";
      advice =
        "Do not click the link or share credentials. Verify the claim " +
        "through the organisation's official app or website.";
    } else if (score >= 30) {
      verdict = "Several warning signs found";
      advice =
        "Be cautious. Check the sender and verify the request independently.";
    } else if (score > 0) {
      verdict = "Some warning signs found";
      advice =
        "Review the indicators below. A low score does not guarantee safety.";
    } else {
      verdict = "No configured phrases matched";
      advice =
        "This does not mean the message is safe. New and cleverly worded scams " +
        "may not match these rules.";
    }

    const result = document.getElementById("smsResult");
    result.classList.remove("hidden");

    setText("smsScore", score + "/100");
    setText("smsVerdict", verdict);
    setText("smsAdvice", advice);

    const scoreBar = document.getElementById("smsScoreBar");
    scoreBar.style.width = score + "%";
    scoreBar.style.background =
      score >= 60 ? "#ff7187" :
      score >= 30 ? "#ffbd70" : "#69e5a5";

    const list = document.getElementById("smsIndicators");
    list.replaceChildren();

    if (indicators.length === 0) {
      appendListItem(list, "No configured warning phrases matched.");
    } else {
      indicators.forEach(indicator => appendListItem(list, indicator));
    }
  });
}

/* ========== 3. URL STRUCTURAL INSPECTOR ========== */

function initUrlAnalyzer() {
  const input = document.getElementById("urlInput");
  const analyzeButton = document.getElementById("analyzeUrl");
  const sampleButton = document.getElementById("urlSample");

  if (!input || !analyzeButton) return;

  if (sampleButton) {
    sampleButton.addEventListener("click", () => {
      input.value = "http://secure-login.example.test/verify-account";
      input.focus();
    });
  }

  analyzeButton.addEventListener("click", () => {
    const rawUrl = input.value.trim();

    if (!rawUrl) {
      input.focus();
      showInlineNotice(
        "urlResultBox",
        "Please enter a URL before inspection."
      );
      return;
    }

    const result = document.getElementById("urlResultBox");
    result.classList.remove("hidden");

    const indicators = [];
    let score = 0;
    let parsed;

    // Do not fetch or open the submitted URL.
    try {
      const candidate = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(rawUrl)
        ? rawUrl
        : "https://" + rawUrl;

      parsed = new URL(candidate);

      if (!["http:", "https:"].includes(parsed.protocol)) {
        throw new Error("Unsupported protocol");
      }
    } catch {
      setText("urlScore", "—");
      setText("urlVerdict", "Invalid or unsupported URL");
      setText(
        "urlAdvice",
        "Enter a valid HTTP or HTTPS web address. This tool does not open it."
      );
      document.getElementById("urlScoreBar").style.width = "0%";
      document.getElementById("urlIndicators").replaceChildren();
      appendListItem(
        document.getElementById("urlIndicators"),
        "URL format could not be parsed."
      );
      return;
    }

    const hostname = parsed.hostname.toLowerCase();
    const fullText = (hostname + parsed.pathname + parsed.search).toLowerCase();

    if (parsed.protocol !== "https:") {
      score += 15;
      indicators.push("URL does not use HTTPS");
    }

    if (parsed.username || parsed.password) {
      score += 25;
      indicators.push("URL contains user-information fields");
    }

    if (hostname.startsWith("xn--") || hostname.includes(".xn--")) {
      score += 20;
      indicators.push("Internationalised domain encoding needs review");
    }

    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
      score += 20;
      indicators.push("Host is written as an IP address");
    }

    if (hostname.split(".").length >= 5) {
      score += 10;
      indicators.push("Unusually many subdomain levels");
    }

    if ((hostname.match(/-/g) || []).length >= 3) {
      score += 10;
      indicators.push("Multiple hyphens in the hostname");
    }

    const suspiciousTerms = [
      "verify-account",
      "login",
      "secure",
      "update-kyc",
      "account-verify",
      "password",
      "wallet",
      "claim-prize",
      "free-gift",
      "urgent",
      "signin",
      "banking"
    ];

    if (suspiciousTerms.some(term => fullText.includes(term))) {
      score += 15;
      indicators.push("Contains a term often used in impersonation links");
    }

    if (hostname.length > 35) {
      score += 10;
      indicators.push("Unusually long hostname");
    }

    score = Math.min(score, 100);

    let verdict;
    let advice;

    if (score >= 50) {
      verdict = "Multiple structural warning signs";
      advice =
        "Do not open this link just to test it. Visit the organisation's " +
        "official website by typing its address yourself.";
    } else if (score >= 20) {
      verdict = "Review this URL carefully";
      advice =
        "Some structural indicators need attention. This is not a reputation check.";
    } else {
      verdict = "Few configured structural indicators";
      advice =
        "This is not a safety certificate. A malicious URL may look completely normal.";
    }

    // Explicitly mark test-only domains in the simulator's example.
    if (
      hostname === "example.test" ||
      hostname.endsWith(".example.test")
    ) {
      indicators.push("Uses a reserved example/test domain");
    }

    setText("urlScore", score + "/100");
    setText("urlVerdict", verdict);
    setText("urlAdvice", advice);

    const scoreBar = document.getElementById("urlScoreBar");
    scoreBar.style.width = score + "%";
    scoreBar.style.background =
      score >= 50 ? "#ff7187" :
      score >= 20 ? "#ffbd70" : "#69e5a5";

    const list = document.getElementById("urlIndicators");
    list.replaceChildren();

    if (indicators.length === 0) {
      appendListItem(list, "No configured structural indicators matched.");
    } else {
      indicators.forEach(indicator => appendListItem(list, indicator));
    }
  });
}

/* ========== 4. QR IMAGE DECODER ========== */

function initQrScanner() {
  const fileInput = document.getElementById("qrFile");
  const canvas = document.getElementById("qrCanvas");
  const result = document.getElementById("qrResult");

  if (!fileInput || !canvas || !result) return;

  const context = canvas.getContext("2d", {
    willReadFrequently: true
  });

  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];

    result.classList.remove("hidden");
    result.replaceChildren();

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      result.textContent = "Please choose an image file.";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      result.textContent = "Image is too large. Please choose one under 10 MB.";
      return;
    }

    if (typeof window.jsQR !== "function") {
      result.textContent =
        "QR decoding library did not load. Check your internet connection and reload.";
      return;
    }

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      try {
        const maxDimension = 1600;
        const scale = Math.min(
          1,
          maxDimension / Math.max(image.naturalWidth, image.naturalHeight)
        );

        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const imageData = context.getImageData(
          0, 0, canvas.width, canvas.height
        );

        const decoded = window.jsQR(
          imageData.data,
          imageData.width,
          imageData.height
        );

        if (!decoded) {
          result.textContent =
            "No QR code was detected. Try a clearer, well-lit image.";
          return;
        }

        const heading = document.createElement("strong");
        heading.textContent = "QR content decoded";
        result.appendChild(heading);

        const content = document.createElement("p");
        content.textContent = decoded.data;
        result.appendChild(content);

        const candidate = getWebUrl(decoded.data);

        if (candidate) {
          const details = inspectUrlText(candidate);
          const summary = document.createElement("p");
          summary.textContent =
            "Local URL check: " + details.summary +
            ". This is a structural check, not proof of safety.";
          result.appendChild(summary);

          const link = document.createElement("a");
          link.href = "#analyzers";
          link.textContent = "Copy URL to URL Inspector";

          link.addEventListener("click", event => {
            event.preventDefault();
            const urlInput = document.getElementById("urlInput");
            urlInput.value = candidate;
            urlInput.focus();
            document.getElementById("analyzeUrl").click();
          });

          result.appendChild(link);
        } else {
          const note = document.createElement("p");
          note.textContent =
            "The decoded content is not a recognised HTTP/HTTPS URL. " +
            "Review it before taking action.";
          result.appendChild(note);
        }
      } catch {
        result.textContent = "Could not decode this image.";
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      result.textContent = "Unable to read this image file.";
    };

    image.src = objectUrl;
  });
}

/* ========== 5. ATTACK FLOW SIMULATION ========== */

function initAttackSimulation() {
  const simulator = document.getElementById("attack-simulator");
  if (!simulator) return;

  const stages = [
    ...simulator.querySelectorAll(".attack-stage")
  ];
  const progress = document.getElementById("attackProgress");
  const caption = document.getElementById("simCaption");
  const play = document.getElementById("simPlay");
  const pause = document.getElementById("simPause");
  const replay = document.getElementById("simReplay");

  if (!stages.length || !play || !pause || !replay) return;

  const messages = [
    "STEP 1 / 4 — A suspicious message tries to create urgency.",
    "STEP 2 / 4 — A fake page imitates a trusted service.",
    "STEP 3 / 4 — Entering details could expose sensitive information.",
    "STEP 4 / 4 — Recognise the warning signs and verify independently."
  ];

  let current = 0;
  let timer = null;

  function showStage(index) {
    current = Math.max(0, Math.min(index, stages.length - 1));

    stages.forEach((stage, i) => {
      stage.classList.toggle("active", i === current);
      stage.setAttribute(
        "aria-current",
        i === current ? "step" : "false"
      );
    });

    if (progress) {
      const percentage =
        stages.length > 1
          ? (current / (stages.length - 1)) * 78
          : 100;

      progress.style.width = percentage + "%";
    }

    if (caption) {
      caption.textContent = messages[current] || "";
    }
  }

  function stopAnimation() {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function startAnimation() {
    stopAnimation();

    if (current >= stages.length - 1) {
      showStage(0);
    }

    timer = window.setInterval(() => {
      if (current >= stages.length - 1) {
        stopAnimation();
        return;
      }

      showStage(current + 1);
    }, 3200);
  }

  play.addEventListener("click", startAnimation);

  pause.addEventListener("click", stopAnimation);

  replay.addEventListener("click", () => {
    stopAnimation();
    showStage(0);
    startAnimation();
  });

  // Pause while the page is hidden.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAnimation();
  });

  showStage(0);
  startAnimation();
}

/* ========== 6. SHARED HELPERS ========== */

function normalizeText(value) {
  return String(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function appendListItem(list, value) {
  const item = document.createElement("li");
  item.textContent = value;
  list.appendChild(item);
}

function showInlineNotice(containerId, message) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.classList.remove("hidden");
  container.replaceChildren();

  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  container.appendChild(paragraph);
}

function getWebUrl(value) {
  const raw = String(value || "").trim();

  try {
    const candidate = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(raw)
      ? raw
      : "https://" + raw;

    const parsed = new URL(candidate);

    if (
      ["http:", "https:"].includes(parsed.protocol) &&
      parsed.hostname.includes(".")
    ) {
      return parsed.href;
    }
  } catch {
    return null;
  }

  return null;
}

function inspectUrlText(value) {
  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    return { summary: "invalid URL" };
  }

  const warnings = [];

  if (parsed.protocol !== "https:") {
    warnings.push("non-HTTPS");
  }

  if (parsed.username || parsed.password) {
    warnings.push("embedded user information");
  }

  if (parsed.hostname.split(".").length >= 5) {
    warnings.push("many subdomains");
  }

  if (/xn--/i.test(parsed.hostname)) {
    warnings.push("internationalised domain encoding");
  }

  return {
    summary: warnings.length
      ? warnings.join(", ")
      : "few configured structural indicators"
  };
}
