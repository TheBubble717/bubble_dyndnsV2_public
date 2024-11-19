"use strict";
import { addfunctions } from "./addfunctions.js"
import { mainlog } from "bubble_log_library"
var log = mainlog()

//+++++++++++++
//ESCAPE FUNCTIONS 

var escape = function (req, res, next) {

    //DATA-Transaction
    var triedspecialchars = false;
    if (req.method === "GET") {
        let newquery = objectsanitizer(req.query)
        if (JSON.stringify(newquery) === JSON.stringify(req.query)) {
            newquery = objectconverter(newquery)
            req.query = newquery;
        }
        else {
            triedspecialchars = true;
        }
    }
    else if (req.method === "POST") {
        let newbody = objectsanitizer(req.body)
        if (JSON.stringify(newbody) === JSON.stringify(req.body)) {
            newbody = objectconverter(newbody)
            req.body = newbody;
        }
        else {
            triedspecialchars = true;
        }
    }
    else {
        log.addlog("NON POST OR GET received, ignoring in EscapeLibrary", { color: "yellow", warn: "ExpressEscape-Warning" })
    }

    //If special characters were found, directly decline message
    if (triedspecialchars) {
        var messagedata = "?Unkown?"
        if (req.method === "GET") {
            messagedata = req.query
        }
        if (req.method === "POST") {
            messagedata = req.body
        }



        log.addlog(`User with IP=${addfunctions.getclientipv4(req)} tried to use special characters! Message: ${JSON.stringify(messagedata)}`, { colour: "red", warn: "ExpressEscape-Error" })
        res.writeHead(403, { 'Content-Type': 'text/html' });
        res.write(JSON.stringify({ "success": false, "msg": "Unknown Error" }))
        res.end();
        return;
    }
    else {
        next();
    }

};

function objectsanitizer(obj) {
    if (Array.isArray(obj)) {
        return obj.map(element => objectsanitizer(element));
    } else if (obj instanceof Object) {
        let arrofobj = Object.entries(obj);
        let newobj = {}
        for (let i = 0; i < arrofobj.length; i++) {
            // If an object or array is inside another object, start the same function inside itself (null is an "object")
            if (typeof arrofobj[i][1] === 'object' && arrofobj[i][1] !== null) {
                newobj[arrofobj[i][0]] = objectsanitizer(arrofobj[i][1]);
            }
            // Numbers inside an objectsanitizer result in text -> Error because it's different, so ignore numbers
            else if ((typeof arrofobj[i][1] == "number") || typeof arrofobj[i][1] == "boolean" || arrofobj[i][1] == null) {
                newobj[arrofobj[i][0]] = arrofobj[i][1];
            } else {
                // newobj[arrofobj[i][0]] = validator.blacklist(validator.escape(arrofobj[i][1]), blacklist)
                newobj[arrofobj[i][0]] = arrofobj[i][1].replace(/\&/g, '&amp;').replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace(/\"/g, '&quot;').replace(/\'/g, '&#x27;').replace(/\//g, '&#x2F;');
            }
        }
        return newobj;
    } else if (typeof obj == "string") {
        // return validator.blacklist(validator.escape(obj), blacklist)
        return obj.replace(/\&/g, '&amp;').replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace(/\"/g, '&quot;').replace(/\'/g, '&#x27;').replace(/\//g, '&#x2F;');
    } else {
        return obj;
    }
}

//---------------
//ESCAPE FUNCTIONS 


//+++++++++++++
//Convert strings to better fitting data type


//Convert f.e ["null", "true", "false", "123", "45.67", "hello"] into  [null, true, false, 123, 45.67, 'hello']

function objectconverter(obj) {
    if (obj instanceof Object) {
        let arrofobj = Object.entries(obj);
        let newobj = {}
        for (let i = 0; i < arrofobj.length; i++) {
            //If an object is inside another object, start the same function inside itself (null is an "object")
            if (typeof arrofobj[i][1] === 'object' && arrofobj[i][1] !== null) {
                newobj[arrofobj[i][0]] = objectconverter(arrofobj[i][1])
            }
            //Numbers, booleans or null are allready in the right data type
            else if ((typeof arrofobj[i][1] == "number") || typeof arrofobj[i][1] == "boolean" || arrofobj[i][1] == null) {
                newobj[arrofobj[i][0]] = arrofobj[i][1]
            }
            else {
                newobj[arrofobj[i][0]] = convertString(arrofobj[i][1])
            }

        }
        return newobj;
    }
    else if (typeof obj == "string") {
        return convertString(obj)
    }
    else {
        return obj
    }
}

function convertString(inputStr) {

    if (inputStr === "") {
        return ""
    }

    // Check for null
    else if (inputStr.toLowerCase() === 'null') {
        return null;
    }

    // Check for boolean
    else if (inputStr.toLowerCase() === 'true') {
        return true;
    }
    else if (inputStr.toLowerCase() === 'false') {
        return false;
    }

    // Check for integer
    else if (!isNaN(inputStr) && Number.isInteger(parseFloat(inputStr))) {
        return parseInt(inputStr, 10);
    }

    // Check for float
    else if (!isNaN(inputStr) && !Number.isInteger(parseFloat(inputStr))) {
        return parseFloat(inputStr);
    }

    else {
        // If no other type is applicable, return the string itself
        return inputStr;
    }


}

//--------------
//Convert strings to better fitting ones




export { escape, objectconverter, objectsanitizer }