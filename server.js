const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const colors = ["white", "black", "red", "blue", "green"];
let colorIndex = 0;

io.on("connection", (socket) => {
  socket.emit("colorChange", colors[colorIndex]);

  socket.on("changeColor", () => {
    colorIndex = (colorIndex + 1) % colors.length;
    io.emit("colorChange", colors[colorIndex]);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Servidor activo");
});