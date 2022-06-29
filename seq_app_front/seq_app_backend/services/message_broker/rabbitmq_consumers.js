'use strict';

import amqp from "amqplib/callback_api";
import handleRoutingServerData from "../../routes/rabbitmq_routes/rabbitMQRouting";
import handleRunSequence from "../../services/MARS/handler/handleRunSequence";
import process from "node:process";

const FILE = "rabbitmq_consumers.js ";

async function rabbitmq_consumers(RABBITMQ_URL, exchange, opts, config, dataToSend)
{
  const TAG = "FUNCTION rabbitmq_consumers: ";

  try {
    amqp.connect(RABBITMQ_URL, function(error0, conn) {
      if (error0) throw error0;
      process.once('SIGINT', function() { conn.close(); });
      conn.createChannel(function(error1, ch) {
        if (error1) throw error1;
        ch.assertExchange(exchange, 'headers', {
          durable: false
        });
        ch.assertQueue('', { exclusive:true }, function(error2, q) {
          if (error2) throw error2;
          //Asserting in which channel and queue and which message/key pair we want to get
          //Passing the config picker as callback
          bindingQueues(ch, q, exchange, opts, configPicker(exchange, ch, q, dataToSend, config));          
          //Logging that RabbitMQ server is running and listening for messages
          console.log(FILE + TAG + ' RabbitMQ consummer running / Waiting for messages / To exit press CTRL+C');
        });
      },{ noAck: true});
    });
  } catch (err) {
    console.log(FILE + TAG + "RabbitMQ connection error :", err);
    process.exit(1);
  }
}

function bindingQueues(channel, q, exchange, opts, callback){
  opts.forEach(element => {
    channel.bindQueue(q.queue, exchange, element.routing_key, element.header);
  });
  return callback;
}

//Redirect usage if we want to send or receive data
function configPicker(exchange, ch, q, dataToSend, config){
  switch(config){
    case "Receiver Mode":
      //Consume messages that has the same routing key defined in the binding
      ch.consume(q.queue, (data) => handleRoutingServerData(data, exchange, ch), {noAck: true});
      break;
    case "Sender Mode":
      //Calling handler for running a sequence
      handleRunSequence(exchange, ch, dataToSend);
      break;
    default:
      console.log("RabbitMQ config not correponding to any pre-existing ones");
  }
}

module.exports = rabbitmq_consumers;
