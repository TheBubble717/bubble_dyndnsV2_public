"use strict";
import { addfunctions } from "./addfunctions.js"
import { objectsanitizer } from "./bubble_expressescape_library.js"
import { classdata } from './main.js';
import * as mysql from "mysql"

class mysqlclass {
    constructor(config, log) {
        this.config = config;
        this.connection = null;
        this.log = log;

        this.routinedata = {
            "domains": [],
            "bubbledns_settings": [],
            "bubbledns_servers": []
        }
    }

    connect(callback) {
        return new Promise(async (resolve, reject) => {
            var that = this;
            that.connection = mysql.createConnection(that.config.connectiondata);
            that.connection.connect(async function (err) {
                if (err) {
                    let error = `Error connecting to database! Message: ${err}`
                    if (callback && typeof callback == 'function') {
                        await callback(error, "");
                        resolve();
                    }
                    else {
                        reject(error);
                    }
                    return;
                }
                else {
                    let answer = `Successfully connected to Mysql-Database`
                    if (callback && typeof callback == 'function') {
                        await callback("", answer);
                        resolve();
                    }
                    else {
                        resolve(answer);
                    }
                    return;
                }
            })
        });
    }

    databasequerryhandler_unsecure(querry, callback) {
        var that = this;
        return new Promise(async (resolve, reject) => {
            that.connection.query(querry, async function (err, result) {
                if (err) {
                    let error = `Error in databasequerryhandler: ${err}`
                    if (callback && typeof callback == 'function') {
                        await callback(error, "");
                        resolve();
                    }
                    else {
                        reject(error);
                    }
                    return;
                }
                else {
                    if (callback && typeof callback == 'function') {
                        await callback("", objectsanitizer(result));
                        resolve();
                    }
                    else {
                        resolve(objectsanitizer(result));
                    }
                    return;
                }
            })
        });
    }

    databasequerryhandler_secure(querry, values, callback) {
        var that = this;
        return new Promise(async (resolve, reject) => {

            //Sanitize input again!
            var sanitizedinputs = objectsanitizer(values)

            if (JSON.stringify(values) !== JSON.stringify(sanitizedinputs)) {
                let error = `Tried to use special characters inside the databasequerryhandler`
                that.log.addlog(`Someone tried to use special characters inside the databasequerryhandler, was blocked successfully`, { color: "red", warn: "ExpressEscape-Error", level: 3 })
                if (callback && typeof callback == 'function') {
                    await callback(error, "");
                    resolve();
                }
                else {
                    reject(error);
                }
                return;
            }

            that.connection.query(querry, sanitizedinputs, async function (err, result) {
                if (err) {
                    let error = `Error in databasequerryhandler: ${err}`
                    if (callback && typeof callback == 'function') {
                        await callback(error, "");
                        resolve();
                    }
                    else {
                        reject(error);
                    }
                    return;
                }
                else {
                    let sanitizedoutputs = objectsanitizer(result)
                    if (callback && typeof callback == 'function') {
                        await callback("", sanitizedoutputs);
                        resolve();
                    }
                    else {
                        resolve(sanitizedoutputs);
                    }
                    return;
                }
            })
        });
    }

    dns_lookup(entryname, entrytype, domainid) {
        var that = this;
        return new Promise(async (resolve, reject) => {
            if (entryname == "@")   //Only wants the main entry
            {
                const promise1 = that.databasequerryhandler_secure(`select * FROM dns_entries where entryname = ? and entrytype = ? and domainid = ?`, ["@", entrytype, domainid]);
                Promise.all([promise1]).then((response) => {
                    if (response[0].length) //Answer with the entryname
                    {
                        resolve(response[0]);
                        return
                    }
                    reject("No Data found!")
                });
            }
            else {
                const promise1 = that.databasequerryhandler_secure(`select * FROM dns_entries where entryname = ? and entrytype = ? and domainid = ?`, [entryname, entrytype, domainid]);
                const promise2 = that.databasequerryhandler_secure(`select * FROM dns_entries where entryname = ? and entrytype = ? and domainid = ?`, ["*", entrytype, domainid]);
                Promise.all([promise1, promise2]).then((response) => {
                    if (response[0].length) //Answer with the entryname
                    {
                        resolve(response[0]);
                        return
                    }
                    if (response[1].length) //If the specific entryname doesnt exist, use the * value
                    {
                        resolve(response[1]);
                        return
                    }
                    reject("No Data found!")
                    return;
                });
            }

        });
    }

    enable_routines() {
        var that = this;
        return new Promise(async (resolve, reject) => {

            var once_startup_commands_masternode = async function () {
                return new Promise(async (resolve, reject) => {
                    var ismain = classdata.db.routinedata.bubbledns_servers.filter(function (r) { if (((r.ipv4address == that.config.public_ip) || (r.ipv6address == that.config.public_ip)) && (r.masternode == true)) { return true } })
                    if (ismain.length) {

                        routine_synctest_bubbledns_servers()
                        that.log.addlog("Routine: Synctest from Masternode to Slaves activated", { color: "green", warn: "Startup-Info", level: 3 })

                        await that.databasequerryhandler_secure("delete from bubbledns_servers_testvalues", [], async function (err, res) {
                            if (err) {
                                that.log.addlog("Error deleting old testvalues", { color: "red", warn: "Startup-Error", level: 3 })
                                process.exit("Error deleting old testvalues")
                            }
                            else {
                                resolve()
                                return;
                            }
                        });
                        return;
                    }
                    resolve()
                    return;

                });
            }

            var routine_fetchdomains = async function () {
                return new Promise(async (resolve, reject) => {
                    do {
                        await that.databasequerryhandler_secure("select * from domains where isregistered=?", [true], async function (err, res) {
                            if (err) {
                                that.log.addlog("Error fetching Domains", { color: "red", warn: "Startup-Error", level: 3 })
                                process.exit("Error fetching Domains")
                            }
                            else {
                                that.routinedata.domains = res;
                                resolve()
                            }
                            await addfunctions.waittime(60)
                        });

                    }
                    while (true)
                });
            }

            var routine_fetchbubbledns_settings = async function () {
                return new Promise(async (resolve, reject) => {
                    do {
                        await that.databasequerryhandler_secure("select * from bubbledns_settings", [], async function (err, res) {
                            if (err) {
                                that.log.addlog("Error fetching Bubbledns_settings", { color: "red", warn: "Startup-Error", level: 3 })
                                process.exit("Error fetching Bubbledns_settings")
                            }
                            else {
                                var settings = {}
                                for (let i = 0; i < res.length; i++) {
                                    res[i].variablevalue = res[i].variablevalue.replace(/`/g, '"'); //JSON.parse requires " instead of `
                                    try {
                                        settings[res[i].variablename] = JSON.parse(res[i].variablevalue);
                                    }
                                    catch (err) {
                                        settings[res[i].variablename] = res[i].variablevalue
                                    }
                                }
                                that.routinedata.bubbledns_settings = settings;
                                resolve()
                            }
                            await addfunctions.waittime(60)
                        });

                    }
                    while (true)
                })
            }

            var routine_fetch_bubbledns_servers = async function () {
                var startupcompleted = false
                return new Promise(async (resolve, reject) => {
                    do {

                        await that.databasequerryhandler_secure("select * from bubbledns_servers", [], async function (err, res) {
                            if (err) {
                                that.log.addlog("Error fetching Bubbledns_servers", { color: "red", warn: "Startup-Error", level: 3 })
                                process.exit("Error fetching Bubbledns_servers")
                            }
                            else {
                                //Check if something changed on this instance (f.e activating WEB)
                                if (startupcompleted) //Ignore start
                                {
                                    let thisserver_old = that.routinedata.bubbledns_servers.filter(function (r) { if ((r.ipv4address == that.config.public_ip) || (r.ipv6address == that.config.public_ip)) { return true } })
                                    let thisserver_new = res.filter(function (r) { if ((r.ipv4address == that.config.public_ip) || (r.ipv6address == that.config.public_ip)) { return true } })
                                    if (JSON.stringify(thisserver_old) != JSON.stringify(thisserver_new)) {
                                        that.log.addlog("SERVER UPDATE DETECTED, KILLING PROGRAM", { color: "red", warn: "Startup-Error", level: 3 })
                                        process.abort("SERVER UPDATE DETECTED, KILLING PROGRAM")
                                    }
                                }

                                that.routinedata.bubbledns_servers = res;
                                startupcompleted = true
                                resolve()
                            }
                            await addfunctions.waittime(60)
                        });

                    }
                    while (true)
                })
            }

            var routine_synctest_bubbledns_servers = async function () {
                return new Promise(async (resolve, reject) => {
                    resolve()
                    await addfunctions.waittime(10) //Wait for whole startup to be completed         
                    do {
                        for (let i = 0; i < that.routinedata.bubbledns_servers.length; i++) {
                            if (!(that.routinedata.bubbledns_servers[i].ipv4address === classdata.db.config.public_ip || that.routinedata.bubbledns_servers[i].ipv6address === classdata.db.config.public_ip)) {
                                var synctestresult = await classdata.api.admin.bubbledns_servers_synctest({ "id": that.routinedata.bubbledns_servers[i].id })
                                if (that.config.debug && synctestresult.success === false) {
                                    that.log.addlog(`Synctest ${that.routinedata.bubbledns_servers[i].subdomainname}.${that.routinedata.bubbledns_settings.maindomain} failed with error: ${synctestresult.msg}`, { color: "red", warn: "Routine-Error", level: 3 })
                                }
                            }
                        }
                        await addfunctions.waittime(180)

                    }
                    while (true)
                })
            }

            var routine_fetch_mailserver_settings = async function () {
                var startupcompleted = false
                return new Promise(async (resolve, reject) => {
                    do {

                        await that.databasequerryhandler_secure("select * from mailserver_settings", [], async function (err, res) {
                            if (err) {
                                that.log.addlog("Error fetching mailserver_settings", { color: "red", warn: "Startup-Error", level: 3 })
                                process.exit("Error fetching mailserver_settings")
                            }
                            else {
                                that.routinedata.mailserver_settings = res;
                                resolve()
                            }
                            await addfunctions.waittime(60)
                        });
                    }
                    while (true)
                })
            }

            if (that.routinedata.domains.length != 0 || that.routinedata.bubbledns_servers.length !== 0) {
                reject("Already active!")
                return
            }

            await routine_fetchdomains()
            that.log.addlog("Routine: FetchDomains activated", { color: "green", warn: "Startup-Info", level: 3 })
            await routine_fetchbubbledns_settings()
            that.log.addlog("Routine: FetchBubbledns_settings activated", { color: "green", warn: "Startup-Info", level: 3 })
            await routine_fetch_bubbledns_servers()
            that.log.addlog("Routine: FetchBubbledns_servers activated", { color: "green", warn: "Startup-Info", level: 3 })
            await routine_fetch_mailserver_settings()
            that.log.addlog("Routine: Fetchmailserver_settings activated", { color: "green", warn: "Startup-Info", level: 3 })
            await once_startup_commands_masternode()
            that.log.addlog("ONCE: Startup-Commands activated", { color: "green", warn: "Startup-Info", level: 3 })



            resolve()
            return;

        });
    }

}

export { mysqlclass }