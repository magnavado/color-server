const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const ROOM_ID = "roulette-room";
const ADMIN_CODE = "456";
const MAX_CODES = 10;
const COLORS = [
  { id: "cafe", label: "Cafe", hex: "#8b5a2b" },
  { id: "verde", label: "Verde", hex: "#39b56a" },
  { id: "amarillo", label: "Amarillo", hex: "#f4c95d" },
  { id: "rojo", label: "Rojo", hex: "#e84d4f" },
  { id: "naranja", label: "Naranja", hex: "#f08a24" },
  { id: "azul", label: "Azul", hex: "#3c7cff" }
];

app.use(express.static(path.join(__dirname, "public")));

const state = {
  adminId: null,
  adminName: "",
  accessCodes: [],
  players: [],
  chat: [],
  chatEnabled: true,
  roundActive: false,
  spinning: false,
  winningColor: null,
  roundMessage: "Esperando al admin.",
  roundNumber: 0
};

function cleanName(value, fallback) {
  const name = String(value || "").trim().slice(0, 18);
  return name || fallback;
}

function generateCode() {
  let code = "";
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (code === ADMIN_CODE || state.accessCodes.some((item) => item.code === code));
  return code;
}

function resetCodes() {
  state.accessCodes = Array.from({ length: MAX_CODES }, (_, index) => ({
    code: generateCode(),
    usedBy: null,
    slot: index + 1
  }));
}

function publicPlayer(player) {
  return {
    id: player.id,
    nickname: player.nickname,
    code: player.code,
    choice: player.choice,
    muted: player.muted
  };
}

function publicState() {
  return {
    adminConnected: Boolean(state.adminId),
    adminName: state.adminName,
    players: state.players.map(publicPlayer),
    colors: COLORS,
    chat: state.chat,
    chatEnabled: state.chatEnabled,
    roundActive: state.roundActive,
    spinning: state.spinning,
    winningColor: state.winningColor,
    roundMessage: state.roundMessage,
    roundNumber: state.roundNumber
  };
}

function adminState() {
  return {
    accessCodes: state.accessCodes,
    players: state.players.map(publicPlayer),
    chatEnabled: state.chatEnabled
  };
}

function emitState() {
  io.to(ROOM_ID).emit("gameState", publicState());
  if (state.adminId) io.to(state.adminId).emit("adminState", adminState());
}

function addChat(sender, message, system = false) {
  const cleanMessage = String(message || "").trim().slice(0, 240);
  if (!cleanMessage) return false;

  state.chat.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sender,
    message: cleanMessage,
    system,
    time: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
  });
  state.chat = state.chat.slice(0, 80);
  return true;
}

function findPlayer(socketId) {
  return state.players.find((player) => player.id === socketId);
}

function requireAdmin(socket) {
  if (socket.id !== state.adminId) {
    socket.emit("errorMessage", "Solo el admin puede hacer eso.");
    return false;
  }
  return true;
}

function startNewAdminSession(socket, nickname) {
  state.adminId = socket.id;
  state.adminName = cleanName(nickname, "Admin");
  state.accessCodes = [];
  state.players = [];
  state.chat = [];
  state.chatEnabled = true;
  state.roundActive = false;
  state.spinning = false;
  state.winningColor = null;
  state.roundMessage = `${state.adminName} conecto como admin. Comparte los codigos con los jugadores.`;
  state.roundNumber = 0;
  resetCodes();
  addChat("Sistema", state.roundMessage, true);
}

function resetChoicesForRound() {
  state.players.forEach((player) => {
    player.choice = null;
  });
}

io.on("connection", (socket) => {
  socket.emit("gameState", publicState());

  socket.on("adminLogin", ({ code, nickname }) => {
    if (String(code || "").trim() !== ADMIN_CODE) {
      socket.emit("errorMessage", "Codigo de admin incorrecto.");
      return;
    }

    if (state.adminId && state.adminId !== socket.id) {
      socket.emit("errorMessage", "Ya hay un admin conectado.");
      return;
    }

    socket.join(ROOM_ID);
    startNewAdminSession(socket, nickname);
    socket.emit("sessionAssigned", { id: socket.id, role: "admin", nickname: state.adminName });
    emitState();
  });

  socket.on("playerJoin", ({ code, nickname }) => {
    const cleanCode = String(code || "").trim();
    const access = state.accessCodes.find((item) => item.code === cleanCode);

    if (!state.adminId) {
      socket.emit("errorMessage", "Primero debe entrar el admin.");
      return;
    }
    if (!access) {
      socket.emit("errorMessage", "Codigo incorrecto.");
      return;
    }
    if (access.usedBy && access.usedBy !== socket.id) {
      socket.emit("errorMessage", "Ese codigo ya fue usado.");
      return;
    }
    if (state.players.some((player) => player.id === socket.id)) return;

    const player = {
      id: socket.id,
      nickname: cleanName(nickname, `Jugador ${state.players.length + 1}`),
      code: cleanCode,
      choice: null,
      muted: false
    };
    access.usedBy = socket.id;
    state.players.push(player);
    socket.join(ROOM_ID);
    socket.emit("sessionAssigned", { id: socket.id, role: "player", nickname: player.nickname });
    state.roundMessage = `${player.nickname} entro a la sala.`;
    addChat("Sistema", state.roundMessage, true);
    emitState();
  });

  socket.on("adminStartRound", () => {
    if (!requireAdmin(socket)) return;
    if (state.players.length < 1) {
      socket.emit("errorMessage", "Debe haber al menos un jugador.");
      return;
    }
    state.roundNumber += 1;
    state.roundActive = true;
    state.spinning = false;
    state.winningColor = null;
    resetChoicesForRound();
    state.roundMessage = `Ronda ${state.roundNumber}: los jugadores deben elegir un color.`;
    addChat("Sistema", state.roundMessage, true);
    emitState();
  });

  socket.on("chooseColor", (colorId) => {
    const player = findPlayer(socket.id);
    if (!player) return;
    if (!state.roundActive || state.spinning || state.winningColor) {
      socket.emit("errorMessage", "Ahora no se puede elegir color.");
      return;
    }
    if (!COLORS.some((color) => color.id === colorId)) {
      socket.emit("errorMessage", "Color invalido.");
      return;
    }
    player.choice = colorId;
    state.roundMessage = `${player.nickname} eligio ${COLORS.find((color) => color.id === colorId).label}.`;
    emitState();
  });

  socket.on("adminSpin", () => {
    if (!requireAdmin(socket)) return;
    if (!state.roundActive) {
      socket.emit("errorMessage", "Primero inicia una ronda.");
      return;
    }
    if (state.spinning) return;

    state.spinning = true;
    state.roundMessage = "La ruleta esta girando...";
    emitState();

    setTimeout(() => {
      const winner = COLORS[Math.floor(Math.random() * COLORS.length)];
      const winners = state.players.filter((player) => player.choice === winner.id);
      state.spinning = false;
      state.winningColor = winner.id;
      state.roundActive = false;
      state.roundMessage = winners.length
        ? `Salio ${winner.label}. Acertaron: ${winners.map((player) => player.nickname).join(", ")}.`
        : `Salio ${winner.label}. Nadie acerto esta ronda.`;
      addChat("Sistema", state.roundMessage, true);
      emitState();
    }, 2200);
  });

  socket.on("adminKick", (playerId) => {
    if (!requireAdmin(socket)) return;
    const player = state.players.find((item) => item.id === playerId);
    if (!player) return;

    state.players = state.players.filter((item) => item.id !== playerId);
    const access = state.accessCodes.find((item) => item.usedBy === playerId);
    if (access) access.usedBy = null;
    io.to(playerId).emit("kicked", "El admin te expulso del servidor.");
    io.sockets.sockets.get(playerId)?.leave(ROOM_ID);
    addChat("Sistema", `${player.nickname} fue expulsado por el admin.`, true);
    emitState();
  });

  socket.on("adminSetChat", (enabled) => {
    if (!requireAdmin(socket)) return;
    state.chatEnabled = Boolean(enabled);
    addChat("Sistema", state.chatEnabled ? "El chat fue activado." : "El chat fue silenciado.", true);
    emitState();
  });

  socket.on("chatMessage", (message) => {
    const player = findPlayer(socket.id);
    const isAdmin = socket.id === state.adminId;
    const sender = isAdmin ? state.adminName : player?.nickname;

    if (!sender) {
      socket.emit("errorMessage", "Debes entrar para usar el chat.");
      return;
    }
    if (!isAdmin && !state.chatEnabled) {
      socket.emit("errorMessage", "El chat esta silenciado por el admin.");
      return;
    }
    if (addChat(sender, message)) emitState();
  });

  socket.on("disconnect", () => {
    if (socket.id === state.adminId) {
      addChat("Sistema", "El admin se desconecto. Sala cerrada.", true);
      state.adminId = null;
      state.adminName = "";
      state.accessCodes = [];
      state.players = [];
      state.roundActive = false;
      state.spinning = false;
      state.winningColor = null;
      state.chatEnabled = true;
      state.roundMessage = "Esperando al admin.";
      emitState();
      return;
    }

    const player = findPlayer(socket.id);
    if (!player) return;
    state.players = state.players.filter((item) => item.id !== socket.id);
    const access = state.accessCodes.find((item) => item.usedBy === socket.id);
    if (access) access.usedBy = null;
    addChat("Sistema", `${player.nickname} salio de la sala.`, true);
    emitState();
  });
});

server.listen(PORT, () => {
  console.log(`Ruleta online activa en http://localhost:${PORT}`);
});
