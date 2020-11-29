"use strict";

const express = require("express");
const socket = require("socket.io");

const PORT = process.env.PORT || 8000;

// app setup
let app = express();

const server = app.listen(PORT, function () {
  console.log(`listening on ${PORT}`);
});

// static files
app.use(express.static("public"));

// socket setup
let io = socket(server);

io.on("connection", function (socket) {
  console.log('made a new connection: ', socket.id);
  

  // example server side from other apps //

  // socket.on('newGame', function (data) {
  //   io.sockets.emit('newGame', data);
  // });

  // socket.on('flipCard', function (data) {
  //   io.sockets.emit('flipCard', data);
  // });

  // socket.on('flipTimer', function (data) {
  //   io.sockets.emit('flipTimer', data);
  // });

  // socket.on('endGame', function (data) {
  //   io.sockets.emit('endGame', data);
  // });

});