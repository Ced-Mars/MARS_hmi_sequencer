const express = require("express");
const http = require("http");
const amqp = require("amqplib/callback_api");
const index = require("./routes/index.js");

const port = process.env.PORT || 4002;
const app = express();
//app.use(index);
app.use(express.static("dist"));
const server = http.createServer(app);
const server_path = "amqp://localhost";


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
  var stack = [];
  var actionRequested = false;
  var running = false;
  var action = {};
  var exchange = 'mars';
  var key = 'hmi.sequencer.request';
  var key2 = 'hmi.sequencer.report';
  var key3 = 'sequencer.request.hmi';
  var key4 = 'hmi.process.reset';
  var key5 = 'sequencer.report.process.status';
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

        channel.assertQueue('', { exclusive: true
        }, function(error2, q) {
          if (error2) {
            throw error2;
          }
          console.log(' [*] Waiting for user actions');
          channel.bindQueue(q.queue, exchange, key3);
          channel.bindQueue(q.queue, exchange, key4);
          channel.bindQueue(q.queue, exchange, key5);

          //Consume data coming from RabbitMQ server
          channel.consume(q.queue, function(msg) {
            if(msg.fields.routingKey == key3){
              action = JSON.parse(msg.content);
              socket.emit("AlertSeq", JSON.parse(msg.content));
              actionRequested = true;
              socket.emit("ActionReqHandling", actionRequested);
            }else if (msg.fields.routingKey == key4){
              stack = [];
              socket.emit("StackGestion", stack);
            }else if (msg.fields.routingKey == key5){
              message = JSON.parse(msg.content);
              if(message["id"] == "begin"){
                running = true;
                socket.emit("Process", running);
              }else if(message["id"] == "end"){
                running = false;
                socket.emit("Process", running);
              }
            }
          }, {
            noAck: true
          });
          
        });

        //Connection avec socket.io pour communication avec le frontend
        const socket = io.on("connection", (socket) => {
          console.log("Client is connected");
          socket.emit("StackGestion", stack);
          socket.emit("ActionReqHandling", actionRequested);
          if(actionRequested){
            socket.emit("RetrieveActionToExecute", action);
          }
          console.log("running : ", running);
          socket.emit("Process", running);
          console.log("emitted");

          //Sending command to sequencer via action.cmd
          socket.on("2Seq", (a) => {
            //reset data for all hmi
            channel.publish(exchange, key4, Buffer.from("reset"));
            //send command to sequencer
            channel.publish(exchange, key, Buffer.from(JSON.stringify(a)));
          });

          socket.on("Stack", (a) => {
            action = {};
            actionRequested = false;
            stack = [...stack, a];
            socket.emit("StackGestion", stack);
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

