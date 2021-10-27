const express = require("express");
const http = require("http");
const amqp = require("amqplib/callback_api");
const index = require("./routes/index.js");

const port = process.env.PORT || 4002;
const app = express();
app.use(index);
const server = http.createServer(app);
const server_path = "amqp://guest:123456789@localhost";

app.use(express.static("dist"));
//Global variables where are stored informations about the messaging server and the channel
var connection, channel;
var message = "Connecté";

//Pass the Cross Origin error, do not deploy
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
  reconnect: true
});

main();


//Calling main function in socketio-connection.js
function main(){
      //Connection avec socket.io pour communication avec le frontend
      io.on("connection", (socket) => {
        console.log("Client is connected");
        socket.emit("FromSeq", message);
        console.log("emitted");

        
        socket.on("FromSeq", (a) => {
          console.log("FromSeq", a);
          //Connexion to rabbitMQ server
          try {
            //Creating connection with rabbitMQ server
            amqp.connect(server_path, function(error0, conn) {
              if (error0) {
                throw error0;
              }
              connection = conn;
              connection.createChannel(function(error1, chan) {
                if (error1) {
                  throw error1;
                }
                channel = chan;
                var exchange = 'seq_exchange';
                var key = 'action.cmd';
            
                channel.assertExchange(exchange, 'topic', {
                  durable: false
                });
                channel.publish(exchange, key, Buffer.from(JSON.stringify(a)));
              });
              
            });
            
            
          } catch (e) {
            console.error(e);
          }
          console.log("reçu : ", a);
        });

        //Called when the client disconnect from the socketio link
        socket.on("disconnect", () => {
          console.log("Client disconnected");
          
        });
      });

      server.listen(port, () => console.log(`Listening on port ${port}`));
}

