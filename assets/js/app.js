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
            game.player = playerRef.toString().substr(playerRef.toString().lastIndexOf("/") + 1);

            playerRef.onDisconnect().remove();


            game.match = db.ref(`match/${game.player}`);
            game.match.onDisconnect().remove();
            
            document.querySelector("#player>div>div>img").setAttribute("src", player.avatar);

            ready();
            trackPlayers();

            game.chat = db.ref(`chat/${game.player}`);
            game.chat.onDisconnect().remove();

            db.ref('chat/').on("child_added", function(s){
               addMessage(s.key, s.val());
            });


            const avatarSelection = document.getElementById("avatar-selection");
            const gameRoom = document.getElementById("game-room");
            window.setTimeout(function () {
                avatarSelection.style.opacity = 0;
                window.setTimeout(function () {
                    avatarSelection.style.display = "none";
                    gameRoom.style.display = "inherit";
                    window.setTimeout(function () {
                        gameRoom.style.opacity = 1;
                    }, 200)
                }, 500)
            }, 0)


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

function countDown() {
    gameInterval = setInterval(function () {
        let secs = parseInt(time.innerText);
        if (secs > 0) {
            time.innerText = secs - 1;
        }
        else {
            clearInterval(gameInterval)
            evaluate();
            setTimeout(function () {
                // resetMatch();
            }, 3000);
        }
    }, 1000);
}

function startGame(opponent) {
    document.querySelector("#opponent img").setAttribute("src", opponent.avatar);
    document.getElementById("opponent-name").innerText = opponent.name;
}

function resetMatch() {
    let res = document.querySelectorAll(".results");
    for (let i = 0; i < res.length; i++) {
        res[i].style.display = "none";
    }
    
    game.match.remove();
    time.innerText = 10;

    mc.style.display = "none";
    op.style.display = "none";

    mc.setAttribute("src", "#");
    op.setAttribute("src", "#");

    announce.innerText = "";

    ready();

}

function ready() {
    game.readyPlayer = db.ref(`readyPlayers/${game.player}`);
    game.readyPlayer.onDisconnect().remove();
    game.readyPlayer.set("ready");

}

function evaluate() {
    const plays = db.ref("match");
    plays.once("value", function (s) {
        const r = s.toJSON();
        let myChoice = "";
        let opponentChoice = "";

        if (r) {
            if (r.hasOwnProperty(game.opponent)) {
                opponentChoice = r[game.opponent].choice;
                op.setAttribute("src", r[game.opponent].choiceUrl);
                op.style.display = "inline-block";
            }

            if (r.hasOwnProperty(game.player)) {
                myChoice = r[game.player].choice;
                mc.setAttribute("src", r[game.player].choiceUrl);
                mc.style.display = "inline-block";
            }
        }

        outcome = rps(myChoice, opponentChoice);

        if (outcome === "tie") {
            announce.innerText = "It's a Tie!";
        } else {
            announce.innerText = `You ${outcome}!!`;
        }

    });

    let res = document.querySelectorAll(".results");
    for (let i = 0; i < res.length; i++) {
        res[i].style.display = "inherit";
    }

    game.readyPlayer.remove();
}

function rps(me, opponent) {
    if (me === opponent) {
        return "tie";
    }

    if (me === "") {
        return "lose";
    }

    if (opponent === "") {
        return "win";
    }

    if (me === "rock") {
        if (opponent === "paper") {
            return "lose";
        } else {
            return "win";
        }
    }

    if (me === "scissors") {
        if (opponent === "rock") {
            return "lose";
        }
        else {
            return "win";
        }
    }

    if (me === "paper") {
        if (opponent === "scissors") {
            return "lose";
        }
        else {
            return "win";
        }
    }

}

function playerLost() {
    document.querySelector("#opponent img").setAttribute("src", "./assets/images/beaker_question.jpg");
    document.getElementById("opponent-name").innerText = "?";
    game.opponent = "";
    clearInterval(gameInterval);
    resetMatch();
}

function trackPlayers() {
    const playersRef = db.ref('game/players');
    playersRef.on("value", function (s) {
        const pc = s.numChildren();
        if (pc === 2) {

            const allPlayers = s.toJSON();

            for (let key in allPlayers) {
                if (key != game.player) {
                    game.opponent = key;
                    break;
                }
            }
            startGame(allPlayers[game.opponent]);

            db.ref("readyPlayers/").on("value", function (s) {
                if (s.numChildren() === 2){
                    countDown();
                }
            });


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

function ammoClick() {
    play.myItem = this.getAttribute("data-item");
    play.myItemUrl = this.getAttribute("src");
    game.match.child("choice").set(`${play.myItem}`);
    game.match.child("choiceUrl").set(`${play.myItemUrl}`);
}

function addMessage(player, message){
    
    newMessage = document.createElement("div");
    newMessage.innerText = message;
    
    if(player == game.player){
        newMessage.classList.add("player-message");
    } else {
        newMessage.classList.add("opponent-message");
    }

    newMessage.classList.add("message");
    newMessage.classList.add("last");

    if(messageArea.children.length === 0){
        newMessage.classList.add("first");
    }

    if(messageArea.children.length >= 8){
        messageArea.removeChild(messageArea.firstChild);
        messageArea.firstChild.classList.add("first");
    }

    if(messageArea.children.length > 0) {
        messageArea.lastChild.classList.remove("last");
    }

    messageArea.appendChild(newMessage);

}

/*************************************************************/


var game = {
    player: "",
    opponent: "",
    playerCount: 0,
    playersRef: null,
    match: null,
    readyPlayer: null,
    chat: null
}

var play = {
    myItem: null,
    myPlay: null,
    myItemUrl: null
};

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
const time = document.getElementById("time");
var gameInterval = null;
const op = document.getElementById("op-choice");
const mc = document.getElementById("mc-choice");
const announce = document.getElementById("announce");
const messageArea = document.getElementById("messages");
const ammoBtns = document.querySelectorAll(".ammo");
for (let i = 0; i < ammoBtns.length; i++) {
    ammoBtns[i].addEventListener("click", ammoClick);
}


document.getElementById("restart").addEventListener("click", resetMatch);

const subBtn = document.getElementById("submit-btn");
subBtn.addEventListener("click", function(e){
    e.preventDefault();

    cb = document.getElementById("comment-input");
    if(!cb.value) return;
    game.chat.set(cb.value);
    game.chat.remove();


    cb.value = "";
    // commentBox.focus();
});