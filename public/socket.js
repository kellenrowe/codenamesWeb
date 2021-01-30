"use strict";

// const PORT = 'codenames.kellen-rowe.com';

// const PORT = "https://localhost:8000";
const PORT = "https://my-codenames.herokuapp.com/";

// const socket = io.connect(`http://${PORT}`);

let socket = io();

function loadInitialData() {
  socket.emit('requestData');
}
loadInitialData();

socket.on('requestData', function () {
  socket.emit('syncInitialData', gameState);
});

// socket.on('syncInitialData', function (data) {
// });
    
    
socket.on("startGame", function (data) {
  gameState = data;
  
  displayShuffledTeams();
  calculateScore();
  displayTeamTurn();
  $("#title").removeClass("typewriter");
});

socket.on("showLoadingView", function () {
  showLoadingView();
});

socket.on("updateAfterGameBoardClick", function (data) {
  gameState = data;
  calculateScore();
  displayTeamTurn();
});


timerBtn.on("click", function () {
  socket.emit("timerBtnClicked");
});

socket.on("turnViewSelectOff", function () {
  selectView.off();
});

socket.on("timerBtnClicked", function () {
  handleTimer();
  displayTeamTurn();
});

socket.on('flipCard', function(data) {
  handleClasses(data);
});

socket.on('endGame', function () {
  endGame();
});

restartBtn.on("click", function () {
  socket.emit("reloadSockets");
});

socket.on("reloadSockets", function () {
  makeNewGame();
});

