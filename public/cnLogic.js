"use strict";

const BASE_API_URL = "http://api.datamuse.com/words?ml=";

const HEIGHT = 5;
const WIDTH = 5;
const TURN_LENGTH = 120; // 2 minutes
const BASE_LINK = "http://codenamesgame.com/"; // whatever url i get

const restartBtn = $("#restartBtn");
const timerBtn = $("#timerBtn");
const loadGameBtn = $("#words-form");

let identifier;
let redScore = 0;
let blueScore = 0;
let currentTeam;
let timer = false;
let intervalId;

let topicsArray = [];
let wordsArray = [];

/** creates and starts turn timer */
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
    timerBtn.text("End Turn");
  } else {
    clearInterval(intervalId);
    timer = false;
    timerBtn.text("Start Turn");
    switchCurrentTeam();
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
 * all words */
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

/** creates HEIGHT * WIDTH # of divs with words and team assignments */
function makesCells() {
  console.debug("fillTable");
  $("div .row").empty();

  let cellsArray = [];
  let cell;
  let red = 0;
  let blue = 0;
  let grey = 0;

  for (let i = 0; i < HEIGHT * WIDTH; i++) {
    if (red < 8) {
      cell = $("<div>").attr("class", "cells align-middle text-center red");
      red++;
    } else if (blue < 9) {
      cell = $("<div>").attr("class", "cells align-middle text-center blue");
      blue++;
    } else if (grey < 7) {
      cell = $("<div>").attr("class", "cells align-middle text-center grey");
      grey++;
    } else {
      cell = $("<div>").attr("class", "cells align-middle text-center black");
    }
    cell.append(`${wordsArray[0]}`);
    wordsArray.shift();
    cellsArray.push(cell);
  }
  return cellsArray;
}

/** Shuffle array items in-place and return shuffled array. */
function shuffle(items) {
  console.debug("shuffle");
  for (let i = items.length - 1; i > 0; i--) {
    // generate a random index between 0 and i
    let j = Math.floor(Math.random() * i);
    // swap item at i <-> item at j
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

  if (currentTeam === "Blue-Team") {
    if ($(evt.target).hasClass("red")) {
      $(evt.target).addClass("turn-red");
      redScore++;
      switchCurrentTeam();
    } else if ($(evt.target).hasClass("blue")) {
      $(evt.target).addClass("turn-blue");
      blueScore++;
    }
    if (blueScore === 9 || redScore === 8) {
      endGame();
    }
  } else {
    if ($(evt.target).hasClass("red")) {
      $(evt.target).addClass("turn-red");
      redScore++;
    } else if ($(evt.target).hasClass("blue")) {
      $(evt.target).addClass("turn-blue");
      blueScore++;
      switchCurrentTeam();
    }
    if (blueScore === 9 || redScore === 8) {
      endGame();
    }
  }
  if ($(evt.target).hasClass("grey")) {
    $(evt.target).addClass("turn-grey");
    switchCurrentTeam();
  }
  if ($(evt.target).hasClass("black")) {
    $(evt.target).addClass("turn-black");
    switchCurrentTeam();
    endGame();
  }
  populateScore();
  $(".selectView-form").off();
}

/** Announces the winner, removes event listener from gameboard, resets gameboard info */
function endGame() {
  $(".winner h1").text(`${currentTeam} wins!!`);
  if (currentTeam === "Blue-Team") {
    $(".winner").addClass("turn-blue").show("slow");
  } else {
    $(".winner").addClass("turn-red").show("slow");
  }

  $(".gameBoard").off();
  $(".currentTeam").empty();
  redScore = 0;
  blueScore = 0;
  topicsArray = [];
  wordsArray = [];
}

/** reloads page and lets players input new words for a new game */
function makeNewGame() {
  console.debug("makeNewGame");
  location.reload();
}

/** takes in array of cells
 * calls shuffle to randomize team placements
 * displays cells in DOM
 */
function displayShuffledTeams(cellsArray) {
  console.debug("displayShuffledTeams");
  cellsArray = shuffle(cellsArray);
  for (let i = 0; i < HEIGHT; i++) {
    for (let j = 0; j < WIDTH; j++) {
      let cell = cellsArray[0];
      $(`.row${i}`).append(cell);
      cell.attr("id", `${i}-${j}`);
      cellsArray.shift();
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
  $("#title").removeClass("typewriter");

  topicsArray = await getTopics();
  wordsArray = await getWords(topicsArray);
  wordsArray = shuffle(wordsArray);
  wordsArray.splice(HEIGHT * WIDTH);

  let cellsArray = makesCells();
  displayShuffledTeams(cellsArray);
}

/** resets game variables and event listener
 * shows the loading view
 * makes call to setup game board
 */
function startGame(evt) {
  console.debug("startGame");
  evt.preventDefault();

  currentTeam = "Blue-Team";
  identifier = $("#identifier").val();
  populateScore();
  displayTeamTurn();
  showLoadingView();
  setTimeout(setupGameBoard, 2000);

  $(".gameBoard").on("click", ".cells", handleClicks);
  $(".selectView-form").on("click", "label", determineView);
}

// event listeners

loadGameBtn.on("submit", startGame);
restartBtn.on("click", makeNewGame);
timerBtn.on("click", handleTimer);
