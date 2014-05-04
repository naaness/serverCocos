'use strict';
var serverPort = process.env.PORT||1337;
var http = require('http').createServer(MyServer);
var fs = require('fs');
var io = require('socket.io').listen(http);
var nSight=0;
var gameEnd=0;
var enemy=new Circle(400, 700,5);
var canvasWidth=704,canvasHeight=800;
var players=[];
var stack=[];
//var target=new Circle(100,100,10);

var contentTypes={
    ".html":"text/html",
    ".css":"text/css",
    ".js":"application/javascript",
    ".png":"image/png",
    ".jpg":"image/jpeg",
    ".ico":"image/x-icon",
    ".m4a":"audio/mp4",
    ".oga":"audio/ogg"
};

http.listen(parseInt(serverPort,10), function(){
    console.log('Server is listening on port ' + serverPort);
});

function MyServer(request,response){
    var filePath = '.' + request.url;
    if (filePath == './')
        filePath = './index.html';
    
    var extname = filePath.substr(filePath.lastIndexOf('.'));
    var contentType = contentTypes[extname];
    if(!contentType)
        contentType = 'application/octet-stream';
    console.log((new Date()) + ' Serving ' + filePath + ' as ' + contentType);
    
    fs.exists(filePath, function(exists){
        if(exists){
            fs.readFile(filePath, function(error, content){
                if(error){
                    response.writeHead(500, { 'Content-Type': 'text/html' });
                    response.end('<h1>500 Internal Server Error</h1>');
                }
                else{
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                }
            });
        }
        else{
            response.writeHead(404, { 'Content-Type': 'text/html' });
            response.end('<h1>404 Not Found</h1>');
        }
    });
}

io.sockets.on('connection', function(socket){
    if(stack.length)
        socket.player = stack.pop();
    else
        socket.player = nSight++;
    players[socket.player]=new Circle(200, 400,5);
    socket.emit('me', socket.player);
    io.sockets.emit('sight', socket.player, 200, 400);
    io.sockets.emit('sightEn', enemy.x, enemy.y);
    console.log(socket.id +' connected as player' + socket.player);
    
    socket.on('mySight', function(x, y){//, lastPress){
        players[socket.player].x=x;
        players[socket.player].y=y;
        // if(lastPress==1)
        //     act(socket.player);
        console.log(socket.id +' send sight player' + socket.player);
        io.sockets.volatile.emit('sight', socket.player, x, y);//, lastPress);
        enemy.x=random(canvasWidth);
        enemy.y=random(canvasHeight);
        io.sockets.emit('sightEnSe', enemy.x, enemy.y);
    });
    socket.on('setMePos', function(x, y){//, lastPress){
        io.sockets.emit('actualPos', socket.player, x, y);
        io.sockets.emit('sight', socket.player,  players[socket.player].x,  players[socket.player].y);
    });
    socket.on('disconnect', function(){
        io.sockets.emit('sight', socket.player, null, null);
        console.log('Player' + socket.player + ' disconnected.');
        if(io.sockets.clients().length<=1){
            stack.length=0;
            nSight=0;
            console.log('Sights were reset to zero.');
        }
        else
            stack.push(socket.player);
    });
    socket.on('restLife', function(n){//, lastPress){
        io.sockets.emit('restLifeTo', n);
    });
    // for (var i = 0; i <= nSight; i++) {
    //     io.sockets.emit('sight', socket.player, 200, 400);
    // };
});

function random(max){
     return ~~(Math.random()*max);
}

// function act(player){
//     var now=Date.now();
//     if(gameEnd-now<-1000){
//         gameEnd=now+10000;
//         io.sockets.emit('gameEnd', gameEnd);
//         target.x=random(canvasWidth/10-1)*10+target.radius;
//         target.y=random(canvasHeight/10-1)*10+target.radius;
//         io.sockets.emit('target',target.x,target.y);
//     }
//     else if(gameEnd-now>0){
//         if(players[player].distance(target)<0){
//             io.sockets.emit('score',player,1);
//             target.x=random(canvasWidth/10-1)*10+target.radius;
//             target.y=random(canvasHeight/10-1)*10+target.radius;
//             io.sockets.emit('target',target.x,target.y);
//         }
//     }
// }

function Circle(x,y,radius){
    this.x=(x==null)?0:x;
    this.y=(y==null)?0:y;
    this.radius=(radius==null)?0:radius;
}

// Circle.prototype.distance=function(circle){
//     if(circle!=null){
//         var dx=this.x-circle.x;
//         var dy=this.y-circle.y;
//         return (Math.sqrt(dx*dx+dy*dy)-(this.radius+circle.radius));
//     }
// }