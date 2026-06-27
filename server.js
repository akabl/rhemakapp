// server.js
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

// Initialize Next.js compilation engine
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store active chess matchmaker rooms
const chessRooms = {};

app.prepare().then(() => {
  // Create a standard HTTP server
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl); // Direct normal requests to Next.js handler
  });

  // Attach Socket.io to the SAME HTTP server on the same port!
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Restricts cross-origin resource sharing
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 Connected to unified server:", socket.id);

    // --- 1. DIRECT MESSAGE CHANNELS ---
    socket.on("join_room", (userId) => {
      socket.join(userId);
      console.log(`👤 User with ID ${userId} joined their chat channel.`);
    });

    socket.on("send_message", (data) => {
      const { recipientId, senderId, senderName, content } = data;
      const formattedMessage = {
        senderId,
        senderName,
        content,
        createdAt: new Date().toISOString()
      };
      io.to(recipientId).emit("receive_message", formattedMessage);
      io.to(senderId).emit("receive_message", formattedMessage);
    });

    // --- 2. MULTIPLAYER CHESS ---
    socket.on("join_chess", (room) => {
      socket.join(room);
      if (!chessRooms[room]) chessRooms[room] = [];
      const players = chessRooms[room];

      const existingPlayer = players.find(p => p.socketId === socket.id);
      if (existingPlayer) {
        socket.emit("player_color", existingPlayer.color);
        return;
      }

      if (players.length === 0) {
        players.push({ socketId: socket.id, color: "white" });
        socket.emit("player_color", "white");
      } else if (players.length === 1) {
        players.push({ socketId: socket.id, color: "black" });
        socket.emit("player_color", "black");
        io.to(room).emit("chess_ready");
      } else {
        socket.emit("player_color", "spectator");
      }
    });

    socket.on("send_chess_move", (data) => {
      const { room, moveFen } = data;
      socket.to(room).emit("receive_chess_move", moveFen);
    });

    // --- 3. COLLABORATIVE CODING ---
    socket.on("join_coding", (room) => {
      socket.join(room);
    });

    socket.on("send_code", (data) => {
      const { room, code, language } = data;
      socket.to(room).emit("receive_code", { code, language });
    });

    socket.on("request_control", (data) => {
      const { room, senderName } = data;
      socket.to(room).emit("control_requested", { senderName, socketId: socket.id });
    });

    socket.on("release_control", (room) => {
      socket.to(room).emit("control_released");
    });

    socket.on("race_win", (data) => {
      const { room, winnerName } = data;
      io.to(room).emit("receive_race_win", { winnerName });
    });

    // --- 4. DISCONNECT CLEANUP ---
    socket.on("disconnect", () => {
      for (const room in chessRooms) {
        const initialLength = chessRooms[room].length;
        chessRooms[room] = chessRooms[room].filter(p => p.socketId !== socket.id);
        if (chessRooms[room].length === 0) {
          delete chessRooms[room];
        } else if (chessRooms[room].length < initialLength) {
          io.to(room).emit("opponent_left");
        }
      }
    });
  });

  // Start the consolidated server
  httpServer.listen(port, () => {
    console.log(`> Rhemaka Unified Server ready on port ${port}`);
  });
});