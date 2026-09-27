const config = window.EXAM_APP_CONFIG || {};
const API_BASE_URL = String(config.apiBaseUrl || "http://localhost:8000").replace(/\/$/, "");

const form = document.querySelector("#exam-form");
const fileInput = document.querySelector("#pdf-files");
const fileList = document.querySelector("#file-list");
const dropZone = document.querySelector("#drop-zone");
const countInput = document.querySelector("#question-count");
const countOutput = document.querySelector("#question-count-output");
const instructions = document.querySelector("#special-instructions");
const generateButton = document.querySelector("#generate-button");
const resultPanel = document.querySelector("#result-panel");
const errorPanel = document.querySelector("#error-panel");
const examDownload = document.querySelector("#exam-download");
const solutionsDownload = document.querySelector("#solutions-download");
const serviceStatus = document.querySelector("#service-status");
const statusLabel = document.querySelector("#status-label");

const MAX_FILES = 3;
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

countInput.addEventListener("input", () => {
  countOutput.value = countInput.value;
  countOutput.textContent = countInput.value;
});

fileInput.addEventListener("change", renderFileList);

["dragenter", "dragover"].forEach((eventName) => {
  dropZone.addEventListener(eventName, () => dropZone.classList.add("dragging"));
});

["dragleave", "drop"].forEach((eventName) => {
  dropZone.addEventListener(eventName, () => dropZone.classList.remove("dragging"));
});

document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    const addition = button.dataset.prompt;
    instructions.value = instructions.value.trim()
      ? `${instructions.value.trim()} ${addition}`
      : addition;
    instructions.focus();
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideMessages();

  const validationError = validateForm();
  if (validationError) {
    showError(validationError);
    return;
  }

  const data = new FormData();
  Array.from(fileInput.files).forEach((file) => data.append("files", file));
  data.append("title", document.querySelector("#exam-title").value.trim());
  data.append("question_count", countInput.value);
  data.append("difficulty", form.elements.difficulty.value);
  data.append(
    "question_types",
    Array.from(document.querySelectorAll('input[name="question_type"]:checked'))
      .map((input) => input.value)
      .join(","),
  );
  data.append("special_instructions", instructions.value.trim());

  setLoading(true);
  try {
    const response = await fetch(`${API_BASE_URL}/api/generations`, {
      method: "POST",
      body: data,
    });
    const payload = await readJsonSafely(response);
    if (!response.ok) {
      const detail = typeof payload.detail === "string"
        ? payload.detail
        : "The backend could not generate this exam. Check the options and try again.";
      throw new Error(detail);
    }

    examDownload.href = `${API_BASE_URL}${payload.exam_url}`;
    solutionsDownload.href = `${API_BASE_URL}${payload.solutions_url}`;
    resultPanel.hidden = false;
    resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  } catch (error) {
    const message = error instanceof TypeError
      ? "Could not reach the backend. It may still be waking up; wait a moment and try again."
      : error.message;
    showError(message);
  } finally {
    setLoading(false);
  }
});

function renderFileList() {
  fileList.replaceChildren();
  Array.from(fileInput.files).forEach((file) => {
    const item = document.createElement("li");
    const name = document.createElement("span");
    const size = document.createElement("small");
    name.textContent = file.name;
    size.textContent = formatBytes(file.size);
    item.append(name, size);
    fileList.append(item);
  });
}

function validateForm() {
  const files = Array.from(fileInput.files);
  if (!files.length) return "Choose at least one PDF before generating an exam.";
  if (files.length > MAX_FILES) return `Choose no more than ${MAX_FILES} PDF files.`;
  if (files.some((file) => file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf"))) {
    return "Every uploaded file must be a PDF.";
  }
  if (files.some((file) => file.size > MAX_FILE_BYTES)) {
    return "Each PDF must be 8 MB or smaller.";
  }
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_BYTES) {
    return "The combined PDF upload must be 20 MB or smaller.";
  }
  if (!document.querySelectorAll('input[name="question_type"]:checked').length) {
    return "Choose at least one question type.";
  }
  return "";
}

function setLoading(isLoading) {
  generateButton.disabled = isLoading;
  generateButton.querySelector("span").textContent = isLoading
    ? "Forging your exam…"
    : "Generate exam";
}

function showError(message) {
  errorPanel.textContent = message;
  errorPanel.hidden = false;
}

function hideMessages() {
  resultPanel.hidden = true;
  errorPanel.hidden = true;
  errorPanel.textContent = "";
}

async function readJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function checkBackend() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" });
    if (!response.ok) throw new Error("not ready");
    const payload = await response.json();
    serviceStatus.className = payload.generation_ready
      ? "service-status ready"
      : "service-status offline";
    statusLabel.textContent = payload.generation_ready
      ? "Backend ready"
      : "Backend running · API key needed";
  } catch {
    serviceStatus.className = "service-status offline";
    statusLabel.textContent = "Backend sleeping or offline";
  }
}

checkBackend();
