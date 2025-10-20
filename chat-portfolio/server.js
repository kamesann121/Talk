const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// publicãƒ•ã‚©ãƒ«ãƒ€ã‚’é™çš„ãƒ•ã‚¡ã‚¤ãƒ«ã¨ã—ã¦æä¾›
app.use(express.static(path.join(__dirname, 'public')));

// ãƒ¦ãƒ¼ã‚¶ãƒ¼ç®¡ç†
const activeUsers = new Map(); // ãƒ‹ãƒƒã‚¯ãƒãƒ¼ãƒ  â†’ socket.id
const userIcons = new Map();   // ãƒ‹ãƒƒã‚¯ãƒãƒ¼ãƒ  â†’ ã‚¢ã‚¤ã‚³ãƒ³
const bannedUsers = new Set();

// ã‚¢ã‚¤ã‚³ãƒ³ã®ãƒ©ãƒ³ãƒ€ãƒ é¸æŠž
function getRandomIcon() {
  const icons = ["ðŸ¦", "ðŸ¶", "ðŸ§", "ðŸ¸", "ðŸ¦‹", "ðŸ¼", "ðŸ°", "ðŸ¯"];
  return icons[Math.floor(Math.random() * icons.length)];
}

// ã‚½ã‚±ãƒƒãƒˆæŽ¥ç¶šå‡¦ç†
io.on('connection', (socket) => {
  let nickname = "";

  socket.on("set nickname", (name) => {
    if (activeUsers.has(name) || bannedUsers.has(name)) {
      socket.emit("nickname rejected");
    } else {
      nickname = name;
      activeUsers.set(nickname, socket.id);
      userIcons.set(nickname, getRandomIcon());
      socket.emit("nickname accepted", userIcons.get(nickname));
    }
  });

  socket.on("chat message", ({ nickname, message }) => {
    if (bannedUsers.has(nickname)) {
      socket.emit("banned");
      return;
    }

    // ç®¡ç†è€…ã«ã‚ˆã‚‹BANã‚³ãƒžãƒ³ãƒ‰
    if (nickname === "admin" && message.startsWith("/ban ")) {
      const target = message.split(" ")[1];
      if (target) {
        bannedUsers.add(target);
        io.emit("chat message", {
          nickname: "system",
          icon: "ðŸš«",
          message: `${target} ã¯BANã•ã‚Œã¾ã—ãŸã€‚`
        });
      }
      return;
    }

    // ç®¡ç†è€…ã«ã‚ˆã‚‹BANè§£é™¤ã‚³ãƒžãƒ³ãƒ‰
    if (nickname === "admin" && message.startsWith("/unban ")) {
      const target = message.split(" ")[1];
      if (bannedUsers.has(target)) {
        bannedUsers.delete(target);
        io.emit("chat message", {
          nickname: "system",
          icon: "âœ…",
          message: `${target} ã®BANãŒè§£é™¤ã•ã‚Œã¾ã—ãŸã€‚`
        });
      }
      return;
    }

    // é€šå¸¸ãƒ¡ãƒƒã‚»ãƒ¼ã‚¸
    io.emit("chat message", {
      nickname,
      icon: userIcons.get(nickname),
      message
    });
  });

  socket.on("disconnect", () => {
    if (nickname) {
      activeUsers.delete(nickname);
      userIcons.delete(nickname);
    }
  });
});

// ã‚µãƒ¼ãƒãƒ¼èµ·å‹•
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`ðŸŒ ã‚µãƒ¼ãƒãƒ¼èµ·å‹•ä¸­ï¼ãƒãƒ¼ãƒˆ: ${PORT}`);
});
