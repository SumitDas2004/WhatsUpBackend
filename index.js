const express = require("express");
const connectTOMongo = require("./db");
const cors = require("cors");
const bodyParser = require("body-parser");
connectTOMongo();
const { createServer } = require("http");
const { Server } = require("socket.io");
const path = require('path')

const port = process.env.PORT;

const app = express();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL+process.env.FRONTEND_PORT,
  },
});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors({ origin: process.env.FRONTEND_URL+process.env.FRONTEND_PORT }));

app.use("/auth", require("./Routes/auth"));
app.use("/modifyfriends", require("./Routes/Modifyfirends"));
app.use("/communicate", require("./Routes/communicate"));

const onlineUsers = new Set();

io.on("connection", (socket) => {
  socket.on("add-user", (data) => {
    onlineUsers.add(data);
    socket.join(data);
    io.sockets.emit("online-users", [...onlineUsers]);
  });
  socket.on("disconnect", () => {});

  socket.on("remove-user", (data) => {
    onlineUsers.delete(data);
    socket.leave(data);
    io.sockets.emit("online-users", [...onlineUsers]);
  });

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
  });

  socket.on("send-message", (data) => {
    socket.to(data.roomId).emit("received-message", data.message);
  });

  socket.on("client-typing", (data) => {
    socket.to(data).emit("server-typing", data);
  });

  socket.on("send-request", (data) => {
    socket.broadcast.to(data).emit("receive-request");
  });

  socket.on("send-notification", (data) => {
    socket.broadcast.to(data).emit("receive-notification");
  });
  socket.on('read-message', (data)=>{
    socket.broadcast.emit('mark-message', data);
  })
});



const __dirname1 = path.resolve();
if(process.env.NODE_ENV==='production'){
  app.use(express.static(path.join(__dirname1, '/frontend/dist')))

  app.get('*', (req, res)=>{
    res.sendFile(path.resolve(__dirname1, "frontend", "dist", "index.html"));
  })
}else{
  app.get("/",(req, res)=>{
    res.send("API is running successfully");
  })
}

httpServer.listen(port, () => {
  console.log(`App running in port ${process.env.PORT}`);
});
