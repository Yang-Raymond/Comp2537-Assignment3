const POKEMON_API = "https://pokeapi.co/api/v2/pokemon?limit=1500";
let pokemonDetailAPI = [];

const DIFFICULTY_CONFIG = {
  easy: {
    cardCount: 6,
    timeLimit: 60,
    gridClass: "easy"
  },
  medium: {
    cardCount: 12,
    timeLimit: 45,
    gridClass: "medium"
  },
  hard: {
    cardCount: 20,
    timeLimit: 30,
    gridClass: "hard"
  }
};

let currentDifficulty = "easy";

async function fetchAllPokemonAPI() {
  let response = await fetch(POKEMON_API);
  let jsonObj = await response.json();
  let results = jsonObj.results;
  for (let i = 0; i < results.length; i++) {
    pokemonDetailAPI.push(results[i].url);
  }
}

async function fetchRandomPokemonDetails() {
  let randomPokemon = Math.floor(Math.random() * pokemonDetailAPI.length);
  let response = await fetch(pokemonDetailAPI[randomPokemon]);
  let jsonObj = await response.json();
  return jsonObj;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function setup(difficulty = currentDifficulty) {
  const config = DIFFICULTY_CONFIG[difficulty];
  const numberOfCards = config.cardCount;
  if (numberOfCards % 2 != 0) {
    console.error("Number of cards must be even");
    return;
  }
  $("#current-difficulty").text(difficulty.charAt(0).toUpperCase() + difficulty.slice(1));
  $("#game_grid").empty();
  $("#game_grid").removeClass("easy medium hard").addClass(config.gridClass);
  for (let i = 0; i < numberOfCards; i++) {
    $("#game_grid").append(`
      <div class="card">
        <img id="img${i + 1}" class="front_face" src="" alt="">
        <img class="back_face" src="back.webp" alt="">
      </div>
    `);
  }
  let cards = [];
  await fetchAllPokemonAPI();
  for (let i = 0; i < numberOfCards / 2; i++) {
    let randomPokemon = await fetchRandomPokemonDetails();
    cards.push(randomPokemon);
    cards.push(randomPokemon);
  }
  shuffleArray(cards);
  $(".front_face").each(function (index) {
    $(this).attr("src", cards[index].sprites.other["official-artwork"].front_default);
  });
  $(".card").removeClass("flip matched").off("click");
}

let firstCard = undefined;
let secondCard = undefined;
let lockBoard = false;
let matchedPairs = 0;
let clicks = 0;
let totalPairs = 0;
let timeLeft = 60;
let timerId;
let gameRunning = false;
let powerUpUsed = false;

function resetTurn() {
  firstCard = undefined;
  secondCard = undefined;
  lockBoard = false;
}

function game() {
  if (!gameRunning) return;
  const config = DIFFICULTY_CONFIG[currentDifficulty];
  firstCard = undefined;
  secondCard = undefined;
  lockBoard = false;
  matchedPairs = 0;
  clicks = 0;
  timeLeft = config.timeLimit;
  totalPairs = $(".card").length / 2;
  powerUpUsed = false;

  $("#power-up-button").prop("disabled", false);
  function updateStats() {
    $("#clicks").text(clicks);
    $("#pairs-matched").text(matchedPairs);
    $("#pairs-left").text(totalPairs - matchedPairs);
    $("#total-pairs").text(totalPairs);
    $("#time-left").text(timeLeft);
  }
  function startGameTimer() {
    clearInterval(timerId);
    timerId = setInterval(() => {
      timeLeft--;
      updateStats();
      if (timeLeft <= 0) {
        clearInterval(timerId);
        if (matchedPairs < totalPairs) {
          alert("Game Over! You ran out of time.");
          lockBoard = true;
        }
      }
    }, 1000);
  }
  updateStats();
  startGameTimer();
  function resetGame() {
    clearInterval(timerId);
    firstCard = undefined;
    secondCard = undefined;
    lockBoard = false;
    matchedPairs = 0;
    clicks = 0;
    timeLeft = DIFFICULTY_CONFIG[currentDifficulty].timeLimit;
    gameRunning = false;
    powerUpUsed = false;
    updateStats();
    $(".card").removeClass("flip matched").off("click");
    $("#start-button").prop("disabled", false);
    $("#reset-button").prop("disabled", true);
    $("#power-up-button").prop("disabled", true);
    $(".difficulty-btn").prop("disabled", false);
    $("#game_grid").addClass("dimmed");
  }
  function disableMatchedCards() {
    if (firstCard) firstCard.off("click").addClass("matched");
    if (secondCard) secondCard.off("click").addClass("matched");
    matchedPairs++;
    updateStats();
    if (matchedPairs === totalPairs) {
      clearInterval(timerId);
      setTimeout(() => {
        alert("Congratulations! You've matched all the Pokémon!");
      }, 700);
    }
  }
  $(".card").off("click");
  $(".card").on("click", function () {
    if (lockBoard) return;
    if ($(this).hasClass("matched")) return;
    if (!$(this).hasClass("flip") || (firstCard && !$(this).is(firstCard))) {
      clicks++;
      updateStats();
    }
    if (firstCard && $(this).is(firstCard) && !secondCard) {
      lockBoard = true;
      $(this).toggleClass("flip");
      firstCard = undefined;
      setTimeout(() => {
        lockBoard = false;
      }, 1000);
      return;
    }
    if ($(this).hasClass("flip")) return;
    lockBoard = true;
    $(this).toggleClass("flip");
    setTimeout(() => {
      if (!firstCard) {
        firstCard = $(this);
        if (firstCard && $(this).is(firstCard) && !secondCard) {
          lockBoard = false;
        }
      } else {
        secondCard = $(this);
        const firstCardImgSrc = firstCard.find(".front_face").attr("src");
        const secondCardImgSrc = secondCard.find(".front_face").attr("src");
        if (firstCardImgSrc === secondCardImgSrc) {
          disableMatchedCards();
          resetTurn();
        } else {
          setTimeout(() => {
            if (firstCard) firstCard.toggleClass("flip");
            if (secondCard) secondCard.toggleClass("flip");
            setTimeout(() => {
              resetTurn();
            }, 500);
          }, 500);
        }
      }
    }, 700);
  });
  $("#reset-button").prop("disabled", false);
}

$(document).ready(() => {
  $("#reset-button").off("click");
  $("#start-button").off("click");
  $(".difficulty-btn").off("click");
  $("#theme-toggle").off("click");
  $("#power-up-button").off("click");
  function updateHeaderForDifficulty(difficulty) {
    const config = DIFFICULTY_CONFIG[difficulty];
    const numberOfCards = config.cardCount;
    const numberOfPairs = numberOfCards / 2;
    $("#current-difficulty").text(difficulty.charAt(0).toUpperCase() + difficulty.slice(1));
    $("#pairs-left").text(numberOfPairs);
    $("#total-pairs").text(numberOfPairs);
    $("#time-left").text(config.timeLimit);
  }
  $(".difficulty-btn").on("click", async function () {
    if (gameRunning) return;
    $(".difficulty-btn").removeClass("active");
    $(this).addClass("active");
    currentDifficulty = $(this).data("difficulty");
    updateHeaderForDifficulty(currentDifficulty);
    await setup(currentDifficulty);
    $("#game_grid").addClass("dimmed");
  });
  $("#reset-button").on("click", async () => {
    await setup(currentDifficulty);
    clearInterval(timerId);
    firstCard = undefined;
    secondCard = undefined;
    lockBoard = false;
    matchedPairs = 0;
    clicks = 0;
    timeLeft = DIFFICULTY_CONFIG[currentDifficulty].timeLimit;
    gameRunning = false;
    powerUpUsed = false;
    $("#clicks").text(clicks);
    $("#pairs-matched").text(matchedPairs);
    $("#pairs-left").text(totalPairs - matchedPairs);
    $("#total-pairs").text(totalPairs);
    $("#time-left").text(timeLeft);
    $(".card").removeClass("flip matched temp-flip").off("click");
    $("#start-button").prop("disabled", false);
    $("#reset-button").prop("disabled", true);
    $("#power-up-button").prop("disabled", true);
    $(".difficulty-btn").prop("disabled", false);
    $("#game_grid").addClass("dimmed");
  });
  $("#start-button").on("click", async () => {
    if (gameRunning) return;
    await setup(currentDifficulty);
    gameRunning = true;
    $("#start-button").prop("disabled", true);
    $("#reset-button").prop("disabled", false);
    $(".difficulty-btn").prop("disabled", true);
    $("#game_grid").removeClass("dimmed");
    game();
  });
  
  $("#power-up-button").on("click", function() {
    if (powerUpUsed || !gameRunning) return;
    
    lockBoard = true; 
    const unflippedCards = $(".card").not(".flip").not(".matched");
    unflippedCards.addClass("temp-flip flip");
    
    powerUpUsed = true;
    $(this).prop("disabled", true);

    setTimeout(() => {
      $(".temp-flip").removeClass("temp-flip flip");
      lockBoard = false; 
    }, 1000);
  });
  
  $("#reset-button").prop("disabled", true);
  $("#power-up-button").prop("disabled", true);
  $("#game_grid").addClass("dimmed");
  $("#theme-toggle").on("click", function () {
    $("body").toggleClass("dark-mode");
    if ($("body").hasClass("dark-mode")) {
      $(this).text("Switch to Light Mode");
    } else {
      $(this).text("Switch to Dark Mode");
    }
  });
  setup(currentDifficulty);
});