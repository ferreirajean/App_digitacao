// ============================================================
// ESTADO GLOBAL DA APLICAÇÃO
// Guardar tudo num único objeto facilita saber "o que a app sabe"
// em qualquer momento, sem variáveis soltas espalhadas pelo código.
// ============================================================
const state = {
  passagesData: null,        // conteúdo inteiro do data.json, carregado uma vez
  difficulty: "medium",      // "easy" | "medium" | "hard"
  mode: "timed",              // "timed" | "passage"
  passageText: "",            // a string da passagem atual
  charStates: [],              // um estado por caractere: "pending" | "correct" | "incorrect"
  correctKeystrokes: 0,        // conta SÓ aumenta, nunca é desfeita pelo backspace
  incorrectKeystrokes: 0,      // por isso os erros originais continuam afetando a precisão
  testState: "not-started",    // "not-started" | "running" | "finished"
  elapsedSeconds: 0,
  timerId: null,
};

const TIMED_DURATION = 60; // segundos do modo "Timed"

// ============================================================
// REFERÊNCIAS AOS ELEMENTOS DO DOM
// Buscamos todos de uma vez no início, em vez de chamar
// document.getElementById repetidamente dentro das funções.
// ============================================================
const els = {
  personalBestValue: document.getElementById("personal-best-value"),

  wpmValue: document.getElementById("wpm-value"),
  accuracyValue: document.getElementById("accuracy-value"),
  timeValue: document.getElementById("time-value"),

  difficultySelect: document.getElementById("difficulty-select"),
  modeSelect: document.getElementById("mode-select"),

  testArea: document.querySelector(".test-area"),
  passageText: document.getElementById("passage-text"),
  hiddenInput: document.getElementById("hidden-input"),
  startOverlay: document.getElementById("start-overlay"),
  startBtn: document.getElementById("start-btn"),
  restartBtn: document.getElementById("restart-btn"),

  resultsScreen: document.getElementById("results-screen"),
  resultsIcon: document.getElementById("results-icon"),
  resultsTitle: document.getElementById("results-title"),
  resultsSubtitle: document.getElementById("results-subtitle"),
  resultWpm: document.getElementById("result-wpm"),
  resultAccuracy: document.getElementById("result-accuracy"),
  resultCorrectChars: document.querySelector("#result-characters .correct-chars"),
  resultIncorrectChars: document.querySelector("#result-characters .incorrect-chars"),
  resultsBtn: document.getElementById("results-btn"),
};

// ============================================================
// 1. CARREGAR O data.json
// ============================================================
async function loadPassages() {
  const response = await fetch("data.json");
  state.passagesData = await response.json();
}

// Escolhe uma passagem aleatória da dificuldade atual
function pickRandomPassage() {
  const list = state.passagesData[state.difficulty];
  const random = list[Math.floor(Math.random() * list.length)];
  return random.text;
}

// ============================================================
// 2. RENDERIZAR A PASSAGEM (um <span> por caractere)
// ============================================================
function renderPassage(text) {
  state.passageText = text;
  state.charStates = new Array(text.length).fill("pending");

  const fragment = document.createDocumentFragment();
  for (const char of text) {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = char;
    fragment.appendChild(span);
  }

  els.passageText.innerHTML = "";
  els.passageText.appendChild(fragment);
  updateCharacterDisplay(0);
}

// Aplica as classes visuais (correto/incorreto/cursor) em cada span,
// de acordo com o estado atual guardado em state.charStates
function updateCharacterDisplay(cursorIndex) {
  const spans = els.passageText.querySelectorAll(".char");
  spans.forEach((span, i) => {
    span.classList.remove("char-correct", "char-incorrect", "char-current");

    if (state.charStates[i] === "correct") {
      span.classList.add("char-correct");
    } else if (state.charStates[i] === "incorrect") {
      span.classList.add("char-incorrect");
    }

    if (i === cursorIndex) {
      span.classList.add("char-current");
    }
  });
}

// ============================================================
// 3. CONTROLE DE ESTADO VISUAL (not-started / running / finished)
// ============================================================
function setTestAreaState(newState) {
  els.testArea.classList.remove("not-started", "running", "finished");
  els.testArea.classList.add(newState);
  state.testState = newState;
}

// ============================================================
// 4. PREPARAR UM NOVO TESTE (usado no carregamento e no restart)
// ============================================================
function setupNewTest() {
  clearInterval(state.timerId);
  state.timerId = null;
  state.elapsedSeconds = 0;
  state.correctKeystrokes = 0;
  state.incorrectKeystrokes = 0;

  els.hiddenInput.value = "";
  renderPassage(pickRandomPassage());

  setTestAreaState("not-started");
  els.restartBtn.hidden = true;
  els.resultsScreen.hidden = true;

  updateLiveStats();
  updateTimeDisplay();
}

// ============================================================
// 5. INICIAR O TESTE (na primeira tecla digitada)
// ============================================================
function startTest() {
  setTestAreaState("running");
  els.restartBtn.hidden = false;

  state.timerId = setInterval(() => {
    state.elapsedSeconds++;
    updateTimeDisplay();
    updateLiveStats();

    if (state.mode === "timed" && state.elapsedSeconds >= TIMED_DURATION) {
      endTest();
    }
  }, 1000);
}

// ============================================================
// 6. CAPTURAR A DIGITAÇÃO
// O evento "input" dispara tanto ao digitar quanto ao apagar.
// event.inputType nos diz qual dos dois aconteceu.
// ============================================================
function handleInput(event) {
  if (state.testState === "finished") return;

  if (state.testState === "not-started") {
    startTest();
  }

  const typedValue = els.hiddenInput.value;
  const cursorIndex = typedValue.length;

  if (event.inputType === "deleteContentBackward") {
    // Backspace: o caractere apagado volta a ficar "pending" na TELA,
    // mas repare que NÃO tocamos em correctKeystrokes/incorrectKeystrokes.
    // É assim que o erro original continua contando na precisão final.
    state.charStates[cursorIndex] = "pending";
  } else {
    // Uma tecla nova foi digitada: compara com a passagem
    const typedChar = typedValue[cursorIndex - 1];
    const expectedChar = state.passageText[cursorIndex - 1];

    if (typedChar === expectedChar) {
      state.charStates[cursorIndex - 1] = "correct";
      state.correctKeystrokes++;
    } else {
      state.charStates[cursorIndex - 1] = "incorrect";
      state.incorrectKeystrokes++;
    }
  }

  updateCharacterDisplay(cursorIndex);
  updateLiveStats();

  // Modo "Passage": termina assim que a pessoa chega ao fim do texto
  if (state.mode === "passage" && typedValue.length === state.passageText.length) {
    endTest();
  }

  // Impede digitar além do tamanho da passagem
  if (typedValue.length >= state.passageText.length) {
    els.hiddenInput.value = typedValue.slice(0, state.passageText.length);
  }
}

// ============================================================
// 7. CÁLCULOS DE WPM E PRECISÃO
// ============================================================
function calculateWpm() {
  const minutes = state.elapsedSeconds / 60;
  if (minutes === 0) return 0;
  // Padrão da indústria: 5 caracteres corretos = 1 "palavra"
  return Math.round(state.correctKeystrokes / 5 / minutes);
}

function calculateAccuracy() {
  const total = state.correctKeystrokes + state.incorrectKeystrokes;
  if (total === 0) return 100;
  return Math.round((state.correctKeystrokes / total) * 100);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function updateTimeDisplay() {
  if (state.mode === "timed") {
    const remaining = Math.max(TIMED_DURATION - state.elapsedSeconds, 0);
    els.timeValue.textContent = formatTime(remaining);
  } else {
    els.timeValue.textContent = formatTime(state.elapsedSeconds);
  }
}

function updateLiveStats() {
  const wpm = calculateWpm();
  const accuracy = calculateAccuracy();

  els.wpmValue.textContent = wpm;
  els.accuracyValue.textContent = `${accuracy}%`;
  els.accuracyValue.classList.toggle("perfect", accuracy === 100);
}

// ============================================================
// 8. FINALIZAR O TESTE E MOSTRAR RESULTADOS
// ============================================================
function endTest() {
  clearInterval(state.timerId);
  setTestAreaState("finished");
  els.hiddenInput.blur();

  const wpm = calculateWpm();
  const accuracy = calculateAccuracy();

  showResults(wpm, accuracy);
}

function showResults(wpm, accuracy) {
  els.resultWpm.textContent = wpm;
  els.resultAccuracy.textContent = `${accuracy}%`;
  els.resultCorrectChars.textContent = state.correctKeystrokes;
  els.resultIncorrectChars.textContent = state.incorrectKeystrokes;

  const previousBest = getPersonalBest();
  let isNewBest = false;

  if (previousBest === null) {
    // Primeiro teste da pessoa: ainda não existe recorde salvo
    els.resultsIcon.textContent = "✅";
    els.resultsTitle.textContent = "Baseline Established!";
    els.resultsSubtitle.textContent =
      "You've set the bar. Now the real challenge begins—time to beat it.";
    els.resultsBtn.textContent = "";
    els.resultsBtn.append("Beat This Score ", makeIcon());
    els.resultsScreen.classList.remove("record-broken");
    isNewBest = true;
  } else if (wpm > previousBest) {
    // Bateu o recorde anterior
    els.resultsIcon.textContent = "🎉";
    els.resultsTitle.textContent = "High Score Smashed!";
    els.resultsSubtitle.textContent = "You're getting faster. That was incredible typing.";
    els.resultsBtn.textContent = "";
    els.resultsBtn.append("Beat This Score ", makeIcon());
    els.resultsScreen.classList.add("record-broken");
    launchConfetti();
    isNewBest = true;
  } else {
    // Resultado normal, sem recorde novo
    els.resultsIcon.textContent = "✅";
    els.resultsTitle.textContent = "Test Complete!";
    els.resultsSubtitle.textContent = "Solid run. Keep pushing to beat your high score.";
    els.resultsBtn.textContent = "";
    els.resultsBtn.append("Go Again ", makeIcon());
    els.resultsScreen.classList.remove("record-broken");
  }

  if (isNewBest) {
    savePersonalBest(wpm);
  }
  updatePersonalBestDisplay();

  els.resultsScreen.hidden = false;
}

// Recria o ícone ↺ que fica dentro do botão de resultado
function makeIcon() {
  const icon = document.createElement("span");
  icon.className = "restart-icon";
  icon.textContent = "↺";
  return icon;
}

// ============================================================
// 9. PERSISTÊNCIA DO RECORDE PESSOAL (localStorage)
// ============================================================
const STORAGE_KEY = "typingTestPersonalBest";

function getPersonalBest() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? null : Number(stored);
}

function savePersonalBest(wpm) {
  localStorage.setItem(STORAGE_KEY, String(wpm));
}

function updatePersonalBestDisplay() {
  const best = getPersonalBest();
  els.personalBestValue.textContent = best === null ? "-- WPM" : `${best} WPM`;
}

// ============================================================
// 10. CONFETE (gerado em JS puro, sem bibliotecas externas)
// ============================================================
function launchConfetti() {
  const colors = ["#4ade80", "#fb7185", "#facc15", "#3b82f6"];
  const container = document.createElement("div");
  container.className = "confetti-container";

  for (let i = 0; i < 60; i++) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 0.4}s`;
    piece.style.animationDuration = `${1.5 + Math.random()}s`;
    container.appendChild(piece);
  }

  els.resultsScreen.appendChild(container);
  setTimeout(() => container.remove(), 2600);
}

// ============================================================
// 11. EVENTOS
// ============================================================
els.hiddenInput.addEventListener("input", handleInput);

els.startBtn.addEventListener("click", () => {
  els.hiddenInput.focus();
});

els.passageText.addEventListener("click", () => {
  els.hiddenInput.focus();
});

els.restartBtn.addEventListener("click", setupNewTest);
els.resultsBtn.addEventListener("click", setupNewTest);

els.difficultySelect.addEventListener("change", (e) => {
  state.difficulty = e.target.value;
  setupNewTest();
});

els.modeSelect.addEventListener("change", (e) => {
  state.mode = e.target.value;
  setupNewTest();
});

// ============================================================
// 12. INICIALIZAÇÃO
// ============================================================
async function init() {
  await loadPassages();
  updatePersonalBestDisplay();
  setupNewTest();
}

init();