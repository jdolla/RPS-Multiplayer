function connect() {

    if (game.player) {
        console.log("You're already connected");
        return;
    }

    const player = getPlayer();
    if (!player) {
        console.log("No Playa");
        return;
    }

    if (connected()) joinGame(player);

};

function joinGame(player) {

    const playersRef = db.ref('game/players');
    playersRef.once("value", function (s) {

        const childCount = s.numChildren();
        if (childCount < 2) {

            const playerRef = playersRef.push(player);
            game.player = playerRef.toString();
            playerRef.onDisconnect().remove();

            trackPlayers();

        } else {
            console.log("too busy");
        }

    });

}

function connected() {
    var result = false;

    const connRef = db.ref('.info/connected');
    connRef.on("value", function (s) {

        if (s.val()) {
            result = true;
        } else {
            //turn off all firebase callbacks

            if (game.playersRef) game.playersRef.off();
            connRef.off();

            console.log("Connection Lost... Stopping all the things");
        }

    });

    return result;
}

function getPlayer() {
    // name = document.getElementById("playerName-input").value;
    // avatar = null // TODO: Add Avatar

    name = "jason";
    avatar = "meep";

    if (!name) {
        return null;
    }

    if (!avatar) {
        return null;
    }

    return {
        name: `${name}`,
        avatar: `${avatar}`
    };
}

function startGame(){
    console.log("start game");
}

function resetGame(){
    console.log("reset game");
}

function playerLost(){
    console.log("player lost");
    resetGame();
}

function trackPlayers() {
    const playersRef = db.ref('game/players');
    playersRef.on("value", function (s) {
        
        const pc = s.numChildren();
        if (pc === 2) {
            startGame()
        } else if(pc < 2 && game.playerCount === 2) {
           playerLost();
        }
        game.playerCount = s.numChildren();
        
    });
    game.playersRef = playersRef;
}

var game = {
    player: "",
    playerCount: 0,
    playersRef: null
}

// Initialize Firebase
var config = {
    apiKey: "AIzaSyB8rSUzeYxAG5qcxaHqyP6TZtm6EX30KF0",
    authDomain: "paperrockscissors-kos.firebaseapp.com",
    databaseURL: "https://paperrockscissors-kos.firebaseio.com",
    projectId: "paperrockscissors-kos",
    storageBucket: "paperrockscissors-kos.appspot.com",
    messagingSenderId: "729759339100"
};

firebase.initializeApp(config);
const db = firebase.database();
