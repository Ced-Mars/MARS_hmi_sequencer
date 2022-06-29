

function handleRunSequence(exchange, ch, dataToSend){
    //Reset HMI data
    ch.publish(exchange, "hmi.update", Buffer.from("reset"), { headers: {publisher : "sequencerHMI", path : "/hmi/reset"}});
    //send command to sequencer
    if(dataToSend){
      ch.publish(exchange, "request.hmi", Buffer.from(JSON.stringify(dataToSend)), { headers: {publisher : "sequencerHMI", path : "/sequence/run"}});
    }else{
      console.log("Trying to send but no data to send");
    }
}

module.exports = handleRunSequence;