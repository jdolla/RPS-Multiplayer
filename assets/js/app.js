function connect(player) {

    if (game.player) {
        console.log("You're already connected");
        return;
    }

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

            document.querySelector("#player>div>div>img").setAttribute("src", player.avatar);

            trackPlayers();

        } else {
            alert("Servers are busy.  Try again in a bit.");
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


function startGame(opponent) {
    document.querySelector("#opponent img").setAttribute("src", opponent.avatar);
    document.getElementById("opponent-name").innerText = opponent.name;
}

function resetGame() {
    console.log("reset game");
}

function playerLost() {
    document.querySelector("#opponent img").setAttribute("src", "./assets/images/beaker_question.jpg");
    document.getElementById("opponent-name").innerText = "?";
    
    resetGame();
}

function trackPlayers() {
    const playersRef = db.ref('game/players');
    playersRef.on("value", function (s) {

        const pc = s.numChildren();
        if (pc === 2) {

            const curPlayer = game.player.substr(game.player.lastIndexOf("/") + 1);
            const allPlayers = s.toJSON();
            
            let opponentKey = "";
            for (let key in allPlayers){
                if(key != curPlayer){
                    opponentKey = key;
                    break;
                }
            }

            startGame(allPlayers[opponentKey]);

        } else if (pc < 2 && game.playerCount === 2) {
            playerLost();
        }
        game.playerCount = s.numChildren();

    });
    game.playersRef = playersRef;
}


document.getElementById("join-game").addEventListener("click", function (event) {

    const selected = document.querySelector('input[name=avatar]:checked');
    if (!selected) {
        alert("Choose an avatar!");
        return;
    }

    const name = document.getElementById("name-input").value;
    if (!name) {
        alert("Enter a name!");
        return;
    }

    const avatar = selected.parentNode.getElementsByTagName('img')[0].getAttribute("src");

    const player = {
        name: `${name}`,
        avatar: `${avatar}`
    };

    connect(player);
});


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
