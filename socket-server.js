// socket-server.js
const { Server } = require("socket.io");

const io = new Server(3001, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Key: roomName, Value: Array of players [{ socketId, color }]
const chessRooms = {};

io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  // ==========================================
  // --- 1. GENERAL DIRECT MESSAGE CHANNELS ---
  // ==========================================
  socket.on("join_room", (userId) => {
    socket.join(userId);
    console.log(`👤 User with ID ${userId} joined their chat channel.`);
  });

 socket.on("send_message", (data) => {
    const { recipientId, senderId, senderName, content, replyTo } = data;
    console.log(`✉️ Message from ${senderName} (replyTo: ${replyTo ? 'Yes' : 'No'}): "${content}"`);

    const formattedMessage = {
      senderId,
      senderName,
      content,
      replyTo, // Relays { id, content, sender: { username } } metadata to the clients
      createdAt: new Date().toISOString()
    };

    io.to(recipientId).emit("receive_message", formattedMessage);
    io.to(senderId).emit("receive_message", formattedMessage);
  });


  // ==========================================
  // --- 2. MULTIPLAYER CHESS MATCHMAKING ---
  // ==========================================
  socket.on("join_chess", (room) => {
    socket.join(room);

    if (!chessRooms[room]) {
      chessRooms[room] = [];
    }

    const players = chessRooms[room];

    // Check if the user is already registered in this room (prevent duplicates on refresh)
    const existingPlayer = players.find(p => p.socketId === socket.id);
    if (existingPlayer) {
      socket.emit("player_color", existingPlayer.color);
      return;
    }

    if (players.length === 0) {
      // First player is assigned White
      players.push({ socketId: socket.id, color: "white" });
      socket.emit("player_color", "white");
      console.log(`♟️ Player 1 (${socket.id}) joined chess room "${room}" as White`);
    } else if (players.length === 1) {
      // Second player is assigned Black
      players.push({ socketId: socket.id, color: "black" });
      socket.emit("player_color", "black");
      console.log(`♟️ Player 2 (${socket.id}) joined chess room "${room}" as Black`);

      // Both players are in! Notify the room that the game can begin
      io.to(room).emit("chess_ready");
      console.log(`🏁 Chess room "${room}" is full. Match starting...`);
    } else {
      // Third+ players join as spectators
      socket.emit("player_color", "spectator");
      console.log(`👀 Spectator (${socket.id}) joined chess room "${room}"`);
    }
  });

  // Relay chess move FENs
  socket.on("send_chess_move", (data) => {
    const { room, moveFen } = data;
    socket.to(room).emit("receive_chess_move", moveFen);
    console.log(`♟️ Chess move transmitted in room: ${room}`);
  });


  // ==========================================
  // --- 3. COLLABORATIVE CODING SYNC ---
  // ==========================================
  socket.on("join_coding", (room) => {
    socket.join(room);
    console.log(`💻 Client joined collaborative coding room: ${room}`);
  });

  socket.on("send_code", (data) => {
    const { room, code, language } = data;
    // Broadcast code updates to all other clients in the room
    socket.to(room).emit("receive_code", { code, language });
  });

  // Coding Arena control tokens and race win events
  socket.on("request_control", (data) => {
    const { room, senderName } = data;
    // Broadcast to the other user that keyboard lock is requested
    socket.to(room).emit("control_requested", { senderName, socketId: socket.id });
  });

  socket.on("release_control", (room) => {
    // Notify the other user that the keyboard is now unlocked and available
    socket.to(room).emit("control_released");
  });

  socket.on("race_win", (data) => {
    const { room, winnerName } = data;
    // Broadcast victory banner to everyone in the room
    io.to(room).emit("receive_race_win", { winnerName });
  });


  // ==========================================
  // --- 4. DISCONNECT CLEANUP ---
  // ==========================================
  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);

    // Clean up active chess rooms and notify remaining players
    for (const room in chessRooms) {
      const initialLength = chessRooms[room].length;
      chessRooms[room] = chessRooms[room].filter(p => p.socketId !== socket.id);

      if (chessRooms[room].length === 0) {
        delete chessRooms[room];
        console.log(`🧹 Empty chess room "${room}" deleted.`);
      } else if (chessRooms[room].length < initialLength) {
        // If a player left and one remains, notify them of the forfeit
        io.to(room).emit("opponent_left");
        console.log(`⚠️ Opponent left chess room "${room}". Notified remaining player.`);
      }
    }
  });
});

console.log("⚡ Rhemaka Socket.io Server running on port 3001");