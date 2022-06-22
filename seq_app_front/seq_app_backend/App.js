"use-strict";

import process from 'node:process';
import config from "config";

import {server} from "./routes/express_routes/routes";

import rabbitmq_consumers from "./services/message_broker/rabbitmq_consumers";
import MongoPool from "./services/db/dbConn";
import socketInstance from "./services/socket/socketInstance";

const FILE = "App.js";

//Initialise config data
let host;
let port;
let rabbitMqUrl;
let exchange;
let rabbitMQOpts;
let dbUri;

//get config data
try {
  //get server configuration
  host = config.get('server.host');
  port = process.env.PORT || config.get('server.port');
  // get message broker configuration
  rabbitMqUrl = config.get('rabbitMq.url');
  exchange = config.get('rabbitMq.exchange');
  rabbitMQOpts = config.get("rabbitMQRouting.opts");
  //get db configuration
  dbUri = config.get('mongoDB.url');
} catch (error) {
  console.log(FILE, " Error loading config data");
  process.exit(1);
}

//Initialize connection to MongoDB and return mongodb server infos
MongoPool.initPool(dbUri, (pool) => { console.log("Connected to MongoDB pool \n", pool.s)});

//Initialize socketIO connection mounted on express server
socketInstance.initInstance(server, (socket) => console.log("socket created \n", socket));

//Launching RabbitMQ consummer
rabbitmq_consumers(rabbitMqUrl, exchange, rabbitMQOpts, "Receiver Mode", null);

//Launching httpserver on defined port in main functin that will be called in index.js
//in index.js we use babel to be able to use ES6 syntax on any files related to App.js
function main(){
  //launching express server
  server.listen(port, () => console.log(`Listening on port ${port}`));
}

module.exports = main;

/* //Calling main function in socketio-connection.js
function main(){
  var stack = [];
  var actionRequested = false;
  var running = false;
  var action = {};
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
        channel.assertExchange(exchange, 'headers', {
          durable: false
        });

        channel.assertQueue('', { exclusive: true
        }, function(error2, q) {
          if (error2) {
            throw error2;
          }
          console.log(' [*] Waiting for user actions');
          channel.bindQueue(q.queue, exchange, "sequencer.request", {'publisher' : "sequencer", 'path' : "/sequencer/manipulation"});
          channel.bindQueue(q.queue, exchange, "sequencer.request", {'publisher' : "sequencer", 'path' : "/sequencer/error"});
          channel.bindQueue(q.queue, exchange, "hmi.update", {'publisher' : "build_processorHMI", 'path' : "/hmi/reset"});
          channel.bindQueue(q.queue, exchange, "hmi.update", {'publisher' : "sequencerHMI", 'path' : "/hmi/reset"});

          //Consume data coming from RabbitMQ server
          channel.consume(q.queue, function(msg) {
            if(msg.fields.routingKey == "sequencer.request"){
              if(msg.properties.headers.path == "/sequencer/manipulation"){
                action = JSON.parse(msg.content);
                socket.emit("AlertSeq", JSON.parse(msg.content));
                actionRequested = true;
                socket.emit("ActionReqHandling", actionRequested);
              }else if (msg.properties.headers.path == "/sequencer/error"){
                console.log("Error received from sequencer");
              }else{
                console.log("Message received with routing key sequencer.request does not have a recognized path");
              }
            }else if (msg.fields.routingKey == "hmi.update"){
              if(msg.properties.headers.path == "/hmi/reset"){
                stack = [];
                socket.emit("StackGestion", stack);
              }else{
                console.log("Message received with routing key hmi.update does not have a recognized path");
              }
            }
          }, {
            noAck: true
          });
        });
      });
    });
  } catch (e) {
    console.error(e);
  }
  

  server.listen(port, () => console.log(`Listening on port ${port}`));
} */