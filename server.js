const express = require('express');
const bodyParser = require("body-parser");
const http = require('http');
const app = express();

const port = 3000;

const server = app.listen(port);

const io = require('socket.io').listen(server);

var Servers = [];

app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/views/src'));

app.get('/', (req,res) => {
    res.render("index", {
        user: {},
        Error: null
    });
});

app.get('/game/:id', (req,res) => {
    var Id = req.params.id;
    for(var Server = 0; Server < Servers.length; Server++) {
        if(Servers[Server].Id == Id) {
            res.render('game', {Server: Servers[Server]});
        }
    }
    
});

app.post('/lobby', (req,res) => {
    var ServerUser = null;
    for(Server = 0; Server < Servers.length; Server++) {
        if(Servers[Server].Player2 == null) {
            Servers[Server].Player2 = req.body
            ServerUser = Servers[Server];
        }
    }
    if(ServerUser == null) {
        ServerUser = {Id: Math.floor(Math.random() * 10000), Player1: req.body, Player2: null};
        Servers.push(ServerUser);
    }
    res.render('lobby', {
        user: req.body,
        server: ServerUser
    });
})


io.on('connect', function(socket) {
    socket.on('msg', function(msg) {
        io.emit('msg',msg);
    })
    socket.on('choose', function(User,Server) {
            for(sv = 0; sv < Servers.length; sv++) {
                if(Servers[sv].Id == Server.Id) {
                    if(Servers[sv].Player1.username.trim() == User.username) {
                        Servers[sv].Player1.Type = User.Type;
                    }
                    else {
                        if(Servers[sv].Player2.username.trim() == User.username) {
                            Servers[sv].Player2.Type = User.Type;
                        }
                    }
                }
            if(Servers[sv].Player2.Type != undefined && Servers[sv].Player1.Type != undefined) {
                if(Servers[sv].Player1.Type == 0 && Servers[sv].Player2.Type == 1)
                    Servers[sv].Player1.Win = true;
                if(Servers[sv].Player1.Type == 1 && Servers[sv].Player2.Type == 2)
                    Servers[sv].Player1.Win = true;

                if(Servers[sv].Player2.Type == 0 && Servers[sv].Player1.Type == 1)
                    Servers[sv].Player2.Win = true;
                if(Servers[sv].Player2.Type == 1 && Servers[sv].Player1.Type == 2)
                    Servers[sv].Player2.Win = true;
                if(Servers[sv].Player1.Type == 0 && Servers[sv].Player2.Type == 2)
                    Servers[sv].Player2.Win = true;
                    
                if(Servers[sv].Player2.Type == 0 && Servers[sv].Player1.Type == 2)
                    Servers[sv].Player1.Win = true;
                if(!Servers[sv].Player1.Win && !Servers[sv].Player2.Win)
                    Servers[sv].Repeat = true;
                io.emit('end',Servers[sv]);
            }
        }
    })
    socket.on('ready game',function(Server, User) {
        if(Server.Player1 && Server.Player2) {
            io.emit('start', Server);
            var msg = {message: "Game will start in 15 seconds!", server: Server};
            io.emit('msg',msg);
        }
    })
})
