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


            game.match = match = db.ref(`match/${game.player}`);
            game.match.onDisconnect().remove();

            document.querySelector("#player>div>div>img").setAttribute("src", player.avatar);

            trackPlayers();

            const avatarSelection = document.getElementById("avatar-selection");
            const gameRoom = document.getElementById("game-room");
            window.setTimeout(function(){
                avatarSelection.style.opacity = 0;
                window.setTimeout(function(){
                    avatarSelection.style.display = "none";
                    gameRoom.style.display = "inherit";
                    window.setTimeout(function(){
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

function countDown(){
    gameInterval = setInterval(function(){
        let secs = parseInt(time.innerText);  
        if(secs > 0 ){
            time.innerText = secs - 1;
        }
        else {
            clearInterval(gameInterval)
            evaluate();
            countDown();
            setTimeout(function(){
                resetMatch();
            }, 3000);
        }
    }, 1000);
}

function startGame(opponent) {
    document.querySelector("#opponent img").setAttribute("src", opponent.avatar);
    document.getElementById("opponent-name").innerText = opponent.name;
    countDown();
}

function resetMatch() {
    game.match.remove();
    time.innerText = 10;

    mc.style.display = "none";
    op.style.display = "none";
    
    mc.setAttribute("src", "#");
    op.setAttribute("src", "#");

    announce.innerText = "";
}

function evaluate(){
    const plays = db.ref("match");
    plays.once("value", function(s){
        const r = s.toJSON();
        let myChoice = "";
        let opponentChoice = "";

        if(r){
            if(r.hasOwnProperty(game.opponent)){
                opponentChoice = r[game.opponent].choice;
                op.setAttribute("src", r[game.opponent].choiceUrl);
                op.style.display = "inline-block";
            }

            if(r.hasOwnProperty(game.player)){
                myChoice = r[game.player].choice;
                mc.setAttribute("src", r[game.player].choiceUrl);
                mc.style.display = "inline-block";
            }
        }

       outcome = rps(myChoice, opponentChoice);

       if(outcome === "tie"){
           announce.innerText = "It's a Tie!";
       } else {
           announce.innerText = `You ${outcome}!!`;
       }

    });
}

function rps(me, opponent){
    if(me === opponent){
        return "tie";
    }

    if(me === ""){
        return "lose";
    }

    if(opponent === ""){
        return "win";
    }

    if(me === "rock"){
        if(opponent === "paper"){
            return "lose";
        } else{
            return "win";
        }
    }
    
    if(me === "scissors"){
        if(opponent === "rock"){
            return "lose";
        }
        else {
            return "win";
        }
    }

    if(me === "paper"){
        if(opponent === "scissors"){
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
            
            for (let key in allPlayers){
                if(key != game.player){
                    game.opponent = key;
                    break;
                }
            }
            startGame(allPlayers[game.opponent]);
            
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

function ammoClick(){
    play.myItem = this.getAttribute("data-item");
    play.myItemUrl = this.getAttribute("src");
    game.match.child("choice").set(`${play.myItem}`);
    game.match.child("choiceUrl").set(`${play.myItemUrl}`);
}



/*************************************************************/


var game = {
    player: "",
    opponent: "",
    playerCount: 0,
    playersRef: null,
    match: null
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

const ammoBtns = document.querySelectorAll(".ammo");
for (let i = 0; i < ammoBtns.length; i++) {
    ammoBtns[i].addEventListener("click", ammoClick);
}