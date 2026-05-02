const screens = {
  menu: document.getElementById("menuScreen"),
  placeholder: document.getElementById("placeholderScreen"),
  setup: document.getElementById("setupScreen"),
  practice: document.getElementById("practiceScreen"),
  results: document.getElementById("resultsScreen"),
  memory: document.getElementById("memoryScreen"),
  tablesChoice: document.getElementById("tablesChoiceScreen"),
  tablesMemorySetup: document.getElementById("tablesMemorySetupScreen"),
  tablesSpecificSetup: document.getElementById("tablesSpecificSetupScreen"),
  tablesStudy: document.getElementById("tablesStudyScreen"),
  tablesRecall: document.getElementById("tablesRecallScreen"),
  adminMessages: document.getElementById("adminMessagesScreen")
};

const modes = {
  multiplicaciones: {
    label: "Multiplicaciones",
    setupQuestion: "¿Cuántas multiplicaciones quieres practicar?",
    caption: "Resuelve la multiplicación",
    symbol: "×",
    generate: generateMultiplicationProblem
  },
  sumas: {
    label: "Sumas",
    setupQuestion: "¿Cuántas sumas quieres practicar?",
    caption: "Resuelve la suma",
    symbol: "+",
    generate: generateAdditionProblem
  },
  restas: {
    label: "Restas",
    setupQuestion: "¿Cuántas restas quieres practicar?",
    caption: "Resuelve la resta",
    symbol: "−",
    generate: generateSubtractionProblem
  },
  divisiones: {
    label: "Divisiones exactas",
    setupQuestion: "¿Cuántas divisiones quieres practicar?",
    caption: "Resuelve la división",
    symbol: "÷",
    generate: generateDivisionProblem
  },
  tablas: {
    label: "Tablas de multiplicar",
    setupQuestion: "¿Cuántas preguntas de tablas quieres practicar?",
    caption: "Resuelve la tabla de multiplicar",
    symbol: "×",
    generate: generateTableProblem
  },
  surtido: {
    label: "Surtido",
    setupQuestion: "¿Cuántas preguntas variadas quieres practicar?",
    caption: "Resuelve el ejercicio surtido",
    symbol: "",
    generate: generateMixedProblem
  }
};

const state = {
  activeMode: "divisiones",
  problems: [],
  currentIndex: 0,
  correct: 0,
  wrong: 0,
  startTime: 0,
  elapsedSeconds: 0,
  timerId: null,
  audioContext: null,
  movingToNext: false,
  answerDelayId: null,
  lastResultType: "practice"
};

const feedbackState = {
  rating: null,
  adminClicks: 0,
  adminClickTimer: null,
  toastTimer: null,
  realDailyUsers: 0,
  publicDailyExtra: 0
};

let licenseInfoTimer = null;

const initialUserKeys = [
  "A7K2Q", "M9R4T", "P3X8L", "Z6N1B", "C5V7D",
  "H2J9S", "Q8W3E", "L4T6Y", "B1M5K", "R7C2P",
  "N9D4A", "V3S8G", "T6F1H", "K5Q7R", "X2L9N",
  "D8P3V", "G4B6C", "S1H5J", "Y7M2T", "E9K4Q",
  "W3N8X", "F6R1L", "J5C7B", "U2V9D", "O8S3M",
  "I4G6P", "A1T5W", "P7H2N", "C9L4S", "R3Q8Y"
];

const betaUserKeys = ["BETA1", "BETA2", "BETA3", "BETA4", "BETA5"];
const adminKeys = ["admin456", "admin789"];

const sessionState = {
  currentUserId: null,
  isAdmin: false,
  guestSlotId: null,
  guestTimerId: null,
  activityTimerId: null,
  lastActivityTick: null
};

const memoryState = {
  sequence: [],
  userIndex: 0,
  score: 0,
  playing: false,
  active: false,
  timeouts: []
};

const tablesMemoryState = {
  studyProblems: [],
  currentProblem: null,
  totalQuestions: 0,
  currentIndex: 0,
  correct: 0,
  wrong: 0,
  mistakes: [],
  startTime: 0,
  elapsedSeconds: 0,
  timerId: null,
  answerDelayId: null,
  movingToNext: false
};

const tablesSpecificState = {
  active: false,
  tableNumber: 2
};

const modeLabel = document.getElementById("modeLabel");
const setupQuestion = document.getElementById("setupQuestion");
const setupForm = document.getElementById("setupForm");
const questionCountInput = document.getElementById("questionCount");
const setupError = document.getElementById("setupError");
const progressLabel = document.getElementById("progressLabel");
const timerLabel = document.getElementById("timerLabel");
const problemCaption = document.getElementById("problemCaption");
const problemText = document.getElementById("problemText");
const answerForm = document.getElementById("answerForm");
const answerInput = document.getElementById("answerInput");
const feedbackText = document.getElementById("feedbackText");
const correctTotal = document.getElementById("correctTotal");
const wrongTotal = document.getElementById("wrongTotal");
const questionTotal = document.getElementById("questionTotal");
const finalTime = document.getElementById("finalTime");
const resultsDetails = document.getElementById("resultsDetails");
const practiceAgainButton = document.getElementById("practiceAgainButton");
const memoryMenuButton = document.getElementById("memoryMenuButton");
const startMemoryButton = document.getElementById("startMemoryButton");
const memoryScore = document.getElementById("memoryScore");
const memoryStatus = document.getElementById("memoryStatus");
const memoryCells = Array.from(document.querySelectorAll(".memory-cell"));
const tablesMenuButton = document.getElementById("tablesMenuButton");
const tablesNormalChoiceButton = document.getElementById("tablesNormalChoiceButton");
const tablesMemoryChoiceButton = document.getElementById("tablesMemoryChoiceButton");
const tablesSpecificChoiceButton = document.getElementById("tablesSpecificChoiceButton");
const tablesMemorySetupForm = document.getElementById("tablesMemorySetupForm");
const tablesMemoryCount = document.getElementById("tablesMemoryCount");
const tablesMemorySetupError = document.getElementById("tablesMemorySetupError");
const tablesSpecificSetupForm = document.getElementById("tablesSpecificSetupForm");
const tablesSpecificNumber = document.getElementById("tablesSpecificNumber");
const tablesSpecificCount = document.getElementById("tablesSpecificCount");
const tablesSpecificSetupError = document.getElementById("tablesSpecificSetupError");
const tablesStudyTimer = document.getElementById("tablesStudyTimer");
const tablesStudyList = document.getElementById("tablesStudyList");
const tablesReadyButton = document.getElementById("tablesReadyButton");
const tablesRecallProgress = document.getElementById("tablesRecallProgress");
const tablesRecallTimer = document.getElementById("tablesRecallTimer");
const tablesRecallProblem = document.getElementById("tablesRecallProblem");
const tablesRecallForm = document.getElementById("tablesRecallForm");
const tablesRecallAnswer = document.getElementById("tablesRecallAnswer");
const tablesRecallFeedback = document.getElementById("tablesRecallFeedback");
const dailyUsersCount = document.getElementById("dailyUsersCount");
const feedbackOpenButton = document.getElementById("feedbackOpenButton");
const feedbackModal = document.getElementById("feedbackModal");
const feedbackForm = document.getElementById("feedbackForm");
const feedbackCloseButton = document.getElementById("feedbackCloseButton");
const feedbackName = document.getElementById("feedbackName");
const feedbackEmail = document.getElementById("feedbackEmail");
const feedbackMessage = document.getElementById("feedbackMessage");
const anonymousMessageInput = document.getElementById("anonymousMessageInput");
const ratingStars = Array.from(document.querySelectorAll("#ratingStars button"));
const toastMessage = document.getElementById("toastMessage");
const adminUnlockButton = document.getElementById("adminUnlockButton");
const adminKeyBox = document.getElementById("adminKeyBox");
const adminKeyInput = document.getElementById("adminKeyInput");
const adminKeySubmit = document.getElementById("adminKeySubmit");
const adminMessagesList = document.getElementById("adminMessagesList");
const adminExactUsers = document.getElementById("adminExactUsers");
const adminUsersList = document.getElementById("adminUsersList");
const adminAccessRequestsList = document.getElementById("adminAccessRequestsList");
const resetHistoryButton = document.getElementById("resetHistoryButton");
const loginModal = document.getElementById("loginModal");
const loginForm = document.getElementById("loginForm");
const loginKeyInput = document.getElementById("loginKeyInput");
const loginError = document.getElementById("loginError");
const buyAccessButton = document.getElementById("buyAccessButton");
const licenseButton = document.getElementById("licenseButton");
const buyAccessModal = document.getElementById("buyAccessModal");
const buyAccessForm = document.getElementById("buyAccessForm");
const buyNameInput = document.getElementById("buyNameInput");
const buyContactInput = document.getElementById("buyContactInput");
const buyAccessError = document.getElementById("buyAccessError");
const buyAccessBackButton = document.getElementById("buyAccessBackButton");
const profileOpenButton = document.getElementById("profileOpenButton");
const profileModal = document.getElementById("profileModal");
const profileForm = document.getElementById("profileForm");
const profileNameInput = document.getElementById("profileNameInput");
const profileKeyInput = document.getElementById("profileKeyInput");
const profileError = document.getElementById("profileError");
const profileCloseButton = document.getElementById("profileCloseButton");
const logoutButton = document.getElementById("logoutButton");
const licenseInfoModal = document.getElementById("licenseInfoModal");
const licenseInfoCloseButton = document.getElementById("licenseInfoCloseButton");
const trialOverlay = document.getElementById("trialOverlay");
const trialTimer = document.getElementById("trialTimer");
const endTrialButton = document.getElementById("endTrialButton");
const betaBadge = document.getElementById("betaBadge");

const canvas = document.getElementById("drawingCanvas");
const boardWrap = canvas.parentElement;
const context = canvas.getContext("2d");
const pencilButton = document.getElementById("pencilButton");
const eraserButton = document.getElementById("eraserButton");
const clearBoardButton = document.getElementById("clearBoardButton");

let drawing = false;
let lastPoint = null;
let activeTool = "pencil";

function showScreen(screenName) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[screenName].classList.add("active");

  if (screenName === "practice") {
    resizeCanvas();
    answerInput.focus();
  }
}

function addMemoryTimeout(callback, delay) {
  const id = window.setTimeout(() => {
    memoryState.timeouts = memoryState.timeouts.filter((timeoutId) => timeoutId !== id);
    callback();
  }, delay);
  memoryState.timeouts.push(id);
}

function clearMemoryTimeouts() {
  memoryState.timeouts.forEach((id) => window.clearTimeout(id));
  memoryState.timeouts = [];
}

function openMode(modeName) {
  state.activeMode = modeName;
  const mode = modes[state.activeMode];
  recordExerciseConsult(mode.label);

  stopTimer();
  stopTablesMemoryTimer();
  clearAnswerDelay();
  setupError.textContent = "";
  modeLabel.textContent = mode.label;
  setupQuestion.textContent = mode.setupQuestion;
  questionCountInput.value = questionCountInput.value || 10;
  showScreen("setup");
  questionCountInput.focus();
}

function getAudioContext() {
  if (!state.audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContextClass();
  }
  return state.audioContext;
}

function playTone(frequency, duration, type = "sine", gain = 0.06, delay = 0) {
  const audio = getAudioContext();
  const startAt = audio.currentTime + delay;
  const oscillator = audio.createOscillator();
  const volume = audio.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  volume.gain.setValueAtTime(0.0001, startAt);
  volume.gain.exponentialRampToValueAtTime(gain, startAt + 0.02);
  volume.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(volume);
  volume.connect(audio.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.03);
}

function playSound(kind) {
  try {
    if (kind === "click") {
      playTone(420, 0.08, "triangle", 0.035);
      return;
    }

    if (kind === "correct") {
      playTone(620, 0.1, "sine", 0.055);
      playTone(880, 0.12, "sine", 0.052, 0.08);
      return;
    }

    if (kind === "wrong") {
      playTone(210, 0.16, "sawtooth", 0.045);
      playTone(150, 0.18, "sawtooth", 0.035, 0.12);
      return;
    }

    if (kind === "final") {
      playTone(392, 0.12, "triangle", 0.045);
      playTone(523, 0.14, "triangle", 0.045, 0.1);
      playTone(784, 0.22, "triangle", 0.05, 0.22);
      return;
    }

    if (kind === "memory") {
      playTone(520, 0.1, "triangle", 0.05);
      return;
    }

    if (kind === "memoryWin") {
      playTone(660, 0.08, "sine", 0.05);
      playTone(920, 0.1, "sine", 0.045, 0.08);
    }
  } catch (error) {
    console.warn("El sonido no pudo reproducirse.", error);
  }
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDateKeyFromOffset(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function readStorage(key, fallback) {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch (error) {
    console.warn("No se pudo leer almacenamiento local.", error);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("No se pudo guardar en almacenamiento local.", error);
  }
}

function getUsageHistory() {
  return readStorage("pm_usage_history", {});
}

function saveUsageHistory(history) {
  writeStorage("pm_usage_history", history);
}

function ensureUserHistory(history, userId) {
  if (!history[userId]) {
    history[userId] = {
      days: {},
      exercises: {}
    };
  }

  return history[userId];
}

function pruneUsageHistory(history) {
  const allowedDays = new Set(Array.from({ length: 30 }, (_, index) => getDateKeyFromOffset(index)));

  Object.values(history).forEach((userHistory) => {
    Object.keys(userHistory.days || {}).forEach((dayKey) => {
      if (!allowedDays.has(dayKey)) {
        delete userHistory.days[dayKey];
      }
    });
  });
}

function recordUsageSeconds(seconds) {
  if (!sessionState.currentUserId || seconds <= 0) {
    return;
  }

  const history = getUsageHistory();
  const userHistory = ensureUserHistory(history, sessionState.currentUserId);
  const today = getTodayKey();

  if (!userHistory.days[today]) {
    userHistory.days[today] = {
      seconds: 0
    };
  }

  userHistory.days[today].seconds += seconds;
  pruneUsageHistory(history);
  saveUsageHistory(history);
}

function recordExerciseConsult(exerciseName) {
  if (!sessionState.currentUserId) {
    return;
  }

  const history = getUsageHistory();
  const userHistory = ensureUserHistory(history, sessionState.currentUserId);
  userHistory.exercises[exerciseName] = (userHistory.exercises[exerciseName] || 0) + 1;
  pruneUsageHistory(history);
  saveUsageHistory(history);
}

function startActivityTracking() {
  stopActivityTracking();

  if (!sessionState.currentUserId) {
    return;
  }

  sessionState.lastActivityTick = Date.now();
  sessionState.activityTimerId = window.setInterval(() => {
    const now = Date.now();
    const seconds = Math.max(1, Math.round((now - sessionState.lastActivityTick) / 1000));
    sessionState.lastActivityTick = now;
    recordUsageSeconds(seconds);
  }, 15000);
}

function stopActivityTracking() {
  if (sessionState.activityTimerId && sessionState.lastActivityTick) {
    const now = Date.now();
    const seconds = Math.max(0, Math.round((now - sessionState.lastActivityTick) / 1000));
    recordUsageSeconds(seconds);
  }

  window.clearInterval(sessionState.activityTimerId);
  sessionState.activityTimerId = null;
  sessionState.lastActivityTick = null;
}

function summarizeUserUsage(userId) {
  const history = getUsageHistory();
  pruneUsageHistory(history);
  saveUsageHistory(history);

  const userHistory = history[userId] || {
    days: {},
    exercises: {}
  };
  const daysUsed = Object.values(userHistory.days || {}).filter((day) => day.seconds > 0).length;
  const totalSeconds = Object.values(userHistory.days || {}).reduce((sum, day) => sum + (day.seconds || 0), 0);
  const topExercises = Object.entries(userHistory.exercises || {})
    .sort((first, second) => second[1] - first[1])
    .slice(0, 3);

  return {
    daysUsed,
    hoursUsed: totalSeconds / 3600,
    topExercises
  };
}

function initializeUsers() {
  const existingUsers = readStorage("pm_users", null);

  if (existingUsers) {
    const usersWithBeta = ensureBetaUsers(existingUsers);
    if (usersWithBeta.length !== existingUsers.length) {
      writeStorage("pm_users", usersWithBeta);
    }
    return usersWithBeta;
  }

  const regularUsers = initialUserKeys.map((key, index) => ({
    id: `user-${index + 1}`,
    name: `Usuario ${index + 1}`,
    key,
    originalKey: key,
    beta: false,
    createdAt: new Date().toLocaleString("es-MX")
  }));
  const users = ensureBetaUsers(regularUsers);

  writeStorage("pm_users", users);
  return users;
}

function ensureBetaUsers(users) {
  const existingIds = new Set(users.map((user) => user.id));
  const betaUsers = betaUserKeys
    .map((key, index) => ({
      id: `beta-${index + 1}`,
      name: `Usuario beta ${index + 1}`,
      key,
      originalKey: key,
      beta: true,
      createdAt: new Date().toLocaleString("es-MX")
    }))
    .filter((user) => !existingIds.has(user.id));

  return [...users, ...betaUsers];
}

function getUsers() {
  return initializeUsers();
}

function saveUsers(users) {
  writeStorage("pm_users", users);
}

function getCurrentUser() {
  if (!sessionState.currentUserId) {
    return null;
  }

  return getUsers().find((user) => user.id === sessionState.currentUserId) || null;
}

function updateBetaBadge() {
  const user = getCurrentUser();
  betaBadge.classList.toggle("active", Boolean(user && user.beta));
}

function updateAdminButton() {
  adminUnlockButton.classList.toggle("visible", sessionState.isAdmin);
}

function showLoginModal() {
  loginModal.classList.add("active");
  loginKeyInput.value = "";
  loginError.textContent = "";
  window.setTimeout(() => loginKeyInput.focus(), 50);
}

function hideLoginModal() {
  loginModal.classList.remove("active");
}

function showBuyAccessModal() {
  loginModal.classList.remove("active");
  buyAccessModal.classList.add("active");
  buyAccessForm.reset();
  buyAccessError.textContent = "";
  buyNameInput.focus();
}

function startTrialWithoutForm() {
  assignGuestSession("Invitado", "Prueba sin formulario", false);
}

function backToLoginModal() {
  buyAccessModal.classList.remove("active");
  showLoginModal();
}

function getGuestSlots() {
  const now = Date.now();
  const slots = readStorage("pm_guest_slots", []);
  const activeSlots = slots.filter((slot) => slot.expiresAt > now);

  if (activeSlots.length !== slots.length) {
    writeStorage("pm_guest_slots", activeSlots);
  }

  return activeSlots;
}

function saveGuestSlots(slots) {
  writeStorage("pm_guest_slots", slots);
}

function startGuestExpirationTimer(expiresAt) {
  window.clearTimeout(sessionState.guestTimerId);
  updateTrialMode(expiresAt);
  sessionState.guestTimerId = window.setInterval(() => {
    updateTrialMode(expiresAt);
    if (Date.now() >= expiresAt) {
      endGuestSession("Tu sesión de invitado terminó.");
    }
  }, 1000);
}

function updateTrialMode(expiresAt) {
  const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
  document.body.classList.add("trial-mode");
  trialOverlay.classList.add("active");
  trialTimer.textContent = formatTime(remaining);
}

function assignGuestSession(name, contact, saveRequest = true, showLicenseInfo = false) {
  const slots = getGuestSlots();

  if (slots.length >= 3) {
    buyAccessError.textContent = "Intentelo mas tarde , estan llenas las sesiones de invitado";
    playSound("wrong");
    return;
  }

  const slot = {
    id: `guest-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    contact,
    createdAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000
  };

  if (saveRequest) {
    const requests = getAccessRequests();
    requests.unshift({
      id: slot.id,
      name,
      contact,
      date: new Date().toLocaleString("es-MX")
    });
    saveAccessRequests(requests);
  }

  slots.push(slot);
  saveGuestSlots(slots);
  sessionState.guestSlotId = slot.id;
  sessionStorage.setItem("pm_guest_slot_id", slot.id);
  sessionStorage.setItem("pm_guest_expires_at", String(slot.expiresAt));
  buyAccessModal.classList.remove("active");
  hideLoginModal();
  startGuestExpirationTimer(slot.expiresAt);
  if (showLicenseInfo) {
    showLicenseInfoModal();
  } else {
    showToast(`Bienvenido ${name}`, 2000);
  }
}

function restoreGuestSession() {
  const guestSlotId = sessionStorage.getItem("pm_guest_slot_id");
  const expiresAt = Number(sessionStorage.getItem("pm_guest_expires_at"));

  if (!guestSlotId || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    clearGuestSession();
    return false;
  }

  const slotExists = getGuestSlots().some((slot) => slot.id === guestSlotId);

  if (!slotExists) {
    clearGuestSession();
    return false;
  }

  sessionState.guestSlotId = guestSlotId;
  hideLoginModal();
  startGuestExpirationTimer(expiresAt);
  showToast("Bienvenido invitado", 2000);
  return true;
}

function clearGuestSession() {
  window.clearInterval(sessionState.guestTimerId);
  sessionState.guestTimerId = null;

  if (sessionState.guestSlotId) {
    const slots = getGuestSlots().filter((slot) => slot.id !== sessionState.guestSlotId);
    saveGuestSlots(slots);
  }

  sessionState.guestSlotId = null;
  document.body.classList.remove("trial-mode");
  trialOverlay.classList.remove("active");
  updateBetaBadge();
  sessionStorage.removeItem("pm_guest_slot_id");
  sessionStorage.removeItem("pm_guest_expires_at");
}

function endGuestSession(message) {
  clearGuestSession();
  returnToMenu();
  showLoginModal();
  showToast(message, 3000);
}

function restoreSession() {
  initializeUsers();
  const savedUserId = sessionStorage.getItem("pm_current_user_id");
  const savedIsAdmin = sessionStorage.getItem("pm_is_admin") === "true";

  if (restoreGuestSession()) {
    return;
  }

  if (savedIsAdmin) {
    sessionState.isAdmin = true;
    clearGuestSession();
    stopActivityTracking();
    updateBetaBadge();
    updateAdminButton();
    hideLoginModal();
    showToast("Bienvenido admin", 2000);
    return;
  }

  if (savedUserId && getUsers().some((user) => user.id === savedUserId)) {
    sessionState.currentUserId = savedUserId;
    sessionState.isAdmin = false;
    clearGuestSession();
    startActivityTracking();
    updateBetaBadge();
    updateAdminButton();
    hideLoginModal();
    const user = getCurrentUser();
    showToast(`Bienvenido ${user.name}`, 2000);
    return;
  }

  window.setTimeout(showLoginModal, 2000);
}

function handleLogin(event) {
  event.preventDefault();
  const key = loginKeyInput.value.trim();

  if (adminKeys.includes(key)) {
    sessionState.isAdmin = true;
    sessionState.currentUserId = null;
    clearGuestSession();
    stopActivityTracking();
    updateBetaBadge();
    updateAdminButton();
    sessionStorage.setItem("pm_is_admin", "true");
    sessionStorage.removeItem("pm_current_user_id");
    hideLoginModal();
    showToast("Bienvenido admin", 2000);
    if (key === "admin789") {
      renderAdminMessages();
      renderAccessRequests();
      renderAdminUsers();
      showScreen("adminMessages");
    }
    return;
  }

  const user = getUsers().find((candidate) => candidate.key === key);

  if (!user) {
    loginError.textContent = "Clave incorrecta.";
    playSound("wrong");
    return;
  }

  sessionState.currentUserId = user.id;
  sessionState.isAdmin = false;
  clearGuestSession();
  startActivityTracking();
  updateBetaBadge();
  updateAdminButton();
  sessionStorage.setItem("pm_current_user_id", user.id);
  sessionStorage.removeItem("pm_is_admin");
  hideLoginModal();
  showToast(`Bienvenido ${user.name}`, 2000);
}

function openProfileModal() {
  if (sessionState.guestSlotId) {
    showToast("Sesión de invitado activa por 5 minutos.", 3000);
    return;
  }

  if (sessionState.isAdmin) {
    profileNameInput.value = "Administrador";
    profileKeyInput.value = "admin456";
    profileError.textContent = "La edición de usuarios está en la zona de administración.";
  } else {
    const user = getCurrentUser();
    if (!user) {
      showLoginModal();
      return;
    }

    profileNameInput.value = user.name;
    profileKeyInput.value = user.key;
    profileError.textContent = "Solo el administrador puede modificar nombre y clave.";
  }

  profileModal.classList.add("active");
  profileNameInput.focus();
}

function handleBuyAccessSubmit(event) {
  event.preventDefault();
  const name = buyNameInput.value.trim();
  const contact = buyContactInput.value.trim();

  if (!name || !contact) {
    buyAccessError.textContent = "Escribe tu nombre y correo o WhatsApp.";
    playSound("wrong");
    return;
  }

  assignGuestSession(name, contact, true, true);
}

function showLicenseInfoModal() {
  licenseInfoModal.classList.add("active");
  window.clearTimeout(licenseInfoTimer);
  licenseInfoTimer = window.setTimeout(closeLicenseInfoModal, 8000);
}

function closeLicenseInfoModal() {
  licenseInfoModal.classList.remove("active");
  window.clearTimeout(licenseInfoTimer);
}

function closeProfileModal() {
  profileModal.classList.remove("active");
}

function handleProfileSave(event) {
  event.preventDefault();
  closeProfileModal();
}

function logoutCurrentUser() {
  stopActivityTracking();
  sessionState.currentUserId = null;
  sessionState.isAdmin = false;
  clearGuestSession();
  updateBetaBadge();
  updateAdminButton();
  sessionStorage.removeItem("pm_current_user_id");
  sessionStorage.removeItem("pm_is_admin");
  closeProfileModal();
  returnToMenu();
  showLoginModal();
}

function initializeDailyUsers() {
  const today = getTodayKey();
  const visitKey = "pm_daily_visits";
  const visitorKey = "pm_visitor_id";
  const extraKey = "pm_daily_public_extra";
  const visits = readStorage(visitKey, {});
  const extras = readStorage(extraKey, {});
  let visitorId = localStorage.getItem(visitorKey);

  if (!visitorId) {
    visitorId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(visitorKey, visitorId);
  }

  if (!visits[today]) {
    visits[today] = [];
  }

  if (!visits[today].includes(visitorId)) {
    visits[today].push(visitorId);
    writeStorage(visitKey, visits);
  }

  if (!extras[today]) {
    extras[today] = randomInteger(14, 20);
    writeStorage(extraKey, extras);
  }

  feedbackState.realDailyUsers = visits[today].length;
  feedbackState.publicDailyExtra = extras[today];
  dailyUsersCount.textContent = feedbackState.realDailyUsers + feedbackState.publicDailyExtra;
}

function getFeedbackMessages() {
  return readStorage("pm_feedback_messages", []);
}

function saveFeedbackMessages(messages) {
  writeStorage("pm_feedback_messages", messages);
}

function getAccessRequests() {
  return readStorage("pm_access_requests", []);
}

function saveAccessRequests(requests) {
  writeStorage("pm_access_requests", requests);
}

function getSenderInfo() {
  if (sessionState.isAdmin) {
    return {
      name: "Administrador",
      key: "admin456",
      type: "admin"
    };
  }

  if (sessionState.guestSlotId) {
    const slot = getGuestSlots().find((guest) => guest.id === sessionState.guestSlotId);
    return {
      name: slot ? slot.name : "Invitado",
      key: "Invitado",
      type: "guest"
    };
  }

  const user = getCurrentUser();
  return {
    name: user ? user.name : "Sin sesión",
    key: user ? user.key : "n/a",
    type: "user"
  };
}

function setRating(value) {
  feedbackState.rating = value;
  ratingStars.forEach((star) => {
    const rating = Number(star.dataset.rating);
    star.classList.toggle("active", value !== null && rating <= value);
  });
}

function openFeedbackModal() {
  feedbackModal.classList.add("active");
  feedbackName.focus();
}

function closeFeedbackModal() {
  feedbackModal.classList.remove("active");
}

function showToast(message, duration = 3000) {
  toastMessage.textContent = message;
  toastMessage.classList.add("active");
  window.clearTimeout(feedbackState.toastTimer);
  feedbackState.toastTimer = window.setTimeout(() => {
    toastMessage.classList.remove("active");
  }, duration);
}

function handleFeedbackSubmit(event) {
  event.preventDefault();
  const messages = getFeedbackMessages();
  const sender = getSenderInfo();
  const anonymous = anonymousMessageInput.checked;

  messages.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: new Date().toLocaleString("es-MX"),
    name: anonymous ? "Anónimo" : feedbackName.value.trim(),
    email: feedbackEmail.value.trim(),
    message: feedbackMessage.value.trim(),
    rating: feedbackState.rating,
    anonymous,
    senderName: sender.name,
    senderKey: sender.key,
    senderType: sender.type
  });

  saveFeedbackMessages(messages);
  feedbackForm.reset();
  setRating(null);
  closeFeedbackModal();
  showToast("Gracias por tu mensaje, estamos trabajando para mejorar la pagina y tu consejo es de gran ayuda");
}

function handleAdminUnlockClick() {
  if (sessionState.isAdmin) {
    renderAdminMessages();
    renderAccessRequests();
    renderAdminUsers();
    showScreen("adminMessages");
    return;
  }

  feedbackState.adminClicks += 1;
  window.clearTimeout(feedbackState.adminClickTimer);
  feedbackState.adminClickTimer = window.setTimeout(() => {
    feedbackState.adminClicks = 0;
  }, 1800);

  if (feedbackState.adminClicks >= 5) {
    feedbackState.adminClicks = 0;
    adminKeyBox.classList.add("active");
    adminKeyInput.value = "";
    adminKeyInput.focus();
  }
}

function tryOpenAdminMessages() {
  if (adminKeys.includes(adminKeyInput.value.trim()) || sessionState.isAdmin) {
    adminKeyBox.classList.remove("active");
    renderAdminMessages();
    renderAccessRequests();
    renderAdminUsers();
    showScreen("adminMessages");
  } else {
    showToast("Clave incorrecta");
    adminKeyInput.select();
  }
}

function renderAdminUsers() {
  const users = getUsers();
  adminUsersList.innerHTML = users.map((user) => {
    const usage = summarizeUserUsage(user.id);
    const topExercises = usage.topExercises.length
      ? usage.topExercises.map(([name, count]) => `${escapeHtml(name)} (${count})`).join(", ")
      : "Sin consultas";

    return `
      <article class="admin-user-item">
        <p><strong>${escapeHtml(user.name)}</strong></p>
        <p>Tipo: ${user.beta ? "Usuario beta, versión de prueba" : "Usuario regular"}</p>
        <label>Nombre</label>
        <input class="admin-user-name" type="text" value="${escapeHtml(user.name)}" data-user-id="${escapeHtml(user.id)}">
        <label>Clave</label>
        <input class="admin-user-key" type="text" value="${escapeHtml(user.key)}" minlength="5" maxlength="12" data-user-id="${escapeHtml(user.id)}">
        <button class="gold-button save-user-button" type="button" data-user-id="${escapeHtml(user.id)}">Guardar usuario</button>
        <p>Clave inicial: ${escapeHtml(user.originalKey)}</p>
        <p>Registro: ${escapeHtml(user.createdAt)}</p>
        <p>Días usados últimos 30 días: ${usage.daysUsed}</p>
        <p>Horas usadas últimos 30 días: ${usage.hoursUsed.toFixed(2)}</p>
        <p>Ejercicios más consultados: ${topExercises}</p>
      </article>
    `;
  }).join("");
}

function saveAdminUser(userId) {
  const nameInput = adminUsersList.querySelector(`.admin-user-name[data-user-id="${CSS.escape(userId)}"]`);
  const keyInput = adminUsersList.querySelector(`.admin-user-key[data-user-id="${CSS.escape(userId)}"]`);
  const newName = nameInput.value.trim();
  const newKey = keyInput.value.trim();

  if (!newName) {
    showToast("El nombre no puede estar vacío.", 2500);
    playSound("wrong");
    return;
  }

  if (newKey.length < 5 || newKey.length > 12) {
    showToast("La clave debe tener mínimo 5 y máximo 12 caracteres.", 2500);
    playSound("wrong");
    return;
  }

  if (adminKeys.includes(newKey)) {
    showToast("Esa clave está reservada para administrador.", 2500);
    playSound("wrong");
    return;
  }

  const users = getUsers();
  const duplicatedKey = users.some((user) => user.id !== userId && user.key === newKey);

  if (duplicatedKey) {
    showToast("Esa clave ya está en uso.", 2500);
    playSound("wrong");
    return;
  }

  const updatedUsers = users.map((user) => {
    if (user.id !== userId) {
      return user;
    }

    return {
      ...user,
      name: newName,
      key: newKey
    };
  });

  saveUsers(updatedUsers);
  renderAdminUsers();
  showToast("Usuario actualizado.", 2500);
}

function resetUsersHistory() {
  const confirmed = window.confirm("¿Estás seguro de reiniciar el historial de todos los usuarios?");

  if (!confirmed) {
    return;
  }

  saveUsageHistory({});
  renderAdminUsers();
  showToast("Historial de usuarios reiniciado.", 2500);
}

function renderAccessRequests() {
  const requests = getAccessRequests();

  if (!requests.length) {
    adminAccessRequestsList.innerHTML = '<p class="admin-message-text">Todavía no hay solicitudes de acceso.</p>';
    return;
  }

  adminAccessRequestsList.innerHTML = requests.map((request) => `
    <article class="admin-message-item">
      <div class="admin-message-top">
        <span>${escapeHtml(request.name)}</span>
        <button class="delete-access-request-button" type="button" data-request-id="${escapeHtml(request.id)}">Borrar</button>
      </div>
      <p class="admin-message-meta">${escapeHtml(request.date)} · ${escapeHtml(request.contact)}</p>
    </article>
  `).join("");
}

function deleteAccessRequest(requestId) {
  const requests = getAccessRequests().filter((request) => request.id !== requestId);
  saveAccessRequests(requests);
  renderAccessRequests();
}

function renderAdminMessages() {
  const messages = getFeedbackMessages();
  adminExactUsers.textContent = feedbackState.realDailyUsers;

  if (!messages.length) {
    adminMessagesList.innerHTML = '<p class="admin-message-text">Todavía no hay mensajes guardados.</p>';
    return;
  }

  adminMessagesList.innerHTML = messages.map((message) => `
    <article class="admin-message-item">
      <div class="admin-message-top">
        <span>${escapeHtml(message.name || "Sin nombre")}</span>
        <button class="delete-message-button" type="button" data-message-id="${escapeHtml(message.id)}">Borrar</button>
      </div>
      <p class="admin-message-meta">${escapeHtml(message.date)} · ${escapeHtml(message.email || "Sin correo")} · Calificación: ${formatAdminRating(message.rating)}</p>
      <p class="admin-message-meta">Remitente real: ${escapeHtml(message.senderName || "No registrado")} · Clave: ${escapeHtml(message.senderKey || "n/a")} · Tipo: ${escapeHtml(message.senderType || "n/a")}${message.anonymous ? " · Marcado como anónimo" : ""}</p>
      <p class="admin-message-text">${escapeHtml(message.message)}</p>
    </article>
  `).join("");
}

function formatAdminRating(rating) {
  if (!Number.isInteger(rating)) {
    return "n/a";
  }

  return `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`;
}

function deleteAdminMessage(messageId) {
  const messages = getFeedbackMessages().filter((message) => message.id !== messageId);
  saveFeedbackMessages(messages);
  renderAdminMessages();
}

function startTimer() {
  stopTimer();
  state.startTime = Date.now();
  state.elapsedSeconds = 0;
  timerLabel.textContent = "00:00";
  state.timerId = window.setInterval(() => {
    state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
    timerLabel.textContent = formatTime(state.elapsedSeconds);
  }, 250);
}

function stopTimer() {
  if (state.timerId) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function startTablesMemoryTimer() {
  stopTablesMemoryTimer();
  tablesMemoryState.startTime = Date.now();
  tablesMemoryState.elapsedSeconds = 0;
  updateTablesMemoryTimerLabels();
  tablesMemoryState.timerId = window.setInterval(() => {
    tablesMemoryState.elapsedSeconds = Math.floor((Date.now() - tablesMemoryState.startTime) / 1000);
    updateTablesMemoryTimerLabels();
  }, 250);
}

function stopTablesMemoryTimer() {
  if (tablesMemoryState.timerId) {
    window.clearInterval(tablesMemoryState.timerId);
    tablesMemoryState.timerId = null;
  }
}

function updateTablesMemoryTimerLabels() {
  const value = formatTime(tablesMemoryState.elapsedSeconds);
  tablesStudyTimer.textContent = value;
  tablesRecallTimer.textContent = value;
}

function clearTablesMemoryDelay() {
  if (tablesMemoryState.answerDelayId) {
    window.clearTimeout(tablesMemoryState.answerDelayId);
    tablesMemoryState.answerDelayId = null;
  }
  tablesMemoryState.movingToNext = false;
}

function clearAnswerDelay() {
  if (state.answerDelayId) {
    window.clearTimeout(state.answerDelayId);
    state.answerDelayId = null;
  }
  state.movingToNext = false;
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeProblem(left, right, symbol, answer) {
  return {
    text: `${left} ${symbol} ${right}`,
    answer
  };
}

function generateAdditionProblem() {
  const left = randomInteger(10, 999);
  const right = randomInteger(10, 999);
  return makeProblem(left, right, "+", left + right);
}

function generateSubtractionProblem() {
  const answer = randomInteger(10, 899);
  const right = randomInteger(10, 300);
  const left = answer + right;
  return makeProblem(left, right, "−", answer);
}

function generateMultiplicationProblem() {
  const left = randomInteger(10, 99);
  const right = randomInteger(2, 99);
  return makeProblem(left, right, "×", left * right);
}

function generateDivisionProblem() {
  while (true) {
    const divisor = randomInteger(10, 99);
    const quotient = randomInteger(10, 99);
    const dividend = divisor * quotient;

    if (dividend >= 100 && dividend <= 999) {
      return makeProblem(dividend, divisor, "÷", quotient);
    }
  }
}

function generateTableProblem() {
  const left = randomInteger(1, 12);
  const right = randomInteger(1, 12);
  return makeProblem(left, right, "×", left * right);
}

function generateUniqueTableProblems(amount) {
  const problems = [];
  const used = new Set();

  while (problems.length < amount) {
    const problem = generateTableProblem();
    if (!used.has(problem.text)) {
      used.add(problem.text);
      problems.push(problem);
    }
  }

  return problems;
}

function generateSpecificTableProblems(tableNumber, amount) {
  const problems = [];
  const used = new Set();

  while (problems.length < amount) {
    const right = randomInteger(1, 12);
    if (!used.has(right)) {
      used.add(right);
      problems.push(makeProblem(tableNumber, right, "×", tableNumber * right));
    }
  }

  return problems;
}

function generateMixedProblem() {
  const generators = [
    generateAdditionProblem,
    generateSubtractionProblem,
    generateMultiplicationProblem,
    generateDivisionProblem,
    generateTableProblem
  ];
  const selectedGenerator = generators[randomInteger(0, generators.length - 1)];
  return selectedGenerator();
}

function generateProblems(amount) {
  const mode = modes[state.activeMode];
  return Array.from({ length: amount }, () => mode.generate());
}

function beginPractice(amount) {
  const mode = modes[state.activeMode];

  state.problems = generateProblems(amount);
  state.currentIndex = 0;
  state.correct = 0;
  state.wrong = 0;
  state.movingToNext = false;
  problemCaption.textContent = mode.caption;
  feedbackText.textContent = "";
  feedbackText.className = "feedback-text";
  clearBoard();
  showScreen("practice");
  startTimer();
  renderProblem();
}

function renderProblem() {
  const problem = state.problems[state.currentIndex];
  progressLabel.textContent = `Pregunta ${state.currentIndex + 1} de ${state.problems.length}`;
  problemText.textContent = problem.text;
  answerInput.value = "";
  feedbackText.textContent = "";
  feedbackText.className = "feedback-text";
  state.movingToNext = false;
  clearBoard();
  answerInput.focus();
}

function finishPractice() {
  stopTimer();
  state.lastResultType = "practice";
  correctTotal.textContent = state.correct;
  wrongTotal.textContent = state.wrong;
  questionTotal.textContent = state.problems.length;
  finalTime.textContent = formatTime(state.elapsedSeconds);
  resultsDetails.classList.remove("active");
  resultsDetails.innerHTML = "";
  showScreen("results");
  playSound("final");
}

function checkAnswer(event) {
  event.preventDefault();

  if (state.movingToNext) {
    return;
  }

  const rawAnswer = answerInput.value.trim();
  const value = Number(rawAnswer);
  const problem = state.problems[state.currentIndex];

  if (!Number.isFinite(value) || rawAnswer === "") {
    feedbackText.textContent = "Escribe una respuesta antes de continuar.";
    feedbackText.className = "feedback-text wrong";
    playSound("wrong");
    return;
  }

  state.movingToNext = true;

  if (value === problem.answer) {
    state.correct += 1;
    feedbackText.textContent = "Correcto";
    feedbackText.className = "feedback-text correct";
    playSound("correct");
  } else {
    state.wrong += 1;
    feedbackText.textContent = `Incorrecto. La respuesta era ${problem.answer}.`;
    feedbackText.className = "feedback-text wrong";
    playSound("wrong");
  }

  state.answerDelayId = window.setTimeout(() => {
    state.answerDelayId = null;
    state.currentIndex += 1;
    if (state.currentIndex >= state.problems.length) {
      finishPractice();
    } else {
      renderProblem();
    }
  }, 620);
}

function returnToMenu() {
  stopTimer();
  stopTablesMemoryTimer();
  clearAnswerDelay();
  clearTablesMemoryDelay();
  stopMemoryGame();
  adminKeyBox.classList.remove("active");
  showScreen("menu");
}

function openTablesChoice() {
  recordExerciseConsult("Tablas de multiplicar");
  stopTimer();
  stopTablesMemoryTimer();
  clearAnswerDelay();
  clearTablesMemoryDelay();
  stopMemoryGame();
  showScreen("tablesChoice");
}

function openTablesMemorySetup() {
  recordExerciseConsult("Memorizar tablas aleatorias");
  stopTablesMemoryTimer();
  clearTablesMemoryDelay();
  tablesSpecificState.active = false;
  tablesMemorySetupError.textContent = "";
  showScreen("tablesMemorySetup");
  tablesMemoryCount.focus();
}

function openTablesSpecificSetup() {
  recordExerciseConsult("Memorizar tabla específica");
  stopTablesMemoryTimer();
  clearTablesMemoryDelay();
  tablesSpecificState.active = true;
  tablesSpecificSetupError.textContent = "";
  showScreen("tablesSpecificSetup");
  tablesSpecificNumber.focus();
}

function beginTablesMemoryPractice(amount) {
  tablesSpecificState.active = false;
  tablesMemoryState.totalQuestions = amount;
  tablesMemoryState.currentIndex = 0;
  tablesMemoryState.correct = 0;
  tablesMemoryState.wrong = 0;
  tablesMemoryState.mistakes = [];
  tablesMemoryState.movingToNext = false;
  tablesMemoryState.currentProblem = null;
  startTablesMemoryTimer();
  showNextTablesStudyRound();
}

function beginTablesSpecificPractice(tableNumber, amount) {
  tablesSpecificState.active = true;
  tablesSpecificState.tableNumber = tableNumber;
  tablesMemoryState.totalQuestions = amount;
  tablesMemoryState.currentIndex = 0;
  tablesMemoryState.correct = 0;
  tablesMemoryState.wrong = 0;
  tablesMemoryState.mistakes = [];
  tablesMemoryState.movingToNext = false;
  tablesMemoryState.currentProblem = null;
  startTablesMemoryTimer();
  showNextTablesStudyRound();
}

function showNextTablesStudyRound() {
  tablesMemoryState.studyProblems = tablesSpecificState.active
    ? generateSpecificTableProblems(tablesSpecificState.tableNumber, 3)
    : generateUniqueTableProblems(5);
  tablesMemoryState.currentProblem = tablesMemoryState.studyProblems[randomInteger(0, tablesMemoryState.studyProblems.length - 1)];
  tablesStudyList.innerHTML = tablesMemoryState.studyProblems
    .map((problem) => `<div class="study-item">${problem.text} = ${problem.answer}</div>`)
    .join("");
  tablesMemoryState.movingToNext = false;
  showScreen("tablesStudy");
}

function startTablesRecall() {
  tablesMemoryState.movingToNext = false;
  showScreen("tablesRecall");
  renderTablesRecallQuestion();
}

function renderTablesRecallQuestion() {
  const problem = tablesMemoryState.currentProblem;
  tablesRecallProgress.textContent = `Pregunta ${tablesMemoryState.currentIndex + 1} de ${tablesMemoryState.totalQuestions}`;
  tablesRecallProblem.textContent = problem.text;
  tablesRecallAnswer.value = "";
  tablesRecallFeedback.textContent = "";
  tablesRecallFeedback.className = "feedback-text";
  tablesMemoryState.movingToNext = false;
  tablesRecallAnswer.focus();
}

function checkTablesRecallAnswer(event) {
  event.preventDefault();

  if (tablesMemoryState.movingToNext) {
    return;
  }

  const rawAnswer = tablesRecallAnswer.value.trim();
  const value = Number(rawAnswer);
  const problem = tablesMemoryState.currentProblem;

  if (!Number.isFinite(value) || rawAnswer === "") {
    tablesRecallFeedback.textContent = "Escribe una respuesta antes de continuar.";
    tablesRecallFeedback.className = "feedback-text wrong";
    playSound("wrong");
    return;
  }

  tablesMemoryState.movingToNext = true;

  if (value === problem.answer) {
    tablesMemoryState.correct += 1;
    tablesRecallFeedback.textContent = "Correcto";
    tablesRecallFeedback.className = "feedback-text correct";
    playSound("correct");
  } else {
    tablesMemoryState.wrong += 1;
    tablesMemoryState.mistakes.push({
      text: problem.text,
      answer: problem.answer,
      userAnswer: rawAnswer
    });
    tablesRecallFeedback.textContent = `Incorrecto. La respuesta era ${problem.answer}.`;
    tablesRecallFeedback.className = "feedback-text wrong";
    playSound("wrong");
  }

  tablesMemoryState.answerDelayId = window.setTimeout(() => {
    tablesMemoryState.answerDelayId = null;
    tablesMemoryState.currentIndex += 1;
    if (tablesMemoryState.currentIndex >= tablesMemoryState.totalQuestions) {
      finishTablesMemoryPractice();
    } else {
      showNextTablesStudyRound();
    }
  }, 620);
}

function finishTablesMemoryPractice() {
  stopTablesMemoryTimer();
  state.lastResultType = "tablesMemory";
  correctTotal.textContent = tablesMemoryState.correct;
  wrongTotal.textContent = tablesMemoryState.wrong;
  questionTotal.textContent = tablesMemoryState.totalQuestions;
  finalTime.textContent = formatTime(tablesMemoryState.elapsedSeconds);

  if (tablesMemoryState.mistakes.length) {
    resultsDetails.classList.add("active");
    resultsDetails.innerHTML = `
      <h3>Preguntas incorrectas</h3>
      ${tablesMemoryState.mistakes
        .map((mistake) => `<p>${mistake.text} = ${mistake.answer}. Tu respuesta: ${escapeHtml(mistake.userAnswer)}</p>`)
        .join("")}
    `;
  } else {
    resultsDetails.classList.add("active");
    resultsDetails.innerHTML = "<h3>Preguntas incorrectas</h3><p>No fallaste ninguna.</p>";
  }

  showScreen("results");
  playSound("final");
}

function openMemoryGame() {
  recordExerciseConsult("Memorización");
  stopTimer();
  clearAnswerDelay();
  resetMemoryGame();
  showScreen("memory");
}

function resetMemoryGame() {
  clearMemoryTimeouts();
  memoryState.sequence = [];
  memoryState.userIndex = 0;
  memoryState.score = 0;
  memoryState.playing = false;
  memoryState.active = false;
  memoryScore.textContent = "0";
  memoryStatus.textContent = "Presiona comenzar para iniciar.";
  startMemoryButton.textContent = "Comenzar";
  setMemoryCellsEnabled(false);
  memoryCells.forEach((cell) => cell.classList.remove("lit"));
}

function stopMemoryGame() {
  clearMemoryTimeouts();
  memoryState.playing = false;
  memoryState.active = false;
  setMemoryCellsEnabled(false);
  memoryCells.forEach((cell) => cell.classList.remove("lit"));
}

function setMemoryCellsEnabled(enabled) {
  memoryCells.forEach((cell) => cell.classList.toggle("disabled", !enabled));
}

function startMemoryGame() {
  resetMemoryGame();
  memoryState.active = true;
  startMemoryButton.textContent = "Reiniciar";
  addMemoryStep();
}

function addMemoryStep() {
  memoryState.sequence.push(randomInteger(0, memoryCells.length - 1));
  memoryState.userIndex = 0;
  playMemorySequence();
}

function lightMemoryCell(index, duration = 420) {
  const cell = memoryCells[index];
  cell.classList.add("lit");
  playSound("memory");
  addMemoryTimeout(() => cell.classList.remove("lit"), duration);
}

function playMemorySequence() {
  memoryState.playing = true;
  setMemoryCellsEnabled(false);
  memoryStatus.textContent = "Observa el patrón.";

  memoryState.sequence.forEach((cellIndex, position) => {
    addMemoryTimeout(() => lightMemoryCell(cellIndex), 620 * position + 260);
  });

  addMemoryTimeout(() => {
    memoryState.playing = false;
    setMemoryCellsEnabled(true);
    memoryStatus.textContent = "Tu turno: repite el patrón.";
  }, 620 * memoryState.sequence.length + 360);
}

function handleMemoryCellPress(cellIndex) {
  if (!memoryState.active || memoryState.playing) {
    return;
  }

  lightMemoryCell(cellIndex, 210);

  if (cellIndex !== memoryState.sequence[memoryState.userIndex]) {
    finishMemoryGame();
    return;
  }

  memoryState.userIndex += 1;

  if (memoryState.userIndex === memoryState.sequence.length) {
    memoryState.score = memoryState.sequence.length;
    memoryScore.textContent = memoryState.score;
    memoryStatus.textContent = "Correcto. Prepárate para el siguiente patrón.";
    setMemoryCellsEnabled(false);
    playSound("memoryWin");
    addMemoryTimeout(addMemoryStep, 760);
  }
}

function finishMemoryGame() {
  memoryState.active = false;
  memoryState.playing = false;
  setMemoryCellsEnabled(false);
  memoryStatus.textContent = `Fin del juego. Lograste acertar ${memoryState.score} patrón${memoryState.score === 1 ? "" : "es"}.`;
  startMemoryButton.textContent = "Jugar otra vez";
  playSound("wrong");
}

function resizeCanvas() {
  const rect = boardWrap.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return;
  }

  const scale = window.devicePixelRatio || 1;
  const previous = document.createElement("canvas");
  previous.width = canvas.width;
  previous.height = canvas.height;
  previous.getContext("2d").drawImage(canvas, 0, 0);

  canvas.width = Math.max(1, Math.floor(rect.width * scale));
  canvas.height = Math.max(1, Math.floor(rect.height * scale));
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.lineCap = "round";
  context.lineJoin = "round";

  if (previous.width && previous.height) {
    context.drawImage(previous, 0, 0, previous.width / scale, previous.height / scale);
  }
}

function getCanvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const source = event.touches ? event.touches[0] : event;
  return {
    x: source.clientX - rect.left,
    y: source.clientY - rect.top
  };
}

function drawLine(point) {
  if (!lastPoint) {
    lastPoint = point;
  }

  context.globalCompositeOperation = activeTool === "eraser" ? "destination-out" : "source-over";
  context.strokeStyle = activeTool === "eraser" ? "rgba(0,0,0,1)" : "#f7f3ea";
  context.lineWidth = activeTool === "eraser" ? 24 : 4;

  context.beginPath();
  context.moveTo(lastPoint.x, lastPoint.y);
  context.quadraticCurveTo(lastPoint.x, lastPoint.y, point.x, point.y);
  context.stroke();
  lastPoint = point;
}

function startDrawing(event) {
  event.preventDefault();
  drawing = true;
  lastPoint = getCanvasPoint(event);
  drawLine(lastPoint);
}

function moveDrawing(event) {
  if (!drawing) {
    return;
  }

  event.preventDefault();
  drawLine(getCanvasPoint(event));
}

function stopDrawing() {
  drawing = false;
  lastPoint = null;
}

function setTool(tool) {
  activeTool = tool;
  pencilButton.classList.toggle("active", tool === "pencil");
  eraserButton.classList.toggle("active", tool === "eraser");
}

function clearBoard() {
  context.clearRect(0, 0, canvas.width, canvas.height);
}

document.addEventListener("click", (event) => {
  if (event.target.closest("button") && !event.target.closest("#adminUnlockButton")) {
    playSound("click");
  }
});

document.querySelectorAll(".menu-button[data-mode]").forEach((button) => {
  button.addEventListener("click", () => openMode(button.dataset.mode));
});

tablesMenuButton.addEventListener("click", openTablesChoice);
tablesNormalChoiceButton.addEventListener("click", () => openMode("tablas"));
tablesMemoryChoiceButton.addEventListener("click", openTablesMemorySetup);
tablesSpecificChoiceButton.addEventListener("click", openTablesSpecificSetup);
memoryMenuButton.addEventListener("click", openMemoryGame);

document.querySelectorAll(".back-menu").forEach((button) => {
  button.addEventListener("click", returnToMenu);
});

document.querySelectorAll(".tables-choice-back").forEach((button) => {
  button.addEventListener("click", openTablesChoice);
});

setupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const amount = Number(questionCountInput.value);

  if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
    setupError.textContent = "Elige una cantidad entre 1 y 100.";
    playSound("wrong");
    return;
  }

  setupError.textContent = "";
  beginPractice(amount);
});

answerForm.addEventListener("submit", checkAnswer);

tablesMemorySetupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const amount = Number(tablesMemoryCount.value);

  if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
    tablesMemorySetupError.textContent = "Elige una cantidad entre 1 y 100.";
    playSound("wrong");
    return;
  }

  tablesMemorySetupError.textContent = "";
  beginTablesMemoryPractice(amount);
});

tablesSpecificSetupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const tableNumber = Number(tablesSpecificNumber.value);
  const amount = Number(tablesSpecificCount.value);

  if (!Number.isInteger(tableNumber) || tableNumber < 2 || tableNumber > 12) {
    tablesSpecificSetupError.textContent = "Elige una tabla entre 2 y 12.";
    playSound("wrong");
    return;
  }

  if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
    tablesSpecificSetupError.textContent = "Elige una cantidad entre 1 y 100.";
    playSound("wrong");
    return;
  }

  tablesSpecificSetupError.textContent = "";
  beginTablesSpecificPractice(tableNumber, amount);
});

tablesReadyButton.addEventListener("click", startTablesRecall);
tablesRecallForm.addEventListener("submit", checkTablesRecallAnswer);

practiceAgainButton.addEventListener("click", () => {
  if (state.lastResultType === "tablesMemory") {
    if (tablesSpecificState.active) {
      openTablesSpecificSetup();
    } else {
      openTablesMemorySetup();
    }
  } else {
    openMode(state.activeMode);
  }
});
startMemoryButton.addEventListener("click", startMemoryGame);

memoryCells.forEach((cell) => {
  cell.addEventListener("click", () => handleMemoryCellPress(Number(cell.dataset.cell)));
});

feedbackOpenButton.addEventListener("click", openFeedbackModal);
feedbackCloseButton.addEventListener("click", closeFeedbackModal);
feedbackModal.addEventListener("click", (event) => {
  if (event.target === feedbackModal) {
    closeFeedbackModal();
  }
});
feedbackForm.addEventListener("submit", handleFeedbackSubmit);
loginForm.addEventListener("submit", handleLogin);
buyAccessButton.addEventListener("click", startTrialWithoutForm);
licenseButton.addEventListener("click", showBuyAccessModal);
buyAccessBackButton.addEventListener("click", backToLoginModal);
buyAccessForm.addEventListener("submit", handleBuyAccessSubmit);
profileOpenButton.addEventListener("click", openProfileModal);
profileCloseButton.addEventListener("click", closeProfileModal);
profileForm.addEventListener("submit", handleProfileSave);
logoutButton.addEventListener("click", logoutCurrentUser);
licenseInfoCloseButton.addEventListener("click", closeLicenseInfoModal);
endTrialButton.addEventListener("click", () => endGuestSession("Sesión de prueba cerrada."));

ratingStars.forEach((star) => {
  star.addEventListener("click", () => setRating(Number(star.dataset.rating)));
});

adminUnlockButton.addEventListener("click", handleAdminUnlockClick);
adminKeySubmit.addEventListener("click", tryOpenAdminMessages);
adminKeyInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    tryOpenAdminMessages();
  }
});

adminMessagesList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".delete-message-button");
  if (deleteButton) {
    deleteAdminMessage(deleteButton.dataset.messageId);
  }
});
adminAccessRequestsList.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".delete-access-request-button");
  if (deleteButton) {
    deleteAccessRequest(deleteButton.dataset.requestId);
  }
});
resetHistoryButton.addEventListener("click", resetUsersHistory);
adminUsersList.addEventListener("click", (event) => {
  const saveButton = event.target.closest(".save-user-button");
  if (saveButton) {
    saveAdminUser(saveButton.dataset.userId);
  }
});

pencilButton.addEventListener("click", () => setTool("pencil"));
eraserButton.addEventListener("click", () => setTool("eraser"));
clearBoardButton.addEventListener("click", clearBoard);

canvas.addEventListener("mousedown", startDrawing);
canvas.addEventListener("mousemove", moveDrawing);
window.addEventListener("mouseup", stopDrawing);
canvas.addEventListener("touchstart", startDrawing, { passive: false });
canvas.addEventListener("touchmove", moveDrawing, { passive: false });
window.addEventListener("touchend", stopDrawing);
window.addEventListener("resize", resizeCanvas);
window.addEventListener("beforeunload", stopActivityTracking);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopActivityTracking();
  } else if (sessionState.currentUserId) {
    startActivityTracking();
  }
});

initializeDailyUsers();
setRating(null);
updateAdminButton();
restoreSession();
resizeCanvas();
