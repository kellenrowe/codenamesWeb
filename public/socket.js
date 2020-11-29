"use strict";

// make connection
// const PORT = 'codenames.kellen-rowe.com';
const PORT = 'localhost:8000';
const socket = io.connect(`http://${PORT}`);




/** example front end emits from other apps */

// const flipTimerEvent = () => {
//   socket.emit('flipTimer');
// };

// const endGameEvent = () => {
//   socket.emit('endGame');
// };

// socket.on('handleClicks', function(data) {
//   handleClicks(data);
// });

// socket.on('handleTimer', function (data) {
//   handleTimer();
// });

// socket.on('startTimer', function (data) {
//   startTimer();
// });

// socket.on('endGame', function (data) {
//   endGame();
// });
