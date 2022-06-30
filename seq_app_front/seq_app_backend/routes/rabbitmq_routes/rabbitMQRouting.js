//Data Layer Handlers

//Socket Instance import
import socketInstance from "../../services/socket/socketInstance";

//Name of the file for debugging purpose
const FILE = "rabbitMQRouting.js ";
const PUBLISHER = "sequencerHMI";

async function handleRoutingServerData(data, exchange, channel){
    const TAG = "FUNCTION handleRoutingServerData: ";
    const key = 'sequencer.request';
    const key1 = 'hmi.update';
    console.log(JSON.parse(data.content));

    const socket = socketInstance.getInstance();
    // Emitting a new message. Will be consumed by the client
    if(data.fields.routingKey == key){
      if(data.properties.headers.path == "/sequencer/manipulation"){
        responseSuccessToSender(exchange, channel, data, "SUCCESS");
        var parsedData = JSON.parse(data.content);
        if(parsedData.status == "WAITING"){
          //Request buildProcessorHMI to send the complete user action from the build process
          requestManipInfos(exchange, channel, data.content);
          //Trigger ActionRequested Flag
          socket.emit("ActionReqHandling", false);
        }else{
          //TODO ; get data from db - changing it with instance and queues for the future

          //Sending manipualtion data to frontend
          socket.emit("AlertSeq", JSON.parse(data.content));
          //Reset ActionRequested Flag
          socket.emit("ActionReqHandling", false);
        }
        
      }else if (data.properties.headers.path == "/sequencer/error"){
        responseSuccessToSender(exchange, channel, data, "SUCCESS");
        console.log("Error sent");
      }else{
        console.log("Message received with routing key sequencer.request does not have a recognized path");
      }
    }
    //Sending a simple string on "ResetFromBackend" room that will be processed as a wipe/reset of data in other backend and thus frontend
    else if (data.fields.routingKey == key1){
      if(data.properties.headers.path == "/hmi/reset"){
        console.log(FILE + TAG + "Reset HMI");
        socket.emit("StackGestion", []);
        //handleResetHMI();
      }else if(data.properties.headers.path == "/hmi/manipulation/response"){
        var parsedData = JSON.parse(data.content); 
        console.log(FILE + TAG + "received from : " + data.properties.headers.publisher, parsedData )
      }else{
        console.log("Message received with routing key hmi.update does not have a recognized path");
      } 
    }
    else{
      console.log(FILE + TAG + "Routing key not implemented in backend");
    }
}

function responseSuccessToSender(exchange, channel, msg, status){
  try{
    channel.publish(exchange, msg.properties.headers.report_topic, Buffer.from(JSON.stringify({status: status})), { headers: {publisher : PUBLISHER}});
  }catch(e){
    console.log(FILE + TAG + "could not send response message to sender : ", e);
  }
}

function requestManipInfos(exchange, channel, data){
  try{
    channel.publish(exchange, "hmi.update", data, { headers: {publisher : PUBLISHER, path: "/hmi/manipulation/info", report_topic: "hmi.update"}});
  }catch(e){
    console.log(FILE + TAG + "could not send response message to sender : ", e);
  }
}


module.exports = handleRoutingServerData;