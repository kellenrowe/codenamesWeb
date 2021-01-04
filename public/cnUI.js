"use strict";

/** To make it easier for individual components to show just themselves, this
 * is a useful function that hides pretty much everything on the page. After
 * calling this, individual components can re-show just what they want.
 */
function hidePageComponents() {
  console.debug("hidePageComponents");
  const components = [
    loadGameBtn,
    $(".gameBoard"),
    $("h4"),
    restartBtn,
    $(".loadingWheel"),
    $(".selectView-form"),
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
  // $("#title").removeClass("typewriter");
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

  clearInterval(intervalId);
  socket.emit("updateAfterGameBoardClick", gameState);
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
  $(".gameBoard").show("slow");
  restartBtn.show("slow");
  $(".selectView-form").show("slow");
  $("#score").show("slow");
  $("#timer").show("slow");
  timerBtn.show("slow");
  $("#link")
    .text(`Invite friends: ${BASE_LINK}`)
    .show("slow");
  $("#linkRule").show("slow");
}


/** recieves input from radio button to determine which view the user
 * sees. changes checked status and calls to makeViewFor player or spymaster
 */
function determineView(evt) {
  console.debug("determineView");
  evt.preventDefault();

  if ($(evt.target).hasClass("spymaster")) {
    $("input:radio[name=view]")[0].checked = false;
    $("input:radio[name=view]")[1].checked = true;
  } else {
    $("input:radio[name=view]")[1].checked = false;
    $("input:radio[name=view]")[0].checked = true;
  }

  let view = $("input[name=view]:checked").val();
  let cellsArray = $("div .cells").toArray();

  if (view === "Spymaster") {
    makeViewForSpymaster(cellsArray);
  } else {
    makeViewForPlayer(cellsArray);
  }
}


/** converts board to view for spymaster */
function makeViewForSpymaster(array) {
  console.debug("makeViewForSpymaster");

  for (let i = 0; i < array.length; i++) {
    if ($(array[i]).hasClass("red")) {
      $(array[i]).addClass("turn-red");
    } else if ($(array[i]).hasClass("blue")) {
      $(array[i]).addClass("turn-blue");
    } else if ($(array[i]).hasClass("grey")) {
      $(array[i]).addClass("turn-grey");
    } else {
      $(array[i]).addClass("turn-black");
    }
  }
}


/** converts board back to player view */
function makeViewForPlayer(array) {
  console.debug("makeViewForPlayer");

  for (let i = 0; i < array.length; i++) {
    $(array[i]).removeClass("turn-red turn-blue turn-grey turn-black");
  }
}
