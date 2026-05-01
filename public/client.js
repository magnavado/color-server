const socket = io();

const views = {
  menu: document.getElementById("menuView"),
  info: document.getElementById("infoView"),
  join: document.getElementById("joinView"),
  observer: document.getElementById("observerView"),
  rooms: document.getElementById("roomsView"),
  game: document.getElementById("gameView")
};

const state = {
  rooms: [],
  room: null,
  me: null,
  toastTimer: null
};

const quickCreateBtn = document.getElementById("quickCreateBtn");
const codeForm = document.getElementById("codeForm");
const roomCode = document.getElementById("roomCode");
const observerForm = document.getElementById("observerForm");
const observerCode = document.getElementById("observerCode");
const roomsGrid = document.getElementById("roomsGrid");
const roleBadge = document.getElementById("roleBadge");
const roomTitle = document.getElementById("roomTitle");
const roomCodeText = document.getElementById("roomCodeText");
const phaseTitle = document.getElementById("phaseTitle");
const phaseText = document.getElementById("phaseText");
const hostNotice = document.getElementById("hostNotice");
const secretForm = document.getElementById("secretForm");
const secretNumber = document.getElementById("secretNumber");
const guessForm = document.getElementById("guessForm");
const guessNumber = document.getElementById("guessNumber");
const spectatorMessage = document.getElementById("spectatorMessage");
const resultPanel = document.getElementById("resultPanel");
const totalConnection = document.getElementById("totalConnection");
const scoreRows = document.getElementById("scoreRows");
const playersList = document.getElementById("playersList");
const spectatorCount = document.getElementById("spectatorCount");
const activityLog = document.getElementById("activityLog");
const hostControls = document.getElementById("hostControls");
const newRoundBtn = document.getElementById("newRoundBtn");
const resetBtn = document.getElementById("resetBtn");
const leaveBtn = document.getElementById("leaveBtn");
const backMenuBtn = document.getElementById("backMenuBtn");
const toast = document.getElementById("toast");

function showView(name) {
  Object.values(views).forEach((view) => view.classList.remove("active"));
  views[name].classList.add("active");
}

function notify(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.add("hidden"), 3400);
}

function goMenu(leave = false) {
  if (leave && state.room) socket.emit("room:leave");
  state.room = null;
  state.me = null;
  roomCode.value = "";
  observerCode.value = "";
  showView("menu");
}

function roomStatusText(status) {
  return {
    libre: "Libre",
    "esperando jugador": "Esperando jugador",
    "en juego": "En juego"
  }[status] || status;
}

function phaseCopy(room) {
  const current = room.players.find((player) => player.id === room.currentTurn);
  const turnLabel = current ? current.label : "Nadie";
  const copies = {
    libre: ["Sala libre", "Esta sala está disponible para crear una nueva conexión."],
    esperando: ["Esperando jugador", "Comparte la clave para que entre la segunda mente."],
    listos: ["Preparados", "Ambos jugadores están en la sala. Elijan sus números secretos para comenzar."],
    seleccion: ["Elección secreta", "Cada jugador debe guardar un número entre 1 y 100. Los espectadores lo verán en vivo."],
    adivinanza: ["Fase de intuición", `Turno de ${turnLabel}. Solo esa persona puede enviar su intuición.`],
    resultado: ["Conexión calculada", "La lectura telepática está lista. Pueden iniciar otra ronda cuando quieran."]
  };
  return copies[room.phase] || ["Sala activa", "La sala se está actualizando en tiempo real."];
}

function renderRooms() {
  roomsGrid.innerHTML = state.rooms.map((room) => `
    <article class="room-card">
      <span class="status-pill">${roomStatusText(room.status)}</span>
      <h3>Sala ${room.number}</h3>
      <div class="room-meta">
        <span>${room.players}/2 jugadores</span>
        <span>${room.spectators} espectadores</span>
        <span>Clave activa: ${room.hasCode ? "sí" : "no"}</span>
      </div>
    </article>
  `).join("");
}

function renderPlayers(room) {
  playersList.innerHTML = room.players.map((player) => {
    const isMe = player.id === state.me?.id;
    const selected = player.selectedNumber === null ? "Pendiente" : player.selectedNumber;
    const guess = player.guess === null ? "Pendiente" : player.guess;
    const accuracy = player.accuracy === null ? "Sin calcular" : `${player.accuracy}%`;
    return `
      <article class="player-row">
        <div class="player-title">
          <strong>${player.label}${isMe ? " (tú)" : ""}</strong>
          ${player.isHost ? '<span class="host-tag">Anfitrión</span>' : ""}
        </div>
        <small>Número elegido: ${selected}</small>
        <small>Intuición: ${guess}</small>
        <small>Precisión: ${accuracy}</small>
      </article>
    `;
  }).join("");
  spectatorCount.textContent = `${room.spectatorsCount} ${room.spectatorsCount === 1 ? "espectador" : "espectadores"}`;
}

function renderResults(room) {
  if (!room.scores) {
    resultPanel.classList.add("hidden");
    return;
  }

  resultPanel.classList.remove("hidden");
  totalConnection.textContent = `${room.scores.total}%`;
  scoreRows.innerHTML = room.players.map((player) => `
    <div class="score-row">
      <span>Precisión de ${player.label}</span>
      <strong>${room.scores.players[player.id]}%</strong>
    </div>
  `).join("") + `
    <div class="score-row">
      <span>Conexión telepática total</span>
      <strong>${room.scores.total}%</strong>
    </div>
  `;
}

function renderLog(room) {
  activityLog.innerHTML = room.log.length
    ? room.log.map((item) => `<div class="log-row"><small>${item.time}</small><div>${item.message}</div></div>`).join("")
    : '<div class="log-row"><small>Sin actividad todavía</small><div>La sala está lista para empezar.</div></div>';
}

function renderControls(room) {
  const isPlayer = state.me?.role === "player";
  const isSpectator = state.me?.role === "spectator";
  const isHost = state.me?.isHost || room.hostId === state.me?.id;
  const meAsPlayer = room.players.find((player) => player.id === state.me?.id);
  const myTurn = room.currentTurn === state.me?.id;

  spectatorMessage.classList.toggle("hidden", !isSpectator);
  hostControls.classList.toggle("hidden", !isHost);
  hostNotice.classList.toggle("hidden", !isHost || room.phase !== "esperando");
  if (isHost && room.phase === "esperando") {
    hostNotice.textContent = `Mándale esta clave a tu compañer@: ${room.code}`;
  }

  secretForm.classList.toggle(
    "hidden",
    !isPlayer || !["listos", "seleccion"].includes(room.phase) || Boolean(meAsPlayer?.selectedNumber)
  );
  guessForm.classList.toggle("hidden", !isPlayer || room.phase !== "adivinanza" || !myTurn);

  newRoundBtn.disabled = room.players.length !== 2;
  resetBtn.disabled = false;
}

function renderRoom() {
  const room = state.room;
  if (!room || !state.me) return;

  const [title, text] = phaseCopy(room);
  const roleText = state.me.role === "spectator"
    ? "Espectador"
    : state.me.isHost || room.hostId === state.me.id
      ? "Anfitrión"
      : "Jugador 2";

  roleBadge.textContent = roleText;
  roomTitle.textContent = `Sala ${room.number}`;
  roomCodeText.textContent = room.code ? `Clave activa: ${room.code}` : "";
  phaseTitle.textContent = title;
  phaseText.textContent = text;

  renderPlayers(room);
  renderResults(room);
  renderLog(room);
  renderControls(room);
}

quickCreateBtn.addEventListener("click", () => socket.emit("room:create"));

document.querySelectorAll(".menu-tile").forEach((button) => {
  button.addEventListener("click", () => {
    const target = button.dataset.target;
    showView(target);
    if (target === "rooms") renderRooms();
    if (target === "join") roomCode.focus();
    if (target === "observer") observerCode.focus();
  });
});

document.querySelectorAll(".back-menu").forEach((button) => {
  button.addEventListener("click", () => goMenu(false));
});

codeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  socket.emit("room:join", roomCode.value);
});

observerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  socket.emit("room:watch", observerCode.value);
});

secretForm.addEventListener("submit", (event) => {
  event.preventDefault();
  socket.emit("game:selectNumber", secretNumber.value);
  secretNumber.value = "";
});

guessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  socket.emit("game:guess", guessNumber.value);
  guessNumber.value = "";
});

newRoundBtn.addEventListener("click", () => socket.emit("game:newRound"));
resetBtn.addEventListener("click", () => socket.emit("game:reset"));
leaveBtn.addEventListener("click", () => goMenu(true));
backMenuBtn.addEventListener("click", () => goMenu(true));

socket.on("rooms:update", (rooms) => {
  state.rooms = rooms;
  renderRooms();
});

socket.on("session:joined", ({ room, me }) => {
  state.room = room;
  state.me = me;
  showView("game");
  renderRoom();
  if (me.isHost && room.code) notify(`Sala creada. Clave: ${room.code}`);
});

socket.on("session:left", () => {
  state.room = null;
  state.me = null;
});

socket.on("room:update", (room) => {
  if (!state.me || state.me.roomNumber) {
    state.room = room;
  } else if (state.room && state.room.number === room.number) {
    state.room = room;
  } else {
    state.room = room;
  }

  if (state.me && room.hostId === state.me.id) state.me.isHost = true;
  renderRoom();
});

socket.on("app:error", notify);
