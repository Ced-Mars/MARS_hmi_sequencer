import React, { useEffect, useState } from "react";
import { FormControlLabel, FormControl, Switch, Button } from "@mui/material";

import io from "socket.io-client";

export default function Launch(){
    const ENDPOINT = "http://127.0.0.1:4002";
    const [socket, setSocket] = useState(null);
    const [response, setResponse] = useState("En attente connexion backend");
    const [actionType, setActionType] = React.useState(''); // type d'action (mandatory)
    const [element, setElement] = React.useState(''); // type element ciblé (mandatory)
    const [id, setId] = React.useState([]); // tableau de int, id des elements cible (optional)
    const [reference, setReference] = React.useState([]); // tableau de string reference des elements cible pour le test, soit EN6115V3-4 soit ASNA2392-3-04 
    const [location, setLocation] = React.useState(false); // si element type fastener, permet de rajouter la location du fastener (optional)
    const [locationid, setLocationId] = React.useState([]); // tableau de int, id des rail ciblés
    const [choice, setChoice] = React.useState(false);
    const [running, setRunning] = React.useState(false);

    useEffect(() => {
        setSocket(io(ENDPOINT));
        return () => io(ENDPOINT).close();
      }, []);

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
    let val = Array.from(event.target.selectedOptions , option => parseInt(option.value));
    setId(val);
  };

  const handleChangeReference = (event) => {
    let val = Array.from(event.target.selectedOptions , option => option.value);
    setReference(val);
  };

  const handleChangeLocationId = (event) => {
    let val = Array.from(event.target.selectedOptions , option => parseInt(option.value));
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
        socket.emit("2Seq", data);
    };

    
    const handleExeGlobal = () => {
        var data = {
            "actionType": "work",
            "element": "fastener",
        }
        socket.emit("2Seq", data);
    };

    const handleChange = () => {
        setChoice(!choice);
    };

    useEffect(() => {
        if(socket){
            socket.on("connect", () => {
                console.log("socket id", socket.id); // "G5p5..."
                setResponse("Connected");
            });
            socket.on("Process", (a) => {
                  setRunning(a);
            });
            return () => socket.disconnect();
        }
      }, [socket]);

      useEffect(() => {
        if(response == "En attente connexion backend"){
            if(socket && socket.connected == false){
                socket.connect();
            } 
        }
      }, [response]);

    return(
        <div>
            <form style={{display:"flex", flexDirection:"column"}}>
                <FormControlLabel 
                disabled 
                control={
                <Switch color="primary" onChange={handleChange}>
                    checked={choice}
                </Switch>} 
                label={!choice ? "Génération Build Process à la volée" : "Générer Build Process depuis fichier config" } />
                {choice ?  
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
                    {!location ? 
                    <label>
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
                : 
                null 
                }
                <Button variant="contained" onClick={handleExe}>Exectuer Programme</Button>
                </FormControl>
            : 
            <FormControl>
                <Button variant="contained" onClick={handleExeGlobal} disabled={running}>{running? "Process En Cours" : "Execute Program"}</Button>
            </FormControl>
            }
                
                
            </form>
            <p>{response}</p>
        </div>
        
    );
}