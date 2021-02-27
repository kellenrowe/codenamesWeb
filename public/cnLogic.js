"use strict";

const BASE_API_URL = "https://api.datamuse.com/words?ml=";

const HEIGHT = 5;
const WIDTH = 5;
const TURN_LENGTH = 120; // 2 minutes

let restartBtn = $("#restartBtn");
let timerBtn = $("#timerBtn");
let loadGameBtn = $("#words-form");
let autoGenBtn = $("#autoGenBtn");
let gameBoard = $(".gameBoard");
let selectView = $("#spyView");

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
  console.log('timer should start');

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
    // switchCurrentTeam();
    timerBtn.text("Start Turn");
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
        class: "cells canFlip red",
        word: `${wordsArray[i]}`
      }
      red++;
    } else if (blue < 9) {
      gameState.boardData[i] = {
        element: "div",
        class: "cells canFlip blue",
        word: `${wordsArray[i]}`
      }
      blue++;
    } else if (grey < 7) {
      gameState.boardData[i] = {
        element: "div",
        class: "cells canFlip grey",
        word: `${wordsArray[i]}`
      }
      grey++;
    } else {
      gameState.boardData[i] = {
        element: "div",
        class: "cells canFlip black",
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


/** given an array of words returns array with all letters to lower case */
function changeCase(wordsArray) {
  let lowerCaseArray = [];
  for (let word of wordsArray) {
    lowerCaseArray.push(word.toLowerCase());
  }
  return lowerCaseArray;
}


/** increments score,
 * handles percieved flip of a cell by adding class,
 * makes calls to: switch teams, end the game
 */
function handleClicks(evt) {
  console.debug("handleClicks");
  if (!timer) {
    alert("Please click 'Start Turn' before making selection.");
    return;
  }

  if (gameState.currentTeam === "Blue-Team") {
    if (($(evt.target).hasClass("red"))
      && ($(evt.target).hasClass("canFlip"))) {
      socket.emit("flipCard", { card: `${evt.target.id}`, color: "turn-red" });
      gameState.scoreboard.redScore++;
      socket.emit("timerBtnClicked");
      switchCurrentTeam();
    } else if (($(evt.target).hasClass("blue"))
      && ($(evt.target).hasClass("canFlip"))) {
      socket.emit("flipCard", { card: `${evt.target.id}`, color: "turn-blue" });
      gameState.scoreboard.blueScore++;
    }
    if (gameState.scoreboard.blueScore === 9
      || gameState.scoreboard.redScore === 8) {
      socket.emit("endGame");
    }
  } else {
    if (($(evt.target).hasClass("red"))
      && ($(evt.target).hasClass("canFlip"))) {
      socket.emit("flipCard", { card: `${evt.target.id}`, color: "turn-red" });
      gameState.scoreboard.redScore++;
    } else if (($(evt.target).hasClass("blue"))
      && ($(evt.target).hasClass("canFlip"))) {
      socket.emit("flipCard", { card: `${evt.target.id}`, color: "turn-blue" });
      gameState.scoreboard.blueScore++;
      socket.emit("timerBtnClicked");
      switchCurrentTeam();
    }
    if (gameState.scoreboard.blueScore === 9
      || gameState.scoreboard.redScore === 8) {
      socket.emit("endGame");
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
    socket.emit("endGame");
    return
  }
  $(evt.target).removeClass("canFlip");
  
  socket.emit("updateAfterGameBoardClick", gameState);
  socket.emit("turnViewSelectOff");
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
    
    gameBoard.off();
    $(".currentTeam").empty();
    selectView.hide();
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


/**
 * fetches words from primary word list
 * shuffle and trim words array
 * make cells
 * display cells in DOM
 */
function autoGameBoard() {
  console.debug("autoGameBoard");
  
  wordsArray = shuffle(primaryWordsList);
  wordsArray.splice(HEIGHT * WIDTH);
  wordsArray = changeCase(wordsArray);
  
  makesCells();
  gameState.boardData = shuffle(gameState.boardData)

  socket.emit("startGame", gameState);
}


/** resets game variables and event listener
 * shows the loading view
 * makes call to MANUAL TOPICS board
 */
function startGame(evt) {
  console.debug("startGame");
  evt.preventDefault();

  socket.emit("showLoadingView");
  setTimeout(setupGameBoard, 2000);
}


/** resets game variables and event listener
 * shows the loading view
 * makes call to setup AUTO GENERATED game
 */
function startAutoGenGame(evt) {
  console.debug("startAutoGenGame");
  evt.preventDefault();

  socket.emit("showLoadingView");
  setTimeout(autoGameBoard, 2000);
}


// event listeners
loadGameBtn.on("submit", startGame);
autoGenBtn.on("click", startAutoGenGame);
gameBoard.on("click", ".cells", handleClicks);
selectView.on("click", makeViewForSpymaster);
timerBtn.on("click", function () {
  console.log('clicked');
  socket.emit("timerBtnClicked");
});


const primaryWordsList = [
  ' africa',
  '	agent',
  '	air',
  '	alien	',
  '	alps	',
  '	amazon	',
  '	AMBULANCE	',
  '	AMERICA	',
  '	ANGEL	',
  '	ANTARCTICA	',
  '	APPLE	',
  '	ARM	',
  '	ATLANTIS	',
  '	AUSTRALIA	',
  '	AZTEC	',
  '	BACK	',
  '	BALL	',
  '	BAND	',
  '	BANK	',
  '	BAR	',
  '	BARK	',
  '	BAT	',
  '	BATTERY	',
  '	BEACH	',
  '	BEAR	',
  '	BEAT	',
  '	BED	',
  '	BEIJING	',
  '	BELL	',
  '	BELT	',
  '	BERLIN	',
  '	BERMUDA	',
  '	BERRY	',
  '	BILL	',
  '	BLOCK	',
  '	BOARD	',
  '	BOLT	',
  '	BOMB	',
  '	BOND	',
  '	BOOM	',
  '	BOOT	',
  '	BOTTLE	',
  '	BOW	',
  '	BOX	',
  '	BRIDGE	',
  '	BRUSH	',
  '	BUCK	',
  '	BUFFALO	',
  '	BUG	',
  '	BUGLE	',
  '	BUTTON	',
  '	CALF	',
  '	CANADA	',
  '	CAP	',
  '	CAPITAL	',
  '	CAR	',
  '	CARD	',
  '	CARROT	',
  '	CASINO	',
  '	CAST	',
  '	CAT	',
  '	CELL	',
  '	CENTAUR	',
  '	CENTER	',
  '	CHAIR	',
  '	CHANGE	',
  '	CHARGE	',
  '	CHECK	',
  '	CHEST	',
  '	CHICK	',
  '	CHINA	',
  '	CHOCOLATE	',
  '	CHURCH	',
  '	CIRCLE	',
  '	CLIFF	',
  '	CLOAK	',
  '	CLUB	',
  '	CODE	',
  '	COLD	',
  '	COMIC	',
  '	COMPOUND	',
  '	CONCERT	',
  '	CONDUCTOR	',
  '	CONTRACT	',
  '	COOK	',
  '	COPPER	',
  '	COTTON	',
  '	COURT	',
  '	COVER	',
  '	CRANE	',
  '	CRASH	',
  '	CRICKET	',
  '	CROSS	',
  '	CROWN	',
  '	CYCLE	',
  '	CZECH	',
  '	DANCE	',
  '	DATE	',
  '	DAY	',
  '	DEATH	',
  '	DECK	',
  '	DEGREE	',
  '	DIAMOND	',
  '	DICE	',
  '	DINOSAUR	',
  '	DISEASE	',
  '	DOCTOR	',
  '	DOG	',
  '	DRAFT	',
  '	DRAGON	',
  '	DRESS	',
  '	DRILL	',
  '	DROP	',
  '	DUCK	',
  '	DWARF	',
  '	EAGLE	',
  '	EGYPT	',
  '	EMBASSY	',
  '	ENGINE	',
  '	ENGLAND	',
  '	EUROPE	',
  '	EYE	',
  '	FACE	',
  '	FAIR	',
  '	FALL	',
  '	FAN	',
  '	FENCE	',
  '	FIELD	',
  '	FIGHTER	',
  '	FIGURE	',
  '	FILE	',
  '	FILM	',
  '	FIRE	',
  '	FISH	',
  '	FLUTE	',
  '	FLY	',
  '	FOOT	',
  '	FORCE	',
  '	FOREST	',
  '	FORK	',
  '	FRANCE	',
  '	GAS	',
  '	GENIUS	',
  '	GERMANY	',
  '	GHOST	',
  '	GIANT	',
  '	GLASS	',
  '	GLOVE	',
  '	GOLD	',
  '	GRACE	',
  '	GRASS	',
  '	GREECE	',
  '	GREEN	',
  '	GROUND	',
  '	HAM	',
  '	HAND	',
  '	HAWK	',
  '	HEAD	',
  '	HEART	',
  '	HELICOPTER	',
  '	HIMALAYAS	',
  '	HOLE	',
  '	HOLLYWOOD	',
  '	HONEY	',
  '	HOOD	',
  '	HOOK	',
  '	HORN	',
  '	HORSE	',
  '	HORSESHOE	',
  '	HOSPITAL	',
  '	HOTEL	',
  '	ICE	',
  '	ICE CREAM	',
  '	INDIA	',
  '	IRON	',
  '	IVORY	',
  '	JACK	',
  '	JAM	',
  '	JET	',
  '	JUPITER	',
  '	KANGAROO	',
  '	KETCHUP	',
  '	KEY	',
  '	KID	',
  '	KING	',
  '	KIWI	',
  '	KNIFE	',
  '	KNIGHT	',
  '	LAB	',
  '	LAP	',
  '	LASER	',
  '	LAWYER	',
  '	LEAD	',
  '	LEMON	',
  '	LEPRECHAUN	',
  '	LIFE	',
  '	LIGHT	',
  '	LIMOUSINE	',
  '	LINE	',
  '	LINK	',
  '	LION	',
  '	LITTER	',
  '	LOCH NESS	',
  '	LOCK	',
  '	LOG	',
  '	LONDON	',
  '	LUCK	',
  '	MAIL	',
  '	MAMMOTH	',
  '	MAPLE	',
  '	MARBLE	',
  '	MARCH	',
  '	MASS	',
  '	MATCH	',
  '	MERCURY	',
  '	MEXICO	',
  '	MICROSCOPE	',
  '	MILLIONAIRE	',
  '	MINE	',
  '	MINT	',
  '	MISSILE	',
  '	MODEL	',
  '	MOLE	',
  '	MOON	',
  '	MOSCOW	',
  '	MOUNT	',
  '	MOUSE	',
  '	MOUTH	',
  '	MUG	',
  '	NAIL	',
  '	NEEDLE	',
  '	NET	',
  '	NEW YORK	',
  '	NIGHT	',
  '	NINJA	',
  '	NOTE	',
  '	NOVEL	',
  '	NURSE	',
  '	NUT	',
  '	OCTOPUS	',
  '	OIL	',
  '	OLIVE	',
  '	OLYMPUS	',
  '	OPERA	',
  '	ORANGE	',
  '	ORGAN	',
  '	PALM	',
  '	PAN	',
  '	PANTS	',
  '	PAPER	',
  '	PARACHUTE	',
  '	PARK	',
  '	PART	',
  '	PASS	',
  '	PASTE	',
  '	PENGUIN	',
  '	PHOENIX	',
  '	PIANO	',
  '	PIE	',
  '	PILOT	',
  '	PIN	',
  '	PIPE	',
  '	PIRATE	',
  '	PISTOL	',
  '	PIT	',
  '	PITCH	',
  '	PLANE	',
  '	PLASTIC	',
  '	PLATE	',
  '	PLATYPUS	',
  '	PLAY	',
  '	PLOT	',
  '	POINT	',
  '	POISON	',
  '	POLE	',
  '	POLICE	',
  '	POOL	',
  '	PORT	',
  '	POST	',
  '	POUND	',
  '	PRESS	',
  '	PRINCESS	',
  '	PUMPKIN	',
  '	PUPIL	',
  '	PYRAMID	',
  '	QUEEN	',
  '	RABBIT	',
  '	RACKET	',
  '	RAY	',
  '	REVOLUTION	',
  '	RING	',
  '	ROBIN	',
  '	ROBOT	',
  '	ROCK	',
  '	ROME	',
  '	ROOT	',
  '	ROSE	',
  '	ROULETTE	',
  '	ROUND	',
  '	ROW	',
  '	RULER	',
  '	SATELLITE	',
  '	SATURN	',
  '	SCALE	',
  '	SCHOOL	',
  '	SCIENTIST	',
  '	SCORPION	',
  '	SCREEN	',
  '	SCUBA DIVER	',
  '	SEAL	',
  '	SERVER	',
  '	SHADOW	',
  '	SHAKESPEARE	',
  '	SHARK	',
  '	SHIP	',
  '	SHOE	',
  '	SHOP	',
  '	SHOT	',
  '	SINK	',
  '	SKYSCRAPER	',
  '	SLIP	',
  '	SLUG	',
  '	SMUGGLER	',
  '	SNOW	',
  '	SNOWMAN	',
  '	SOCK	',
  '	SOLDIER	',
  '	SOUL	',
  '	SOUND	',
  '	SPACE	',
  '	SPELL	',
  '	SPIDER	',
  '	SPIKE	',
  '	SPINE	',
  '	SPOT	',
  '	SPRING	',
  '	SPY	',
  '	SQUARE	',
  '	STADIUM	',
  '	STAFF	',
  '	STAR	',
  '	STATE	',
  '	STICK	',
  '	STOCK	',
  '	STRAW	',
  '	STREAM	',
  '	STRIKE	',
  '	STRING	',
  '	SUB	',
  '	SUIT	',
  '	SUPERHERO	',
  '	SWING	',
  '	SWITCH	',
  '	TABLE	',
  '	TABLET	',
  '	TAG	',
  '	TAIL	',
  '	TAP	',
  '	TEACHER	',
  '	TELESCOPE	',
  '	TEMPLE	',
  '	THEATER	',
  '	THIEF	',
  '	THUMB	',
  '	TICK	',
  '	TIE	',
  '	TIME	',
  '	TOKYO	',
  '	TOOTH	',
  '	TORCH	',
  '	TOWER	',
  '	TRACK	',
  '	TRAIN	',
  '	TRIANGLE	',
  '	TRIP	',
  '	TRUNK	',
  '	TUBE	',
  '	TURKEY	',
  '	UNDERTAKER	',
  '	UNICORN	',
  '	VACUUM	',
  '	VAN	',
  '	VET	',
  '	WAKE	',
  '	WALL	',
  '	WAR	',
  '	WASHER	',
  '	WASHINGTON	',
  '	WATCH	',
  '	WATER	',
  '	WAVE	',
  '	WEB	',
  '	WELL	',
  '	WHALE	',
  '	WHIP	',
  '	WIND	',
  '	WITCH	',
  '	WORM	',
  '	YARD	',
  ' SPACE NEEDLE',
  ' KERRY PARK',
  ' DOUGH ZONE',
  ' LAKE UNION',
  ' BALLARD',
  ' STARBUCKS',
  ' GREENLAKE',
  ' DISCOVERY',
  ' CALIFORNIA',
  ' PORTLAND',
  ' VANCOUVER',
  ' SEATTLE FREEZE',
  ' AMAZON',
  ' PACIFIC',
  ' RAINIER',
  '	almond	',
  '	appetizer	',
  '	apple	',
  '	apricot	',
  '	artichoke	',
  '	asparagus	',
  '	avocado	',
  '	bacon	',
  '	bagel	',
  '	banana	',
  '	barbecue	',
  '	basil	',
  '	beans	',
  '	beet	',
  '	berry	',
  '	biscuit	',
  '	bitter	',
  '	blueberry	',
  '	boil	',
  '	bowl	',
  '	bread	',
  '	breakfast	',
  '	broccoli	',
  '	brownie	',
  '	brunch	',
  '	buns	',
  '	burrito	',
  '	butter	',
  '	cake	',
  '	candy	',
  '	cantaloupe	',
  '	caramel	',
  '	carrot	',
  '	cashew	',
  '	caviar	',
  '	celery	',
  '	cereal	',
  '	cheese	',
  '	cheesecake	',
  '	cherry	',
  '	chicken	',
  '	chili	',
  '	chips	',
  '	chocolate	',
  '	chopsticks	',
  '	cilantro	',
  '	cinnamon	',
  '	clam	',
  '	coconut	',
  '	coffee	',
  '	coleslaw	',
  '	collard greens	',
  '	cookie	',
  '	corn	',
  '	cornflakes	',
  '	cottage cheese	',
  '	crab	',
  '	crackers	',
  '	cranberry	',
  '	cream	',
  '	cream cheese	',
  '	crepe	',
  '	crust	',
  '	cucumber	',
  '	cupcake	',
  '	curry	',
  '	custard	',
  '	dairy	',
  '	dates	',
  '	dip	',
  '	dough	',
  '	doughnut	',
  '	dragonfruit	',
  '	dressing	',
  '	durian	',
  '	egg	',
  '	eggplant	',
  '	fig	',
  '	flan	',
  '	flour	',
  '	fork	',
  '	freezer	',
  '	French fries	',
  '	frosting	',
  '	fruit	',
  '	garlic	',
  '	ginger	',
  '	gingerbread	',
  '	glasses	',
  '	Gouda cheese	',
  '	grain	',
  '	granola	',
  '	grape	',
  '	grapefruit	',
  '	gravy	',
  '	green bean	',
  '	green tea	',
  '	guacamole	',
  '	guava	',
  '	gyro	',
  '	hamburger	',
  '	hazelnut	',
  '	herbs	',
  '	honey	',
  '	honeydew	',
  '	horseradish	',
  '	hot sauce	',
  '	hummus	',
  '	ice	',
  '	ice cream	',
  '	iced tea	',
  '	icing	',
  '	jalapeño	',
  '	jelly	',
  '	jellybeans	',
  '	juice	',
  '	kale	',
  '	kebab	',
  '	ketchup	',
  '	kettle corn	',
  '	kiwi	',
  '	knife	',
  '	ladle	',
  '	lasagna	',
  '	lemon	',
  '	lemonade	',
  '	lentils	',
  '	lettuce	',
  '	licorice	',
  '	lime	',
  '	loaf	',
  '	lollipop	',
  '	lychee	',
  '	macaroni	',
  '	macaroon	',
  '	mango	',
  '	maple syrup	',
  '	margarine	',
  '	marmalade	',
  '	marshmallow	',
  '	mashed potatoes	',
  '	mayonnaise	',
  '	melon	',
  '	menu	',
  '	meringue	',
  '	milk	',
  '	mint	',
  '	mochi	',
  '	mozzarella	',
  '	muffin	',
  '	mug	',
  '	mushroom	',
  '	mustard	',
  '	napkin	',
  '	nectarine	',
  '	noodles	',
  '	nut	',
  '	nutmeg	',
  '	oats	',
  '	oil	',
  '	olive	',
  '	omelet	',
  '	onion	',
  '	orange	',
  '	oregano	',
  '	oyster	',
  '	pancake	',
  '	papaya	',
  '	pasta	',
  '	pastry	',
  '	peach	',
  '	peanut butter	',
  '	pear	',
  '	pecan	',
  '	pepper	',
  '	persimmon	',
  '	pickle	',
  '	pie	',
  '	pineapple	',
  '	pita bread	',
  '	pizza	',
  '	plum	',
  '	pomegranate	',
  '	popcorn	',
  '	popsicle	',
  '	potato	',
  '	pretzel	',
  '	pudding	',
  '	pumpkin	',
  '	quinoa	',
  '	radish	',
  '	raisin	',
  '	raspberry	',
  '	ravioli	',
  '	recipe	',
  '	relish	',
  '	restaurant	',
  '	rhubarb	',
  '	rice	',
  '	roast	',
  '	romaine	',
  '	rosemary	',
  '	rye	',
  '	salad	',
  '	salami	',
  '	salsa	',
  '	salt	',
  '	sandwich	',
  '	sauce	',
  '	sauerkraut	',
  '	scallops	',
  '	seaweed	',
  '	shrimp	',
  '	soda	',
  '	soup	',
  '	soybeans	',
  '	spaghetti	',
  '	spatula	',
  '	spinach	',
  '	spoon	',
  '	sprinkles	',
  '	sprouts	',
  '	squash	',
  '	squid	',
  '	steak	',
  '	stir-fry	',
  '	straw	',
  '	strawberry	',
  '	sugar	',
  '	sundae	',
  '	sushi	',
  '	sweet potato	',
  '	taco	',
  '	tamale	',
  '	tangerine	',
  '	tapioca	',
  '	taro	',
  '	tea	',
  '	teriyaki	',
  '	toast	',
  '	toffee	',
  '	tofu	',
  '	tomato	',
  '	torte	',
  '	tortilla	',
  '	turkey	',
  '	vanilla	',
  '	vegetable	',
  '	vinegar	',
  '	wafer	',
  '	waffle	',
  '	walnut	',
  '	wasabi	',
  '	water	',
  '	watermelon	',
  '	wheat	',
  '	whipped cream	',
  '	wok	',
  '	yogurt	',
  '	yolk	',
  '	zucchini	',
  '	quarantine	',
  '	elderly	',
  '	disease	',
  '	virus	',
  '	zoom	',
  '	wfh	',
  '	facemask	',
  '	frontlines	',
  '	glove	',
  '	hospital	',
  '	emergency	',
  '	epicenter	',
  '	virtual	',
  '	lockdown	',
  '	home	',
  '	healthy	',
  '	stream	',
  '	Netflix	',
  '	toilet paper	',
  '	groceries	',
  '	hoard	',
  '	economy	',
  '	legislation	',
  '	unemployment	',
  '	public	',
  '	germs	',
  '	cough	',
  '	immunity	',
  '	bat	',
  '	market	',
  '	instagram	',
  '	doctor	',
  '	nurse	',
  '	cook	',
  '	bake	',
  '	recipe	',
  '	social	',
  '	distance	',
  '	aerosol	',
  '	temperature	',
  '	manufacture	',
  '	spread	',
  '	care	',
  '	bed	',
  '	breathe	',
  '	police	',
  '	order	',
  '	mandate	',
  '	isolation	',
  '	tik tok	',
  '	challenge	',
  '	tag	',
  '	video	',
  '	coffee	',
  '	wine	',
  '	happy hour	',
  '	conference	',
  '	restaurant	',
  '	delivery	',
  '	postmates	',
  '	uber eats	',
  '	contactless	',
  '	disney	',
  '	tiger king	',
  '	fight	',
  '	cure	',
  '	support	',
  '	scrubs	',
  '	soap	',
  '	sanitizer	',
  '	alcohol	',
  '	snacks	',
  '	news	',
  '	vaccine	',
  '	shortage	',
  '	online	',
  '	facetime	',
  '	connect	',
  '	stock	',
  '	jackbox	',
  '	test	',
  '	number	',
  '	positive	',
  '	negative	',
  '	flu	',
  '	hands	',
  '	spring	',
  '	gymnasium	',
  '	retirement	',
  '	death	',
  '	safe	',
  '	droplet	',
  '	governor	',
  '	Congress	',
  '	election	',
  '	postpone	',
  '	essential	',
  '	unprecedented	',
  '	time	',
  '	mutate	',
  '	state	',
  '	theory	',
  '	research	',
  '	incubation	',
  '	14 days	',
  '	scientist	',
  '	resources	',
  '	life	',
  '	consult	',
  '	end	',
  '	six feet	',
  '	cover	',
  '	mouth	',
  '	nose	',
  '	lungs	',
  '	treat	',
  '	medicine	',
  '	pharmacy	',
  '	prescription	',
  '	drug	',
  '	cookies	',
  '	chips	',
  '	HBO	',
  '	movie	',
  '	benefit	',
  '	insurance	',
  '	puppy	',
  '	friend	',
  '	relative	',
  '	travel	',
  '	refund	',
  '	airline	',
  '	plane	',
  '	gardening	',
  '	yoga	',
  '	balcony	',
  '	sing	',
  '	amazon	',
  '	business	',
  '	paycheck	',
  '	loan	',
  '	bankrupt	',
  '	people	',
  '	citizen	',
  '	city	',
  '	team	',
  '	work	',
  '	healthcare	',
  '	closed	',
  '	open	',
  '	announce	',
  '	ferret	',
  '	clean	',
  '	disinfect	',
  '	wash	',
  '	touch	',
  '	eyes	',
  '	inside	',
  '	park	',
  '	gathering	',
  '	global	',
  '	pandemic	',
  '	ration	',
  '	read	',
  '	extrovert	',
  '	podcast	',
  '	show	',
  '	binge	',
  '	stop	',
  '	change	',
  '	gene	',
  '	symptom 	',
  '	aerobics	',
  '	archery	',
  '	arena	',
  '	arrow	',
  '	athlete	',
  '	athletics	',
  '	badminton	',
  '	baseball	',
  '	basketball	',
  '	bat	',
  '	batter	',
  '	batting	',
  '	bicycle	',
  '	billiards	',
  '	bobsleigh	',
  '	bocce	',
  '	boomerang	',
  '	boules	',
  '	bowler	',
  '	bowling	',
  '	boxer	',
  '	bronze medal	',
  '	canoe	',
  '	catcher	',
  '	championship	',
  '	cleats	',
  '	club	',
  '	coach	',
  '	compete	',
  '	crew	',
  '	cricket	',
  '	cross country	',
  '	cyclist	',
  '	dartboard	',
  '	deadlifting	',
  '	defense	',
  '	diamond	',
  '	diver	',
  '	dodgeball	',
  '	dugout	',
  '	equestrian	',
  '	equipment	',
  '	exercise	',
  '	fencing	',
  '	field	',
  '	figure skating	',
  '	fitness	',
  '	football	',
  '	forward	',
  '	free throw	',
  '	Frisbee	',
  '	goal	',
  '	goalie	',
  '	gold medal	',
  '	golf	',
  '	gym	',
  '	gymnastics	',
  '	halftime	',
  '	handball	',
  '	hang gliding	',
  '	helmet	',
  '	hockey	',
  '	home run	',
  '	hoop	',
  '	huddle	',
  '	hurdle	',
  '	ice hockey	',
  '	ice rink	',
  '	ice skates	',
  '	inline skates	',
  '	jog	',
  '	jump rope	',
  '	karate	',
  '	kayak	',
  '	kite	',
  '	kung fu	',
  '	lacrosse	',
  '	martial arts	',
  '	net	',
  '	offense	',
  '	Olympics	',
  '	paddle	',
  '	paintball	',
  '	parasailing	',
  '	parkour	',
  '	ping pong	',
  '	pitch	',
  '	playoffs	',
  '	pogo stick	',
  '	pole vault	',
  '	pool	',
  '	puck	',
  '	quarterback	',
  '	quiver	',
  '	racket	',
  '	racquetball	',
  '	rafting	',
  '	referee	',
  '	relay	',
  '	rink	',
  '	rock climbing	',
  '	roller skates	',
  '	rugby	',
  '	running	',
  '	sailing	',
  '	scoreboard	',
  '	scuba	',
  '	skier	',
  '	sledding	',
  '	snorkeling	',
  '	snowboard	',
  '	snowshoeing	',
  '	soccer	',
  '	softball	',
  '	squash	',
  '	surfing	',
  '	swim	',
  '	table tennis	',
  '	taekwondo	',
  '	target	',
  '	team	',
  '	tennis	',
  '	tetherball	',
  '	tie	',
  '	trampoline	',
  '	tug of war	',
  '	umpire	',
  '	unicycle	',
  '	uniform	',
  '	volley ball	',
  '	walking	',
  '	water polo	',
  '	water ski	',
  '	weightlifting	',
  '	weights	',
  '	wetsuit	',
  '	win	',
  '	World Cup	',
  '	World Series	',
  '	wrestling	',
  "	Angels	"	,
  "	Bells	"	,
  "	Bethlehem	"	,
  "	Candles	"	,
  "	Candy	"	,
  "	Candy canes	"	,
  "	Cards	"	,
  "	Cedar	"	,
  "	Celebrate	"	,
  "	Ceremonies	"	,
  "	Chimney	"	,
  "	Christmas cookies	"	,
  "	Christmas tree	"	,
  "	Cold	"	,
  "	Comet	"	,
  "	Cranberry sauce	"	,
  "	Crowds	"	,
  "	Cupid	"	,
  "	Dancer	"	,
  "	Dasher	"	,
  "	December	"	,
  "	Decorations	"	,
  "	Dolls	"	,
  "	Donner	"	,
  "	Dressing	"	,
  "	Eggnog	"	,
  "	Elves	"	,
  "	Family	"	,
  "	Festival	"	,
  "	Fir	"	,
  "	Frosty	"	,
  "	Fruitcake	"	,
  "	Gift boxes	"	,
  "	Gifts	"	,
  "	Goodwill	"	,
  "	Greetings	"	,
  "	Ham	"	,
  "	Happy	"	,
  "	Holiday	"	,
  "	Holly	"	,
  "	Holy	"	,
  "	Icicles	"	,
  "	Jolly	"	,
  "	Lights	"	,
  "	Lists	"	,
  "	Merry	"	,
  "	Miracle	"	,
  "	Mistletoe	"	,
  "	New Year	"	,
  "	Noel	"	,
  "	North Pole	"	,
  "	Pageant	"	,
  "	Parades	"	,
  "	Party	"	,
  "	Pie	"	,
  "	Pine	"	,
  "	Plum pudding	"	,
  "	Poinsettia	"	,
  "	Prancer	"	,
  "	Presents	"	,
  "	Pumpkin pie	"	,
  "	Punch	"	,
  "	Red/green	"	,
  "	Reindeer	"	,
  "	Ribbon	"	,
  "	Rudolph	"	,
  "	Sacred	"	,
  "	Sales	"	,
  "	Sauce	"	,
  "	Scrooge	"	,
  "	Season	"	,
  "	Sled	"	,
  "	Sleighbells	"	,
  "	Snowflakes	"	,
  "	Spirit	"	,
  "	St. Nick	"	,
  "	Stand	"	,
  "	Star	"	,
  "	Stickers	"	,
  "	Sweet potato	"	,
  "	Tidings	"	,
  "	Tinsel	"	,
  "	Toys	"	,
  "	Tradition	"	,
  "	Traffic	"	,
  "	Trips	"	,
  "	Turkey	"	,
  "	Vacation	"	,
  "	Winter	"	,
  "	Wrapping paper"	,
  "	Wreath	"	,
  "	Yule	"	
];