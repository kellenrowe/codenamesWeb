"use strict";
const PORT = "https://my-codenames.herokuapp.com/";

let socket = io();

function loadInitialData() {
  socket.emit('requestData');
}
loadInitialData();

socket.on('requestData', function () {
  socket.emit('syncInitialData', gameState);
});
    
socket.on("startGame", function (data) {
  gameState = { ...data };
  displayShuffledTeams();
  calculateScore();
  displayTeamTurn();
  $("#title").removeClass("typewriter");
});

socket.on("showLoadingView", function () {
  showLoadingView();
});

socket.on("updateAfterGameBoardClick", function (data) {
  gameState = { ...data };
  console.log('gameState.scoreboard = ', gameState.scoreboard)
  calculateScore();
  displayTeamTurn();
});

socket.on("switchCurrentTeam", function (data) {
  gameState = { ... data }
  displayTeamTurn();
});

socket.on("turnViewSelectOff", function () {
  selectView.off();
});

socket.on("timerBtnClicked", function () {
  handleTimer();
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

