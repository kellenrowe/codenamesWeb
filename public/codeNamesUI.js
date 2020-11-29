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

/** switches current player and displays in dom */
function switchCurrentTeam() {
  console.debug("switchCurrentTeam");

  currentTeam === "Blue-Team"
    ? (currentTeam = "Red-Team")
    : (currentTeam = "Blue-Team");
  displayTeamTurn();
  clearInterval(intervalId);
  timer = false;
  timerBtn.text("Start Turn");
}

/** displays which team is going */
function displayTeamTurn() {
  console.debug("displayTeamTurn");

  $("#notifyTurn")
    .text(`${currentTeam}'s turn`)
    .attr("class", `${currentTeam}Color`);
}

/** calculates score and displays in DOM */
function populateScore() {
  console.debug("populateScore");

  let rScore = 8 - redScore;
  let bScore = 9 - blueScore;
  $("#blueTilesRmng").text(`${bScore} - `);
  $("#redTilesRmng").text(`${rScore}`);
}

/** Wipe the current board, show the loading spinner,
 * and update the button used to fetch data.
 */
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
    .text(`Send this link to your friends: ${BASE_LINK}${identifier}`)
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
