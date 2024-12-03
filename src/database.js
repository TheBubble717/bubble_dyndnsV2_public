"use strict";
import { objectsanitizer } from "./bubble_expressescape_library.js"
import { classdata } from './main.js';
import * as mysql from "mysql"

class mysqlclass {
    constructor(config, log) {
        this.config = config;
        this.pool = null;
        this.log = log;

        this.routinedata = {
            "domains": [],
            "dnsentries":[],
            "bubbledns_settings": [],
            "bubbledns_servers": [],
            "mailserver_settings":[]
        },
        this.routinemanger = new RoutineManager()
    }

    connect(callback) {
        var that = this
        return new Promise(async (resolve, reject) => {
            that.pool = mysql.createPool(that.config.connectiondata);
            that.pool.getConnection(async function (err, connection) {
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
                    connection.release();
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
            that.pool.query(querry, async function (err, result) {
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

            that.pool.query(querry, sanitizedinputs, async function (err, result) {
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
                that.databasequerryhandler_secure(`select * FROM dns_entries where entryname = ? and entrytype = ? and domainid = ?`, ["@", entrytype, domainid]).then((response) => {
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

            var once_startup_masternode = async function () {
                return new Promise(async (resolve, reject) => {

                    await that.databasequerryhandler_secure("delete from bubbledns_servers_testvalues", [], async function (err, res) {
                        if (err) {
                            that.log.addlog("Error deleting old testvalues", { color: "red", warn: "Startup-Error", level: 3 })
                            process.exit(1)
                        }
                        else {
                            resolve()
                            return;
                        }
                    });
                });
            }

            var routine_fetch_domains = async function () {
                return new Promise(async (resolve, reject) => {
                    await that.databasequerryhandler_secure("select * from domains where isregistered=?", [true], async function (err, res) {
                        if (err) {
                            that.log.addlog("Error fetching Domains", { color: "red", warn: "Startup-Error", level: 3 })
                            process.exit(1)
                        }
                        else {
                            that.routinedata.domains = res;
                            resolve()
                        }
                    });
                });
            }

            var routine_fetch_bubbledns_settings = async function () {
                return new Promise(async (resolve, reject) => {
                    await that.databasequerryhandler_secure("select * from bubbledns_settings", [], async function (err, res) {
                        if (err) {
                            that.log.addlog("Error fetching Bubbledns_settings", { color: "red", warn: "Startup-Error", level: 3 })
                            process.exit(1)
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
                    });
                })
            }

            var routine_fetch_bubbledns_servers = async function () {
                await that.databasequerryhandler_secure("select * from bubbledns_servers", [], async function (err, res) {
                    if (err) {
                        that.log.addlog("Error fetching Bubbledns_servers", { color: "red", warn: "Startup-Error", level: 3 })
                        process.exit(1)
                    }
                    else {
                        //Check if something changed on this instance (f.e activating WEB)
                        if (that.routinedata.bubbledns_servers.length) //Ignore if empty
                        {
                            let thisserver_old = that.routinedata.bubbledns_servers.filter(function (r) { if ((r.public_ipv4 == that.config.public_ip) || (r.public_ipv6 == that.config.public_ip)) { return true } })
                            let thisserver_new = res.filter(function (r) { if ((r.public_ipv4 == that.config.public_ip) || (r.public_ipv6 == that.config.public_ip)) { return true } })
                            if (JSON.stringify(thisserver_old) != JSON.stringify(thisserver_new)) {
                                that.log.addlog("SERVER UPDATE DETECTED, KILLING PROGRAM", { color: "red", warn: "Startup-Error", level: 3 })
                                process.exit(1)
                            }
                        }

                        that.routinedata.bubbledns_servers = res;
                        resolve()
                    }
                });
            }

            var routine_synctest_bubbledns_servers = async function () {
                return new Promise(async (resolve, reject) => {
                    resolve() //Don't wait for test to finish
                    for (let i = 0; i < that.routinedata.bubbledns_servers.length; i++) {
                        if (!(that.routinedata.bubbledns_servers[i].public_ipv4 === classdata.db.config.public_ip || that.routinedata.bubbledns_servers[i].public_ipv6 === classdata.db.config.public_ip)) {
                            var synctestresult = await classdata.api.admin.bubbledns_servers_synctest({ "id": that.routinedata.bubbledns_servers[i].id })
                            if (that.config.debug && synctestresult.success === false) {
                                that.log.addlog(`Synctest ${that.routinedata.bubbledns_servers[i].subdomainname}.${that.routinedata.bubbledns_settings.maindomain} failed with error: ${synctestresult.msg}`, { color: "red", warn: "Routine-Error", level: 3 })
                            }
                        }
                    }
                    return;
                })
            }

            var routine_fetch_mailserver_settings = async function () {
                return new Promise(async (resolve, reject) => {
                    await that.databasequerryhandler_secure("select * from mailserver_settings", [], async function (err, res) {
                        if (err) {
                            that.log.addlog("Error fetching mailserver_settings", { color: "red", warn: "Startup-Error", level: 3 })
                            process.exit(1)
                        }
                        else {
                            that.routinedata.mailserver_settings = res;
                            resolve()
                        }
                    });
                })
            }

            if (this.routinemanger.listRoutines().length) {
                reject("Already active!")
            }

            await this.routinemanger.addRoutine(1, routine_fetch_domains, 30)
            this.log.addlog("Routine: Fetch_Domains activated", { color: "green", warn: "Startup-Info", level: 3 })
            await this.routinemanger.addRoutine(2, routine_fetch_bubbledns_settings, 30)
            this.log.addlog("Routine: Fetch_Bubbledns_settings activated", { color: "green", warn: "Startup-Info", level: 3 })
            await this.routinemanger.addRoutine(3, routine_fetch_bubbledns_servers, 30)
            this.log.addlog("Routine: Fetch_Bubbledns_servers activated", { color: "green", warn: "Startup-Info", level: 3 })
            await this.routinemanger.addRoutine(4, routine_fetch_mailserver_settings, 30)
            this.log.addlog("Routine: Fetch_mailserver_settings activated", { color: "green", warn: "Startup-Info", level: 3 })
            

            //Only Masternode
            var ismain = classdata.db.routinedata.bubbledns_servers.filter(function (r) { if (((r.public_ipv4 == that.config.public_ip) || (r.public_ipv6 == that.config.public_ip)) && (r.masternode == true)) { return true } })
            if (ismain.length) {

                await this.routinemanger.addRoutine(5, routine_synctest_bubbledns_servers, 180)
                this.log.addlog("Routine: Synctest from Masternode to Slaves activated", { color: "green", warn: "Startup-Info", level: 3 })
                await once_startup_masternode()
                this.log.addlog("ONCE: Startup-Commands activated", { color: "green", warn: "Startup-Info", level: 3 })

            }

            resolve();
            return;

        });
    }


}

class RoutineManager {
    constructor() {
        this.routines = new Map(); // Store routines with unique identifiers
    }

    /**
     * Add a routine
     * @param {string} id - Unique identifier for the routine
     * @param {function} process - Function to be executed
     * @param {number} interval - Time in seconds between executions
     */
    async addRoutine(id, process, interval) {
        var that = this;
        return new Promise(async (resolve, reject) => {
            if (that.routines.has(id)) {
                reject(`Routine with id "${id}" already exists.`)
                return;
            }

            const executeRoutine = async function () {
                try {
                    await process();
                    return;
                } catch (err) {
                    throw Error(`Error in routine "${id}": ${err.message}`)
                }
            };

            executeRoutine().then(function () {
                const timer = setInterval(executeRoutine, interval * 1000);
                that.routines.set(id, { process, interval, timer });
                resolve(`Routine "${id}" added.`);
                return;
            }).catch(function (err) {
                reject(err)
                return;
            })
            return;
        });
    }

    /**
     * Remove a routine
     * @param {string} id - Unique identifier for the routine
     */
    removeRoutine(id) {
        const routine = this.routines.get(id);
        if (!routine) {
            throw Error(`Routine with id "${id}" does not exist.`)
        }

        clearInterval(routine.timer); // Stop the routine
        this.routines.delete(id); // Remove it from the map
        return (`Routine "${id}" removed.`)
    }

    /**
     * List all active routines
     */
    listRoutines() {
        if (this.routines.size === 0) {
            return []
        }
        return (this.routines)
    }


    /**
     * Update an existing routine's interval
     * @param {string} id - Unique identifier for the routine
     * @param {number} newInterval - New interval time in milliseconds
     */
    updateRoutineInterval(id, newInterval) {
        const routine = this.routines.get(id);
        if (!routine) {
            throw Error(`Routine with id "${id}" does not exist.`)
        }

        clearInterval(routine.timer); // Clear the existing interval
        routine.timer = setInterval(routine.process, newInterval); // Set a new interval
        routine.interval = newInterval; // Update the interval

        return (`Routine "${id}" updated with new interval: ${newInterval}ms.`)
    }
}



export { mysqlclass }