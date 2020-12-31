"use strict";

const BASE_API_URL = "http://api.datamuse.com/words?ml=";

const HEIGHT = 5;
const WIDTH = 5;
const TURN_LENGTH = 120; // 2 minutes
const BASE_LINK = "http://codenames.kellen-rowe.com/"; 

let restartBtn = $("#restartBtn");
let timerBtn = $("#timerBtn");
let loadGameBtn = $("#words-form");

let timer = false;
let intervalId;

let topicsArray = [];
let wordsArray = [];

let gameState = {
  boardData: [],
  scoreboard: {
    redScore: 0,
    blueScore: 0,
  },
  currentTeam: "Blue-Team",
}


/** creates and starts turn / timer */
function startTimer() {
  console.debug("startTimer");

  let time = TURN_LENGTH,
    minutes,
    seconds;
  intervalId = setInterval(function () {
    minutes = parseInt(time / 60, 10);
    seconds = parseInt(time % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    $("#timer").text(minutes + ":" + seconds);

    if (--time < 0) {
      time = TURN_LENGTH;
    }
  }, 1000);
  return intervalId;
}


/** on click: controls timer reset, and signifier */
function handleTimer() {
  console.debug("handleTimer");

  if (!timer) {
    intervalId = startTimer();
    timer = true;
    timerBtn.text("Stop Timer");
  } else {
    clearInterval(intervalId);
    timer = false;
    switchCurrentTeam();
    timerBtn.text("Start Timer");
  }
}


/** returns array of words input by user */
function getTopics() {
  console.debug("getTopics");

  let topic1 = $("#topic1").val();
  let topic2 = $("#topic2").val();
  let topic3 = $("#topic3").val();

  topicsArray = [topic1, topic2, topic3];
  return topicsArray;
}


/** makes get request for each word in topicsArray and returns array of
 *  all words 
 * */
async function getWords(topicsArray) {
  console.debug("getWords");
  let words = [];
  for (let topic of topicsArray) {
    let response = await axios({
      url: `${BASE_API_URL}${topic}`,
      method: "GET",
    });
    for (let i = 0; i < response.data.length; i++) {
      let word = response.data[i].word;
      words.push(word);
    }
  }
  return words;
}


/** creates HEIGHT * WIDTH # of board pieces with words and team assignments.
 *  places board piece info into gameState.boardData array.
 */
function makesCells() {
  console.debug("fillTable");
  $("div .row").empty();

  let red = 0;
  let blue = 0;
  let grey = 0;

  for (let i = 0; i < HEIGHT * WIDTH; i++) {
    if (red < 8) {
      gameState.boardData[i] = {
        element: "div",
        class: "cells red",
        word: `${wordsArray[i]}`
      }
      red++;
    } else if (blue < 9) {
      gameState.boardData[i] = {
        element: "div",
        class: "cells blue",
        word: `${wordsArray[i]}`
      }
      blue++;
    } else if (grey < 7) {
      gameState.boardData[i] = {
        element: "div",
        class: "cells grey",
        word: `${wordsArray[i]}`
      }
      grey++;
    } else {
      gameState.boardData[i] = {
        element: "div",
        class: "cells black",
        word: `${wordsArray[i]}`
      }
    }
  }
}


/** Shuffle array items in-place and return shuffled array. */
function shuffle(items) {
  console.debug("shuffle");
  for (let i = items.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * i);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}


/** increments score,
 * handles percieved flip of a cell by adding class,
 * makes calls to: switch teams, end the game
 */
function handleClicks(evt) {
  console.debug("handleClicks");
  console.log('evt', evt.target.id)

  if (gameState.currentTeam === "Blue-Team") {
    if ($(evt.target).hasClass("red")) {
      socket.emit("flipCard", { card: `${evt.target.id}`, color: "turn-red" });
      gameState.scoreboard.redScore++;
      socket.emit("timerBtnClicked");
      switchCurrentTeam();
    } else if ($(evt.target).hasClass("blue")) {
      socket.emit("flipCard", { card: `${evt.target.id}`, color: "turn-blue" });
      gameState.scoreboard.blueScore++;
    }
  } else {
    if ($(evt.target).hasClass("red")) {
      socket.emit("flipCard", { card: `${evt.target.id}`, color: "turn-red" });
      gameState.scoreboard.redScore++;
    } else if ($(evt.target).hasClass("blue")) {
      socket.emit("flipCard", { card: `${evt.target.id}`, color: "turn-blue" });
      gameState.scoreboard.blueScore++;
      socket.emit("timerBtnClicked");
      switchCurrentTeam();
    }
  }
  if ($(evt.target).hasClass("grey")) {
    socket.emit("flipCard", { card: `${evt.target.id}`, color: "turn-grey" });
    socket.emit("timerBtnClicked");
    switchCurrentTeam();
  }
  if ($(evt.target).hasClass("black")) {
    socket.emit("flipCard", { card: `${evt.target.id}`, color: "turn-black" });
    socket.emit("timerBtnClicked");
    switchCurrentTeam();
    // endGame();
    socket.emit("updateAfterGameBoardClick", gameState);
    socket.emit("endGame")
    return
  }
  if (gameState.scoreboard.blueScore === 9
    || gameState.scoreboard.redScore === 8) {
    // endGame();
    socket.emit("endGame")
    return
  }
  socket.emit("updateAfterGameBoardClick", gameState);
  $(".selectView-form").off();
}


/** Announces the winner, 
 *  reveals teams for each cell,
 *  removes event listener from gameboard
 * */
function endGame() {
  $(".winner h1").text(`${gameState.currentTeam} wins!!`);
  if (gameState.currentTeam === "Blue-Team") {
    $(".winner").addClass("turn-blue").show("slow");
  } else {
    $(".winner").addClass("turn-red").show("slow");
  }

  let cellsArray = $("div .cells").toArray();
  setTimeout(makeViewForSpymaster, 2000, cellsArray);

  $(".gameBoard").off();
  $(".currentTeam").empty();
  $(".selectView-form").hide();
}

/** reloads page and lets players input new words for a new game */
function makeNewGame() {
  console.debug("makeNewGame");
  location.reload();
}


/** takes in array of cells
 *  calls shuffle to randomize team placements
 *  displays cells in DOM
 */
function displayShuffledTeams() {
  console.debug("displayShuffledTeams");
  
  for (let i = 0; i < HEIGHT; i++) {
    for (let j = 0; j < WIDTH; j++) {
      let cell = gameState.boardData[0];
      $(`.row${i}`)
        .append(`<div id=${i}-${j}>${cell.word}</div>`);
      $(`#${i}-${j}`).attr("class", `${cell.class}`)
      gameState.boardData.shift();
    }
  }
  hideLoadingView();
}


/** makes calls to:
 * fetch topics and words
 * shuffle and trim words array
 * make cells
 * display cells in DOM
 */
async function setupGameBoard() {
  console.debug("setupGameBoard");
  
  topicsArray = await getTopics();
  wordsArray = await getWords(topicsArray);
  wordsArray = shuffle(wordsArray);
  wordsArray.splice(HEIGHT * WIDTH);
  
  makesCells();
  gameState.boardData = shuffle(gameState.boardData)

  socket.emit("startGame", gameState);
}


/** resets game variables and event listener
 * shows the loading view
 * makes call to setup game board
 */
function startGame(evt) {
  console.debug("startGame");
  evt.preventDefault();

  gameState["identifier"] = $("#identifier").val();
  showLoadingView();
  setTimeout(setupGameBoard, 2000);

  $(".gameBoard").on("click", ".cells", handleClicks);
  $(".selectView-form").on("click", "label", determineView);
}

// event listeners
loadGameBtn.on("submit", startGame);
// restartBtn.on("click", makeNewGame);
// timerBtn.on("click", handleTimer);
