const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const MAX_ROOMS = 6;

app.use(express.static(path.join(__dirname, "public")));

const rooms = Array.from({ length: MAX_ROOMS }, (_, index) => createEmptyRoom(index + 1));
const socketSessions = new Map();

function createEmptyRoom(number) {
  return {
    number,
    code: null,
    players: [],
    spectators: [],
    hostId: null,
    phase: "libre",
    currentTurn: null,
    secrets: {},
    guesses: {},
    scores: null,
    log: []
  };
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (rooms.some((room) => room.code === code));
  return code;
}

function roomStatus(room) {
  if (!room.code || room.players.length === 0) return "libre";
  if (room.players.length === 1) return "esperando jugador";
  return "en juego";
}

function playerLabel(room, socketId) {
  const index = room.players.indexOf(socketId);
  if (index === -1) return "Espectador";
  return `Jugador ${index + 1}`;
}

function addLog(room, message) {
  room.log.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    message,
    time: new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
  });
  room.log = room.log.slice(0, 12);
}

function publicRooms() {
  return rooms.map((room) => ({
    number: room.number,
    status: roomStatus(room),
    players: room.players.length,
    spectators: room.spectators.length,
    hasCode: Boolean(room.code)
  }));
}

function publicRoom(room) {
  return {
    number: room.number,
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    currentTurn: room.currentTurn,
    players: room.players.map((id, index) => ({
      id,
      label: `Jugador ${index + 1}`,
      isHost: id === room.hostId,
      connected: true,
      selectedNumber: room.secrets[id] ?? null,
      guess: room.guesses[id] ?? null,
      accuracy: room.scores?.players[id] ?? null
    })),
    spectatorsCount: room.spectators.length,
    scores: room.scores,
    log: room.log,
    status: roomStatus(room)
  };
}

function emitRooms() {
  io.emit("rooms:update", publicRooms());
}

function emitRoom(room) {
  io.to(`room-${room.number}`).emit("room:update", publicRoom(room));
  emitRooms();
}

function resetGame(room, keepPlayers = true) {
  room.phase = room.players.length === 2 ? "listos" : room.players.length === 1 ? "esperando" : "libre";
  room.currentTurn = null;
  room.secrets = {};
  room.guesses = {};
  room.scores = null;
  if (!keepPlayers && room.players.length === 0) {
    room.code = null;
    room.hostId = null;
    room.log = [];
  }
}

function clearRoomIfEmpty(room) {
  if (room.players.length === 0) {
    room.code = null;
    room.hostId = null;
    room.phase = "libre";
    room.currentTurn = null;
    room.secrets = {};
    room.guesses = {};
    room.scores = null;
    room.log = [];
  }
}

function leaveCurrentRoom(socket, silent = false) {
  const session = socketSessions.get(socket.id);
  if (!session) return;

  const room = rooms.find((item) => item.number === session.roomNumber);
  if (!room) {
    socketSessions.delete(socket.id);
    return;
  }

  socket.leave(`room-${room.number}`);

  if (session.role === "spectator") {
    room.spectators = room.spectators.filter((id) => id !== socket.id);
  } else {
    const wasHost = room.hostId === socket.id;
    room.players = room.players.filter((id) => id !== socket.id);
    delete room.secrets[socket.id];
    delete room.guesses[socket.id];
    if (room.scores?.players) delete room.scores.players[socket.id];

    if (wasHost) {
      room.hostId = room.players[0] || null;
      if (room.hostId) addLog(room, "El anfitrion salio. El control de sala paso al jugador restante.");
    }

    if (!silent) addLog(room, `${session.label} salio de la sala.`);
    if (room.players.length < 2 && room.players.length > 0) resetGame(room);
    clearRoomIfEmpty(room);
  }

  socketSessions.delete(socket.id);
  emitRoom(room);
}

function joinRoom(socket, room, role) {
  socket.join(`room-${room.number}`);
  const label = role === "spectator" ? "Espectador" : `Jugador ${room.players.length}`;
  socketSessions.set(socket.id, { roomNumber: room.number, role, label });
  socket.emit("session:joined", {
    room: publicRoom(room),
    me: {
      id: socket.id,
      role,
      label,
      isHost: room.hostId === socket.id
    }
  });
  emitRoom(room);
}

function calculateScores(room) {
  const [playerOne, playerTwo] = room.players;
  const playerOneAccuracy = Math.max(0, 100 - Math.abs(room.secrets[playerTwo] - room.guesses[playerOne]));
  const playerTwoAccuracy = Math.max(0, 100 - Math.abs(room.secrets[playerOne] - room.guesses[playerTwo]));
  const total = Math.round((playerOneAccuracy + playerTwoAccuracy) / 2);

  room.scores = {
    players: {
      [playerOne]: playerOneAccuracy,
      [playerTwo]: playerTwoAccuracy
    },
    total
  };
}

function assertPlayerTurn(socket, room) {
  const session = socketSessions.get(socket.id);
  if (!session || session.role !== "player") return "Solo los jugadores pueden realizar esta accion.";
  if (!room.players.includes(socket.id)) return "No perteneces a esta sala como jugador.";
  if (room.currentTurn && room.currentTurn !== socket.id) return "Aun no es tu turno.";
  return null;
}

io.on("connection", (socket) => {
  socket.emit("rooms:update", publicRooms());

  socket.on("room:create", () => {
    leaveCurrentRoom(socket, true);
    const room = rooms.find((item) => item.players.length === 0 && !item.code);

    if (!room) {
      socket.emit("app:error", "Todas las salas estan ocupadas. Intentalo de nuevo en unos minutos.");
      emitRooms();
      return;
    }

    room.code = generateCode();
    room.players = [socket.id];
    room.spectators = [];
    room.hostId = socket.id;
    room.phase = "esperando";
    room.currentTurn = null;
    room.secrets = {};
    room.guesses = {};
    room.scores = null;
    room.log = [];
    addLog(room, "Sala creada. Esperando al segundo jugador.");
    joinRoom(socket, room, "player");
  });

  socket.on("room:join", (rawCode) => {
    leaveCurrentRoom(socket, true);
    const code = String(rawCode || "").trim().toUpperCase();
    const room = rooms.find((item) => item.code === code);

    if (!room) {
      socket.emit("app:error", "La clave no corresponde a ninguna sala activa.");
      return;
    }

    if (room.players.length < 2) {
      room.players.push(socket.id);
      room.phase = "listos";
      addLog(room, `${playerLabel(room, socket.id)} entro a la sala.`);
      joinRoom(socket, room, "player");
      return;
    }

    room.spectators.push(socket.id);
    addLog(room, "Un espectador se unio a la transmision.");
    joinRoom(socket, room, "spectator");
  });

  socket.on("room:watch", (rawCode) => {
    leaveCurrentRoom(socket, true);
    const code = String(rawCode || "").trim().toUpperCase();
    const room = rooms.find((item) => item.code === code);

    if (!room) {
      socket.emit("app:error", "La clave no corresponde a ninguna sala activa.");
      return;
    }

    room.spectators.push(socket.id);
    addLog(room, "Un observador ingreso a la sala.");
    joinRoom(socket, room, "spectator");
  });

  socket.on("room:leave", () => {
    leaveCurrentRoom(socket);
    socket.emit("session:left");
  });

  socket.on("game:reset", () => {
    const session = socketSessions.get(socket.id);
    const room = session && rooms.find((item) => item.number === session.roomNumber);
    if (!room) return;
    if (socket.id !== room.hostId) {
      socket.emit("app:error", "Solo el anfitrion puede reiniciar la sala.");
      return;
    }
    resetGame(room);
    addLog(room, "El anfitrion reinicio la sala.");
    emitRoom(room);
  });

  socket.on("game:newRound", () => {
    const session = socketSessions.get(socket.id);
    const room = session && rooms.find((item) => item.number === session.roomNumber);
    if (!room) return;
    if (socket.id !== room.hostId) {
      socket.emit("app:error", "Solo el anfitrion puede iniciar una nueva ronda.");
      return;
    }
    if (room.players.length !== 2) {
      socket.emit("app:error", "Se necesitan dos jugadores para iniciar una nueva ronda.");
      return;
    }
    resetGame(room);
    room.phase = "seleccion";
    addLog(room, "Nueva ronda iniciada. Ambos jugadores deben elegir su numero secreto.");
    emitRoom(room);
  });

  socket.on("game:selectNumber", (value) => {
    const session = socketSessions.get(socket.id);
    const room = session && rooms.find((item) => item.number === session.roomNumber);
    if (!room) return;
    if (session.role !== "player") {
      socket.emit("app:error", "Los espectadores solo pueden observar la partida.");
      return;
    }
    if (!["listos", "seleccion"].includes(room.phase)) {
      socket.emit("app:error", "Ahora no se puede cambiar el numero secreto.");
      return;
    }
    if (room.players.length !== 2) {
      socket.emit("app:error", "Espera a que entre el segundo jugador.");
      return;
    }

    const number = Number(value);
    if (!Number.isInteger(number) || number < 1 || number > 100) {
      socket.emit("app:error", "Elige un numero entero entre 1 y 100.");
      return;
    }

    room.phase = "seleccion";
    room.secrets[socket.id] = number;
    addLog(room, `${playerLabel(room, socket.id)} eligio su numero secreto.`);

    if (room.players.every((id) => room.secrets[id])) {
      room.phase = "adivinanza";
      room.currentTurn = room.players[0];
      addLog(room, "Ambos numeros estan listos. Comienza la fase de intuicion.");
    }

    emitRoom(room);
  });

  socket.on("game:guess", (value) => {
    const session = socketSessions.get(socket.id);
    const room = session && rooms.find((item) => item.number === session.roomNumber);
    if (!room) return;
    if (room.phase !== "adivinanza") {
      socket.emit("app:error", "La fase de adivinanza aun no esta activa.");
      return;
    }
    const turnError = assertPlayerTurn(socket, room);
    if (turnError) {
      socket.emit("app:error", turnError);
      return;
    }

    const guess = Number(value);
    if (!Number.isInteger(guess) || guess < 1 || guess > 100) {
      socket.emit("app:error", "Ingresa una intuicion valida entre 1 y 100.");
      return;
    }

    room.guesses[socket.id] = guess;
    addLog(room, `${playerLabel(room, socket.id)} registro su intuicion.`);

    const nextPlayer = room.players.find((id) => id !== socket.id && !room.guesses[id]);
    if (nextPlayer) {
      room.currentTurn = nextPlayer;
    } else {
      calculateScores(room);
      room.phase = "resultado";
      room.currentTurn = null;
      addLog(room, "La conexion fue calculada.");
    }

    emitRoom(room);
  });

  socket.on("disconnect", () => {
    leaveCurrentRoom(socket);
  });
});

server.listen(PORT, () => {
  console.log(`Conexión 1-100 escuchando en puerto ${PORT}`);
});
