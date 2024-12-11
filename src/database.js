"use strict";
import { addfunctions } from "./addfunctions.js";
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
        this.routinecaches = {
            dnsentries : [],
            dnsentries_locks: {}
        }
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

    //Rewritten+
    async databasequerryhandler_secure(query, values, callback) {
        const that = this;
    
        // Sanitize inputs
        const sanitizedInputs = objectsanitizer(values);
    
        if (JSON.stringify(values) !== JSON.stringify(sanitizedInputs)) {
            const error = `Tried to use special characters inside the databasequerryhandler`;
            that.log.addlog(`Someone tried to use special characters inside the databasequerryhandler, was blocked successfully`,{ color: "red", warn: "ExpressEscape-Error", level: 3 });
            
            if (callback && typeof callback === 'function') {
                await callback(error, null);
            }
            throw new Error(error);
        }
    
        try {
            // Execute the query using the connection pool
            const result = await new Promise((resolve, reject) => {
                that.pool.query(query, sanitizedInputs, (err, res) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(res);
                });
            });
    
            // Sanitize outputs
            var sanitizedOutputs = objectsanitizer(result);

            if (callback && typeof callback === 'function') {
                await callback(null, sanitizedOutputs);
            }
    
            return sanitizedOutputs;
        } catch (err) {
            const error = `Error in databasequerryhandler: ${err}`;
            if (callback && typeof callback === 'function') {
                await callback(error, null);
            }
            throw new Error(error);
        }
    }

    dns_lookup(entryname, entrytype, domainid) {
        var that = this;
    
        // Initialize a lock system for handling concurrency
        if (!that.routinecaches.dnsentries_locks) {
            that.routinecaches.dnsentries_locks = {};
        }
    
        const lockKey = `${entryname}:${entrytype}:${domainid}`;
    
        return new Promise(async (resolve, reject) => {
            // Check if there's an ongoing request for the same key
            if (that.routinecaches.dnsentries_locks[lockKey]) {
                that.routinecaches.dnsentries_locks[lockKey].then(resolve).catch(reject);
                return;
            }
    
            // Create a new lock for this request
            that.routinecaches.dnsentries_locks[lockKey] = new Promise(async (lockResolve, lockReject) => {
                try {
                    // Check for exact cached entry
                    const locallysavedexact = that.routinecaches.dnsentries.filter(function (r) {
                        return r.entryname === entryname && r.entrytype === entrytype && r.domainid === domainid;
                    });
    
                    if (locallysavedexact.length) {
                        if (locallysavedexact.length === 1 && locallysavedexact[0].noData) {
                            // Check for wildcard cached entry as a fallback
                            const locallysavedstar = that.routinecaches.dnsentries.filter(function (r) {
                                return r.entryname === "*" && r.entrytype === entrytype && r.domainid === domainid;
                            });
                            if (locallysavedstar.length === 1 && locallysavedstar[0].noData) {
                                lockReject("No Data found! (Cached)");
                            } else {
                                lockResolve(locallysavedstar);
                            }
                            delete that.routinecaches.dnsentries_locks[lockKey];
                            return;
                        } else {
                            lockResolve(locallysavedexact);
                            delete that.routinecaches.dnsentries_locks[lockKey];
                            return;
                        }
                    }
    
                    // If "@" (main entry) is requested
                    if (entryname === "@") {
                        const response = await that.databasequerryhandler_secure(
                            `select * FROM dns_entries where entryname = ? and entrytype = ? and domainid = ?`,
                            ["@", entrytype, domainid]
                        );
    
                        if (response.length) {
                            that.routinecaches.dnsentries = that.routinecaches.dnsentries.concat(response);
                            lockResolve(response);
                        } else {
                            that.routinecaches.dnsentries.push({ entryname, entrytype, domainid, noData: true });
                            lockReject("No Data found! (Requested)");
                        }
                        delete that.routinecaches.dnsentries_locks[lockKey];
                        return;
                    }
    
                    // Database query for both exact and wildcard entries
                    const [exactResponse, wildcardResponse] = await Promise.all([
                        that.databasequerryhandler_secure(
                            `select * FROM dns_entries where entryname = ? and entrytype = ? and domainid = ?`,
                            [entryname, entrytype, domainid]
                        ),
                        that.databasequerryhandler_secure(
                            `select * FROM dns_entries where entryname = ? and entrytype = ? and domainid = ?`,
                            ["*", entrytype, domainid]
                        ),
                    ]);
    
                    if (exactResponse.length) {
                        that.routinecaches.dnsentries = that.routinecaches.dnsentries.concat(exactResponse);
                        lockResolve(exactResponse);
                    } else {
                        that.routinecaches.dnsentries.push({ entryname, entrytype, domainid, noData: true });
                    }
    
                    if (wildcardResponse.length) {
                        const existingWildcard = that.routinecaches.dnsentries.filter(function (r) {
                            return r.entryname === "*" && r.entrytype === entrytype && r.domainid === domainid;
                        });
                        if (!existingWildcard.length) {
                            that.routinecaches.dnsentries = that.routinecaches.dnsentries.concat(wildcardResponse);
                        }
                        lockResolve(wildcardResponse);
                    } else {
                        const existingWildcard = that.routinecaches.dnsentries.filter(function (r) {
                            return r.entryname === "*" && r.entrytype === entrytype && r.domainid === domainid;
                        });
                        if (!existingWildcard.length) {
                            that.routinecaches.dnsentries.push({ entryname: "*", entrytype, domainid, noData: true });
                        }
                    }
                    
                    lockReject("No Data found! (Requested)");
                    delete that.routinecaches.dnsentries_locks[lockKey];
                } catch (err) {
                    lockReject(err);
                    delete that.routinecaches.dnsentries_locks[lockKey];
                }
            });
    
            // Wait for the lock's result
            that.routinecaches.dnsentries_locks[lockKey].then(resolve).catch(reject);
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

            var routine_delete_cache_dnsentry = async function () {
                return new Promise(async (resolve, reject) => {
                    that.routinecaches.dnsentries = [];
                    resolve()
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
            await this.routinemanger.addRoutine(5, routine_delete_cache_dnsentry, 10)
            this.log.addlog("Routine: Delete_cache_dnsentry activated", { color: "green", warn: "Startup-Info", level: 3 })
            

            //Only Masternode
            var ismain = classdata.db.routinedata.bubbledns_servers.filter(function (r) { if (((r.public_ipv4 == that.config.public_ip) || (r.public_ipv6 == that.config.public_ip)) && (r.masternode == true)) { return true } })
            if (ismain.length) {

                await this.routinemanger.addRoutine(6, routine_synctest_bubbledns_servers, 180)
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