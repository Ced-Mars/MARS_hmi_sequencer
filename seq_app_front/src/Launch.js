import React, { useEffect, useState } from "react";
import Button from '@mui/material/Button';

import socketIOClient from "socket.io-client";
import { FormControl } from "@mui/material";

const ENDPOINT = "http://127.0.0.1:4002";
const socket = socketIOClient(ENDPOINT);



export default function Launch(){
    const [response, setResponse] = useState("En attente connexion backend");
    const [actionType, setActionType] = React.useState(''); // type d'action (mandatory)
    const [element, setElement] = React.useState(''); // type element ciblé (mandatory)
    const [id, setId] = React.useState([]); // tableau de int, id des elements cible (optional)
    const [reference, setReference] = React.useState([]); // tableau de string reference des elements cible pour le test, soit EN6115V3-4 soit ASNA2392-3-04 
    const [location, setLocation] = React.useState(false); // si element type fastener, permet de rajouter la location du fastener (optional)
    const [locationid, setLocationId] = React.useState([]); // tableau de int, id des rail ciblés

  const handleChangeActionType = (event) => {
      if(event.target.value == "work"){
        setElement("fastener");
        setLocation(true);
      }else{
        setElement("rail");
        setLocation(false);
      }
    setActionType(event.target.value);
  };

  const handleChangeId = (event) => {
    let val = Array.from(event.target.selectedOptions , option => option.value);
    setId(val);
  };

  const handleChangeReference = (event) => {
    let val = Array.from(event.target.selectedOptions , option => option.value);
    setReference(val);
  };

  const handleChangeLocationId = (event) => {
    let val = Array.from(event.target.selectedOptions , option => option.value);
    setLocationId(val);
  };

    const handleExe = () => {
        if(location == false){
            var data = {
                "actionType": actionType,
                "element": element,
                "id": id
            }
        }else{
            var data = {
                "actionType": actionType,
                "element": element,
                "reference": reference,
                "location":{
                    "element":"rail",
                    "id": locationid
                }
            };
        };
        socket.emit("FromSeq", data);
    };

    useEffect(() => {
        socket.on("FromSeq", (a) => {
          setResponse(a);
        });
        return () => socket.disconnect();
      }, [socket]);

      useEffect(() => {
        if(response == "En attente connexion backend"){
            if(socket.connected == false){
                socket.connect();
            } 
        }
      }, [response]);


    return(
        <div>
            
            <form>

                <FormControl>
                   <label>
                    Action Type : 
                    <select value={actionType} onChange={handleChangeActionType}>
                        <option value={null}>None</option>
                        <option value="work">Work</option>
                        <option value="approach">Approach</option>
                        <option value="station">Sation</option>
                    </select>
                </label>
                {!location ? <label>
                    
                    Id(s) : 
                    <select multiple={true} value={id} onChange={handleChangeId}>
                        <option value={null}>None</option>
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                        <option value={4}>4</option>
                        <option value={5}>5</option>
                        <option value={6}>6</option>
                    </select>
                </label>
                 : null}
                
                {location ? <label>
                    Reference : 
                    <select multiple={true} value={reference} onChange={handleChangeReference}>
                        <option value={null}>None</option>
                        <option value="EN6115V3-4">EN6115V3-4</option>
                        <option value="ASNA2392-3-04">ASNA2392-3-04</option>
                    </select>
                </label> : null}
                
                { location ? 
                    <label>
                        Id(s) : 
                        <select multiple={true} value={locationid} onChange={handleChangeLocationId}>
                            <option value={null}>None</option>
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                            <option value={4}>4</option>
                            <option value={5}>5</option>
                            <option value={6}>6</option>
                        </select>
                    </label>
                    : null 
                } 
                <Button variant="contained" onClick={handleExe}>Exectuer Programme</Button>
                </FormControl>
                
            </form>
            <p>{response}</p>
        </div>
        
    );
}