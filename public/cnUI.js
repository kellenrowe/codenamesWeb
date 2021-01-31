"use strict";

/** To make it easier for individual components to show just themselves, this
 * is a useful function that hides pretty much everything on the page. After
 * calling this, individual components can re-show just what they want.
 */
function hidePageComponents() {
  console.debug("hidePageComponents");
  const components = [
    loadGameBtn,
    gameBoard,
    $("h4"),
    restartBtn,
    $(".loadingWheel"),
    selectView,
    $("#score"),
    $("#link"),
    $("#timer"),
    timerBtn,
    $("#formTopRule"),
    $("#linkRule"),
  ];
  components.forEach((c) => c.hide());
}


/** adds / removes class based on information
 *  recieved from server after click
 */
function handleClasses(cardInfo) {
  let card = cardInfo.card;
  let color = cardInfo.color;
  $(`#${card}`).addClass(`${color}`);
  $(`#${card}`).removeClass(`flip`);
}


/** switches current player and displays in dom */
function switchCurrentTeam() {
  console.debug("switchCurrentTeam");

  gameState.currentTeam === "Blue-Team"
    ? (gameState.currentTeam = "Red-Team")
    : (gameState.currentTeam = "Blue-Team");

  socket.emit("switchCurrentTeam", gameState);
}


/** displays which team is going */
function displayTeamTurn() {
  console.debug("displayTeamTurn");

  $("#notifyTurn")
    .text(`${gameState.currentTeam}'s turn`)
    .attr("class", `${gameState.currentTeam}Color`);
}


/** calculates score and displays in DOM */
function calculateScore() {
  console.debug("calculateScore");

  let rScore = 8 - gameState.scoreboard.redScore;
  let bScore = 9 - gameState.scoreboard.blueScore;
  $("#blueTilesRmng").text(`${bScore} - `);
  $("#redTilesRmng").text(`${rScore}`);
}


/** hide page components & show the loading spinner */
function showLoadingView() {
  console.debug("showLoadingView");
  hidePageComponents();
  $("h4").show();
  $(".loadingWheel").show();
}


/** Remove the loading spinner and shows gamebaord with all features */
function hideLoadingView() {
  console.debug("hideLoadingView");

  hidePageComponents();
  gameBoard.show("slow");
  restartBtn.show("slow");
  selectView.show("slow");
  $("#score").show("slow");
  $("#timer").show("slow");
  timerBtn.show("slow");
  $("#linkRule").show("slow");
}


/** converts board to view for spymaster */
function makeViewForSpymaster() {
  console.debug("makeViewForSpymaster");
  let cellsArray = $("div .cells").toArray(); 

  for (let i = 0; i < cellsArray.length; i++) {
    if ($(cellsArray[i]).hasClass("red")) {
      $(cellsArray[i]).addClass("spymaster-red");
    } else if ($(cellsArray[i]).hasClass("blue")) {
      $(cellsArray[i]).addClass("spymaster-blue");
    } else if ($(cellsArray[i]).hasClass("grey")) {
      $(cellsArray[i]).addClass("spymaster-grey");
    } else {
      $(cellsArray[i]).addClass("spymaster-black");
    }
  }
  gameBoard.off();
  selectView.hide();
}

