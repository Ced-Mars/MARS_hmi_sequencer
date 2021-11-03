const express = require("express");
const http = require("http");
const amqp = require("amqplib/callback_api");
const index = require("./routes/index.js");

const port = process.env.PORT || 4002;
const app = express();
app.use(index);
const server = http.createServer(app);
const server_path = "amqp://localhost";

app.use(express.static("dist"));
//Global variables where are stored informations about the messaging server and the channel
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
  var exchange = 'sequencer';
  var key = 'action.cmd';
  var key2 = 'action.toseq';
  var key3 = 'action.touser';
  //Connexion to rabbitMQ server
  try {
    //Creating connection with rabbitMQ server
    amqp.connect(server_path, function(error0, connection) {
      if (error0) {
        throw error0;
      }
      connection.createChannel(function(error1, channel) {
        if (error1) {
          throw error1;
        }
        channel.assertExchange(exchange, 'topic', {
          durable: false
        });

        channel.assertQueue('', {
        }, function(error2, q) {
          if (error2) {
            throw error2;
          }
          console.log(' [*] Waiting for user actions');
          channel.bindQueue(q.queue, exchange, key3);
          channel.consume(q.queue, function(msg) {
            console.log("USER ACTION : ", msg.content.toString());
            console.log("Client is connected - Inside User Action Channel consume");
            socket.emit("AlertSeq", JSON.parse(msg.content));
          }, {
            noAck: true
          });
          
        });

        //Connection avec socket.io pour communication avec le frontend
        const socket = io.on("connection", (socket) => {
          console.log("Client is connected");
          socket.emit("FromSeq", message);
          console.log("emitted");
          
          socket.on("FromSeq", (a) => {
            console.log("FromSeq", a);
            channel.publish(exchange, key, Buffer.from(JSON.stringify(a)));
          });

          socket.on("2Seq", (a) => {
            console.log("2Seq", a);
            channel.publish(exchange, key2, Buffer.from(JSON.stringify(a)));
          });

          //Called when the client disconnect from the socketio link
          socket.on("disconnect", () => {
            console.log("Client disconnected");
          });
        });
      });
    });
  } catch (e) {
    console.error(e);
  }
  

  server.listen(port, () => console.log(`Listening on port ${port}`));
}

