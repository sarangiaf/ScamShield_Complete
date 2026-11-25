
"use strict";

const $ = (selector) => document.querySelector(selector);

const cards = document.querySelectorAll(".incident-card");
const questionsSection = $("#questions-section");
const planSection = $("#plan-section");
const form = $("#incident-form");
const fields = $("#question-fields");
const checklist = $("#checklist");
const summaryBox = $("#summary");
const toast = $("#toast");

let selectedIncident = null;
let currentSummary = "";
let currentSteps = [];

/* INCIDENT DATA */

const incidents = {
  otp: {
    name: "OTP / Credential Sharing",
    intro: "Tell us what you shared and whether your account or money may be affected.",

    questions: [
      {
        id: "credential",
        label: "What did you share?",
        type: "select",
        required: true,
        options: [
          ["otp", "OTP / Verification code"],
          ["upi", "UPI PIN"],
          ["password", "Password"],
          ["card", "Card details / CVV"],
          ["other", "Something else"]
        ]
      },
      {
        id: "target",
        label: "Which account or service?",
        type: "text",
        placeholder: "e.g. bank, email or UPI app",
        required: true
      },
      {
        id: "money",
        label: "Was money debited?",
        type: "select",
        required: true,
        options: [
          ["no", "No / not sure"],
          ["yes", "Yes"]
        ]
      },
      {
        id: "access",
        label: "Can you access the account?",
        type: "select",
        required: true,
        options: [
          ["yes", "Yes"],
          ["no", "No"],
          ["unsure", "Not sure"]
        ]
      }
    ],

    steps: (a) => [
      "Stop communicating with the suspicious caller or sender. Never share another OTP, PIN, password or screen-sharing access.",

      a.money === "yes"
        ? "Contact your bank/payment provider immediately through its official app or verified contact details. Report the unauthorised transaction and ask how to block further activity."
        : "If a bank or payment account may be exposed, contact the provider using official contact details and ask what protection is needed.",

      a.credential === "upi"
        ? "If your UPI PIN was exposed, change it using the official UPI app and contact your provider if you suspect unauthorised access."
        : "Change the exposed password or credential through the official service. If the password was reused elsewhere, change it there too.",

      "Review recent transactions, login activity, linked devices and recovery details.",

      "If financial cyber fraud occurred, call India's cyber-fraud helpline 1930 promptly and report it at cybercrime.gov.in.",

      "Preserve messages, phone numbers, transaction IDs, timestamps and screenshots."
    ]
  },

  payment: {
    name: "UPI / Payment Fraud",
    intro: "Financial fraud needs quick action. Contact your bank immediately if money has been taken.",

    questions: [
      {
        id: "money",
        label: "What happened?",
        type: "select",
        required: true,
        options: [
          ["debited", "Money was debited"],
          ["pending", "Transaction is pending"],
          ["request", "I approved a payment request / QR"],
          ["details", "I shared payment details"]
        ]
      },
      {
        id: "amount",
        label: "Approximate amount (₹)",
        type: "number",
        placeholder: "e.g. 2500"
      },
      {
        id: "when",
        label: "When did it happen?",
        type: "select",
        required: true,
        options: [
          ["recent", "Just now / within an hour"],
          ["today", "Earlier today"],
          ["older", "More than a day ago"],
          ["unsure", "Not sure"]
        ]
      },
      {
        id: "provider",
        label: "Bank / UPI app",
        type: "text",
        placeholder: "Optional"
      }
    ],

    steps: (a) => [
      "Contact your bank and payment app immediately through official contact details. Report the suspected fraud and request a complaint/reference number.",

      "For suspected financial cyber fraud in India, call 1930 as soon as possible and submit a complaint at cybercrime.gov.in.",

      "Never send more money to reverse a payment or recover stolen funds. Beware of recovery-fee scams.",

      "Save the transaction ID / UTR / RRN, amount, time, beneficiary details, messages and screenshots.",

      "Secure your bank and UPI account. Change exposed credentials and follow your provider's advice on blocking or restricting access.",

      "If the transaction is pending, verify its status through your official bank or payment app."
    ]
  },

  link: {
    name: "Suspicious Link",
    intro: "Opening a link does not always compromise a device. Tell us whether you entered information or installed anything.",

    questions: [
      {
        id: "action",
        label: "What did you do?",
        type: "select",
        required: true,
        options: [
          ["opened", "Only opened the page"],
          ["entered", "Entered a password / OTP / card details"],
          ["downloaded", "Downloaded or installed a file/app"],
          ["permissions", "Allowed permissions / screen sharing"],
          ["payment", "Made a payment"]
        ]
      },
      {
        id: "device",
        label: "Which device did you use?",
        type: "select",
        required: true,
        options: [
          ["phone", "Phone"],
          ["computer", "Laptop / computer"],
          ["other", "Other"]
        ]
      },
      {
        id: "account",
        label: "Did you log in to an account?",
        type: "select",
        required: true,
        options: [
          ["no", "No"],
          ["yes", "Yes"],
          ["unsure", "Not sure"]
        ]
      }
    ],

    steps: (a) => [
      "Close the page and do not open the link again. Avoid entering more information.",

      a.action === "downloaded"
        ? "Do not open the downloaded file. Check for unfamiliar apps or downloads and use your device's trusted security tools."
        : "Review recent downloads and installed apps for anything unfamiliar.",

      a.action === "permissions"
        ? "End unfamiliar screen-sharing sessions and revoke suspicious permissions. If a remote-access app was installed, get help removing it using a trusted device."
        : "Review browser and site permissions and remove anything you do not recognise.",

      a.action === "entered" || a.account === "yes"
        ? "From a trusted device, change exposed passwords, enable multi-factor authentication and sign out other sessions."
        : "Watch for unusual account activity and secure any account that appears affected.",

      a.action === "payment"
        ? "Contact your bank/payment provider immediately. If financial cyber fraud occurred, call 1930 promptly and report at cybercrime.gov.in."
        : "If you notice an unauthorised debit, contact your bank immediately and call 1930 promptly.",

      "Preserve the suspicious URL, sender details, message and screenshots."
    ]
  },

  account: {
    name: "Account Compromise",
    intro: "Tell us which account was affected and whether you still have access.",

    questions: [
      {
        id: "type",
        label: "Which account was affected?",
        type: "select",
        required: true,
        options: [
          ["email", "Email"],
          ["social", "Social media / messaging"],
          ["bank", "Bank / payment"],
          ["work", "Work / college"],
          ["other", "Other"]
        ]
      },
      {
        id: "access",
        label: "Can you still log in?",
        type: "select",
        required: true,
        options: [
          ["yes", "Yes"],
          ["no", "No"],
          ["sometimes", "Sometimes / access changed"]
        ]
      },
      {
        id: "money",
        label: "Any unauthorised financial activity?",
        type: "select",
        required: true,
        options: [
          ["no", "No / not noticed"],
          ["yes", "Yes"],
          ["unsure", "Not sure"]
        ]
      }
    ],

    steps: (a) => [
      a.access === "yes"
        ? "Change your password through the official service, enable multi-factor authentication and sign out unfamiliar sessions."
        : "Use the official account-recovery process immediately. Secure the linked email account and phone number too.",

      "Review recent logins, recovery email/phone, connected apps, devices and forwarding settings.",

      "Remove unfamiliar sessions and revoke suspicious app access.",

      "Warn your contacts if the compromised account may be sending messages or payment requests.",

      a.money === "yes" || a.type === "bank"
        ? "Contact your bank/payment provider immediately. If financial cyber fraud occurred, call 1930 promptly and report at cybercrime.gov.in."
        : "Contact the platform's official support or your organisation's IT/security team if needed.",

      "Keep screenshots of alerts, suspicious activity and support reference numbers."
    ]
  },

  job: {
    name: "Suspected Fake Job Offer",
    intro: "Fake recruiters may demand fees, personal documents or remote access. Tell us what happened.",

    questions: [
      {
        id: "demand",
        label: "What did they ask you to do?",
        type: "select",
        required: true,
        options: [
          ["fee", "Pay a fee / deposit"],
          ["documents", "Send identity or bank documents"],
          ["task", "Complete tasks / invest money"],
          ["app", "Install an app / share screen"],
          ["none", "Nothing yet"]
        ]
      },
      {
        id: "paid",
        label: "Did you pay any money?",
        type: "select",
        required: true,
        options: [
          ["no", "No"],
          ["yes", "Yes"],
          ["multiple", "Paid more than once"]
        ]
      },
      {
        id: "data",
        label: "Did you share sensitive information?",
        type: "select",
        required: true,
        options: [
          ["no", "No"],
          ["yes", "Yes"],
          ["unsure", "Not sure"]
        ]
      },
      {
        id: "company",
        label: "Company / recruiter name",
        type: "text",
        placeholder: "Optional"
      }
    ],

    steps: (a) => [
      "Pause communication and do not pay registration fees, deposits or charges to unlock a job or recover money.",

      "Verify the vacancy through the company's official careers website and independently found contact details.",

      a.paid !== "no"
        ? "Contact your bank/payment provider immediately. For suspected financial cyber fraud, call 1930 promptly and report at cybercrime.gov.in."
        : "Do not transfer money. Preserve the offer and report the suspicious recruiter on the relevant platform.",

      a.data === "yes"
        ? "If you shared passwords, OTPs or bank credentials, change exposed credentials and contact the relevant provider."
        : "Avoid sharing additional identity documents, OTPs, UPI PINs or passwords until the employer is verified.",

      a.demand === "app"
        ? "End remote access, check installed apps and revoke unfamiliar permissions. Secure accounts from a trusted device."
        : "Monitor accounts for suspicious activity and preserve relevant messages.",

      "Keep the offer letter, recruiter details, chat history, website links and payment receipts."
    ]
  }
};

/* CREATE QUESTION FIELDS */

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function renderQuestion(question) {
  const fullWidth =
    question.id === "target" ||
    question.id === "company";

  let control;

  if (question.type === "select") {
    const options = question.options.map(([value, label]) =>
      `<option value="${escapeHTML(value)}">${escapeHTML(label)}</option>`
    ).join("");

    control = `
      <select id="${question.id}" name="${question.id}"
        ${question.required ? "required" : ""}>
        <option value="">Choose an option</option>
        ${options}
      </select>`;
  } else {
    control = `
      <input
        id="${question.id}"
        name="${question.id}"
        type="${question.type}"
        placeholder="${escapeHTML(question.placeholder || "")}"
        ${question.required ? "required" : ""}
        ${question.type === "number" ? 'min="0" step="0.01"' : ""}
      >`;
  }

  return `
    <div class="field ${fullWidth ? "full" : ""}">
      <label for="${question.id}">
        ${escapeHTML(question.label)}
        ${question.required ? "<span>*</span>" : ""}
      </label>
      ${control}
    </div>`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  window.setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

function scrollToSection(section) {
  section.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

/* INCIDENT SELECTION */

cards.forEach((card) => {
  card.addEventListener("click", () => {
    selectedIncident = card.dataset.incident;

    cards.forEach((item) => {
      item.classList.toggle("selected", item === card);
    });

    const incident = incidents[selectedIncident];

    $("#question-intro").textContent = incident.intro;

    fields.innerHTML = incident.questions
      .map(renderQuestion)
      .join("");

    questionsSection.classList.remove("hidden");
    planSection.classList.add("hidden");

    scrollToSection(questionsSection);
  });
});

/* READ USER ANSWERS */

function getAnswers(incident) {
  const answers = {};

  incident.questions.forEach((question) => {
    const input = form.elements.namedItem(question.id);
    answers[question.id] = input ? input.value.trim() : "";
  });

  return answers;
}

/* INCIDENT SUMMARY */

function buildSummary(incident, answers, steps) {
  const lines = [
    "SCAMSHIELD - CYBER INCIDENT SUMMARY",
    "Generated: " + new Date().toLocaleString(),
    "Incident: " + incident.name,
    "",
    "USER-PROVIDED DETAILS"
  ];

  incident.questions.forEach((question) => {
    const answer = answers[question.id];

    if (!answer) return;

    const selectedOption = question.options?.find(
      ([value]) => value === answer
    );

    lines.push(
      question.label + ": " +
      (selectedOption ? selectedOption[1] : answer)
    );
  });

  lines.push("", "RECOMMENDED ACTION CHECKLIST");

  steps.forEach((step, index) => {
    lines.push(`${index + 1}. [ ] ${step}`);
  });

  lines.push(
    "",
    "OFFICIAL REPORTING",
    "India financial cyber-fraud helpline: 1930",
    "National Cyber Crime Reporting Portal: https://cybercrime.gov.in/",
    "",
    "This is a guidance summary. It is not an official complaint",
    "and does not confirm that an account or transaction is secured."
  );

  return lines.join("\n");
}

/* GENERATE ACTION PLAN */

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!selectedIncident) return;

  const incident = incidents[selectedIncident];
  const answers = getAnswers(incident);

  currentSteps = incident.steps(answers);

  const isFinancialRisk =
    selectedIncident === "payment" ||
    answers.money === "yes" ||
    answers.money === "debited" ||
    answers.money === "request" ||
    answers.paid === "yes" ||
    answers.paid === "multiple" ||
    answers.action === "payment";

  const banner = $("#priority-banner");
  const priorityLabel = $("#priority-label");

  if (isFinancialRisk) {
    priorityLabel.textContent = "URGENT: FINANCIAL RISK";
    banner.classList.add("urgent");

    banner.textContent =
      "Priority: Contact your bank/payment provider immediately. " +
      "For suspected financial cyber fraud in India, call 1930 promptly " +
      "and report at cybercrime.gov.in. Do not delay urgent reporting.";
  } else {
    priorityLabel.textContent = "PRIORITY ACTIONS";
    banner.classList.remove("urgent");

    banner.textContent =
      "Priority: Stop further interaction, secure exposed accounts " +
      "from a trusted device and preserve evidence. If you notice an " +
      "unauthorised debit, contact your bank and call 1930 promptly.";
  }

  checklist.innerHTML = currentSteps.map((step, index) => `
    <label class="check-item">
      <input type="checkbox" data-step="${index}">
      <span>${escapeHTML(step)}</span>
    </label>
  `).join("");

  currentSummary = buildSummary(incident, answers, currentSteps);
  summaryBox.textContent = currentSummary;

  questionsSection.classList.add("hidden");
  planSection.classList.remove("hidden");

  scrollToSection(planSection);
});

/* RESET AND NAVIGATION */

function resetNavigator() {
  form.reset();

  selectedIncident = null;
  currentSummary = "";
  currentSteps = [];

  cards.forEach((card) => card.classList.remove("selected"));

  questionsSection.classList.add("hidden");
  planSection.classList.add("hidden");

  scrollToSection($("#incident-section"));
}

$("#start-over").addEventListener("click", resetNavigator);
$("#new-incident").addEventListener("click", resetNavigator);

$("#edit-answers").addEventListener("click", () => {
  questionsSection.classList.remove("hidden");
  planSection.classList.add("hidden");

  scrollToSection(questionsSection);
});

/* DOWNLOAD TXT SUMMARY */

$("#download-summary").addEventListener("click", () => {
  if (!currentSummary) return;

  const updatedSummary = currentSummary.replace(
    /^(\d+)\. \[ \] /gm,
    (match, number) => {
      const checkbox = checklist.querySelector(
        `[data-step="${Number(number) - 1}"]`
      );

      return `${number}. [${checkbox?.checked ? "x" : " "}] `;
    }
  );

  const blob = new Blob(
    [updatedSummary],
    { type: "text/plain;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "ScamShield-Incident-Summary.txt";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  showToast("Incident summary downloaded");
});

/* PRINT / SAVE AS PDF */

$("#print-summary").addEventListener("click", () => {
  window.print();
});

/* COPY HELPLINE NUMBER */

$("#copy-helpline").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("1930");
    showToast("Helpline number copied: 1930");
  } catch {
    showToast("India cyber-fraud helpline: 1930");
  }
});
