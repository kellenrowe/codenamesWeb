"use strict";

const express = require("express");
const socket = require("socket.io");

const PORT = process.env.PORT || 8000;

// app setup
let app = express();
var http = require("http").createServer(app);

// static files
app.use(express.static("public"));

// socket setup
let io = socket(http);

io.on("connection", function (socket) {
  socket.on('requestData', function () {
    io.sockets.emit('requestData');
  });

  socket.on('syncInitialData', function (data) {
    io.sockets.emit('syncInitialData', data);
  });

  socket.on("startGame", function (data) {
    io.sockets.emit("startGame", data);
  });

  socket.on("showLoadingView", function () {
    io.sockets.emit("showLoadingView");
  });

  socket.on("updateAfterGameBoardClick", function (data) {
    io.sockets.emit("updateAfterGameBoardClick", data);
  });
  
  socket.on("switchCurrentTeam", function (data) {
    io.sockets.emit("switchCurrentTeam", data);
  });

  socket.on("turnViewSelectOff", function () {
    io.sockets.emit("turnViewSelectOff");
  });

  socket.on("timerBtnClicked", function () {
    io.sockets.emit("timerBtnClicked");
  });

  socket.on("flipCard", function (data) {
    io.sockets.emit("flipCard", data);
  });

  socket.on("endGame", function () {
    io.sockets.emit("endGame");
  });

  socket.on("reloadSockets", function () {
    io.sockets.emit("reloadSockets");
  });

});

const server = http.listen(PORT, function () {
  console.log(`listening on ${PORT}`);
});
