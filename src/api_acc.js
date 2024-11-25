
"use strict";
import { addfunctions } from "./addfunctions.js"
import * as crypto from 'crypto';
import { classdata } from './main.js';

class apiclass_acc {
    constructor(config, log) {
        this.config = config;
        this.log = log
    }

    auth_cookie(cookie) //Login with the Cookie, Returns the userclass
    {
        var that = this
        return new Promise(async (resolve) => {
            classdata.db.databasequerryhandler_secure(`select users.*,users_sessions.cookie from users INNER JOIN users_sessions ON users.id = users_sessions.userid where users_sessions.cookie = ? AND users.isactive = ? AND users.confirmedmail = ? AND users_sessions.active_until >= ?`, [cookie, true, true, addfunctions.unixtime_to_local(new Date().valueOf())], function (err, result) {
                if (err) {
                    that.log.addlog("Unknown ERROR:" + err, { color: "yellow", warn: "API-ACC-Warning", level: 2 })
                    resolve({ "success": false, "msg": "Unknown Error" })
                    return;
                }
                if (result.length) {

                    resolve({ "success": true, "data": new classdata.classes.userclass(result[0]) })
                    return;
                }
                else {
                    resolve({ "success": false, "msg": "No user found!" })
                    return;
                }
            });
        });
    }

    auth_api(apikey) //Login with the APIKEY, Returns the userclass
    {
        var that = this
        return new Promise(async (resolve) => {
            classdata.db.databasequerryhandler_secure(`select users.*,users_sessions.cookie from users INNER JOIN users_sessions ON users.id = users_sessions.userid where users.api = ? AND users.isactive = ? AND users.confirmedmail = ?`, [apikey, true, true], function (err, result) {
                if (err) {
                    that.log.addlog("Unknown ERROR:" + err, { color: "yellow", warn: "API-ACC-Warning", level: 2 })
                    resolve({ "success": false, "msg": "Unknown Error" })
                    return;
                }
                if (result.length) {
                    resolve({ "success": true, "data": new classdata.classes.userclass(result[result.length - 1]) })
                    return;
                }
                else {
                    resolve({ "success": false, "msg": "No user found!" })
                    return;
                }
            });
        });
    }

    auth_isadmin_cookie(cookie)//Check if Cookie belongs to an admin, returns true(admin) or false
    {
        return new Promise(async (resolve) => {
            var that = this;
            let user = await that.auth_cookie(cookie)
            if (user.success) {
                resolve(user.data.get_user_personal().isadmin)
                return;
            }
            else {
                resolve(false)
                return;
            }

        });
    }

    auth_isadmin_api(apikey)//Check if Cookie belongs to an admin, returns true(admin) or false
    {
        return new Promise(async (resolve) => {
            var that = this;
            let user = await that.auth_api(apikey)
            if (user.success) {
                resolve(user.data.get_user_personal().isadmin)
                return;
            }
            else {
                resolve(false)
                return;
            }

        });
    }

    auth_login(logindata) //Login with mailaddress and Passwort, returns Cookie & API key
    {
        var that = this;
        return new Promise(async (resolve) => {

            let requiredFields = { "mailaddress": "string", "password": "string", "useripv4": ["string", "null"], "useripv6": ["string", "null"] };
            logindata = addfunctions.objectconverter(logindata)
            let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, logindata)
            if (!check_for_correct_datatype.success) {
                resolve({ "success": false, "msg": check_for_correct_datatype.msg })
                return;
            }

            //IPV4 & IPV6 check
            logindata.useripv4 = addfunctions.isIPv4(logindata.useripv4) === true ? logindata.useripv4 : null;
            logindata.useripv6 = addfunctions.isIPv6(logindata.useripv6) === true ? logindata.useripv6 : null;


            //Mailaddress & Password check
            let checkeduserdata = await addfunctions.check_for_valid_user_entries({ "mailaddress": logindata.mailaddress, "password1": logindata.password })
            if (!checkeduserdata.success) {
                resolve(checkeduserdata)
                return
            }

            var passwordhash = auth_getpwhash(logindata.password, logindata.mailaddress)
            classdata.db.databasequerryhandler_secure(`select * from users where mailaddress = ? AND passwordhash = ? AND isactive = ?`, [logindata.mailaddress, passwordhash, true], async function (err, user) {
                if (err) {
                    that.log.addlog("Unknown ERROR:" + err, { color: "yellow", warn: "API-ACC-Warning", level: 2 })
                    resolve({ "success": false, "msg": "Unknown Error" })
                    return;
                }
                if (!user.length) {
                    resolve({ "success": false, "msg": "Password or mailaddress wrong!" })
                    return;
                }

                //Get free Cookie for user
                try {
                    do {
                        var randomcookie = addfunctions.randomcookief()
                        var answer = await classdata.db.databasequerryhandler_secure(`select * from users_sessions where cookie = ?`, [randomcookie]);
                    }
                    while (answer && answer.length)

                }
                catch (err) {
                    that.log.addlog("Unknown ERROR:" + err, { color: "yellow", warn: "API-ACC-Warning", level: 2 })
                    resolve({ "success": false, "msg": "Unknown Error" })
                    return;
                }

                //Get free id for the session
                try {
                    do {
                        var randomid = addfunctions.randomidf()
                        var answer = await classdata.db.databasequerryhandler_secure(`select * from users_sessions where cookie = ?`, [randomid]);
                    }
                    while (answer && answer.length)

                }
                catch (err) {
                    that.log.addlog("Unknown ERROR:" + err, { color: "yellow", warn: "API-ACC-Warning", level: 2 })
                    resolve({ "success": false, "msg": "Unknown Error" })
                    return;
                }

                if (!user[0].confirmedmail) {
                    resolve({ "success": false, "msg": "Mailaddress not confirmed, please confirm to login" })
                    return;
                }



                //UPDATE-DB (New time + new cookie)
                user[0].sessionid = randomid;
                user[0].cookie = randomcookie;
                user[0].ipv4 = logindata.useripv4;
                user[0].ipv6 = logindata.useripv6;
                user[0].active_until = addfunctions.unixtime_to_local(new Date().valueOf() + 30 * 24 * 60 * 60 * 1000)
                user[0].logintime = addfunctions.unixtime_to_local()

                classdata.db.databasequerryhandler_secure(`insert into users_sessions values (?,?,?,?,?,?,?);`, [user[0].sessionid, user[0].id, user[0].cookie, user[0].ipv4, user[0].ipv6, user[0].active_until, user[0].logintime], function (err, answer) {
                    if (err) {
                        that.log.addlog("Unknown ERROR:" + err, { color: "yellow", warn: "API-ACC-Warning", level: 2 })
                        resolve({ "success": false, "msg": "Unknown Error" })
                        return;
                    }
                    if (answer.affectedRows === 1) {

                        resolve({ "success": true, "data": { cookie: user[0].cookie, api: user[0].api, id: user[0].id } })
                        return;
                    }
                    else {
                        resolve({ "success": false, "msg": "Databaseupdate failed" })
                        return;
                    }
                });

            });
        });
    }

    auth_register(registerdata) //Returns cookie and api of useraccount
    {

        var that = this;
        return new Promise(async (resolve) => {

            let requiredFields = { "mailaddress": "string", "password1": "string", "password2": "string", "useripv4": ["string", "null"], "useripv6": ["string", "null"] };
            registerdata = addfunctions.objectconverter(registerdata)
            let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, registerdata)
            if (!check_for_correct_datatype.success) {
                resolve({ "success": false, "msg": check_for_correct_datatype.msg })
                return;
            }

            if (!classdata.db.routinedata.bubbledns_settings.enable_register) {
                resolve({ "success": false, "msg": "Registration is disabled!" })
                return;
            }

            //IPV4 & IPV6 check
            registerdata.useripv4 = addfunctions.isIPv4(registerdata.useripv4) === true ? registerdata.useripv4 : null;
            registerdata.useripv6 = addfunctions.isIPv6(registerdata.useripv6) === true ? registerdata.useripv6 : null;


            //Find free id for the user
            try {
                do {
                    var randomid = addfunctions.randomidf()
                    var answer = await classdata.db.databasequerryhandler_secure(`select * from users where id = ?`, [randomid]);
                }
                while (answer && answer.length)

            }
            catch (err) {
                that.log.addlog("Unknown ERROR:" + err, { color: "yellow", warn: "API-ACC-Warning", level: 2 })
                resolve({ "success": false, "msg": "Unknown Error" })
                return;
            }


            //Find free apikey for the user
            try {
                do {
                    var randomapi = addfunctions.randomapif()
                    var answer = await classdata.db.databasequerryhandler_secure(`select * from users where api = ?`, [randomapi]);
                }
                while (answer && answer.length)

            }
            catch (err) {
                that.log.addlog("Unknown ERROR:" + err, { color: "yellow", warn: "API-ACC-Warning", level: 2 })
                resolve({ "success": false, "msg": "Unknown Error" })
                return;
            }


            //Find free Cookie for the user
            try {
                do {
                    var randomcookie = addfunctions.randomcookief()
                    var answer = await classdata.db.databasequerryhandler_secure(`select * from users_sessions where cookie = ?`, [randomcookie]);
                }
                while (answer && answer.length)

            }
            catch (err) {
                that.log.addlog("Unknown ERROR:" + err, { color: "yellow", warn: "API-ACC-Warning", level: 2 })
                resolve({ "success": false, "msg": "Unknown Error" })
                return;
            }


            //Get free id for the session
            try {
                do {
                    var randomsessionid = addfunctions.randomidf()
                    var answer = await classdata.db.databasequerryhandler_secure(`select * from users_sessions where cookie = ?`, [randomsessionid]);
                }
                while (answer && answer.length)

            }
            catch (err) {
                that.log.addlog("Unknown ERROR:" + err, { color: "yellow", warn: "API-ACC-Warning", level: 2 })
                resolve({ "success": false, "msg": "Unknown Error" })
                return;
            }

            //Check if mailaddress is still free
            let preventdouble = await classdata.db.databasequerryhandler_secure(`select * from users where mailaddress = ?`, [registerdata.mailaddress])
            if (preventdouble.length) {
                resolve({ "success": false, "msg": "mailaddress already in use" })
                return
            }

            //Mailaddress & Password check
            let checkeduserdata = await addfunctions.check_for_valid_user_entries({ "mailaddress": registerdata.mailaddress, "password1": registerdata.password1, "password2": registerdata.password2 })
            if (!checkeduserdata.success) {
                resolve(checkeduserdata)
                return
            }

            let currenttime = addfunctions.unixtime_to_local()

            let user = { "id": randomid, "sessionid": randomsessionid, "mailaddress": registerdata.mailaddress, "passwordhash": auth_getpwhash(registerdata.password1, registerdata.mailaddress), "cookie": randomcookie, "api": randomapi, "ipv4": registerdata.useripv4, "ipv6": registerdata.useripv6, "isadmin": false, "isactive": true, "maxentries": classdata.db.routinedata.bubbledns_settings.standardmaxentries, "maxdomains": classdata.db.routinedata.bubbledns_settings.standardmaxdomains, "active_until": addfunctions.unixtime_to_local(new Date().valueOf() + 30 * 24 * 60 * 60 * 1000), "logintime": currenttime, "confirmedmail": false, "registrationdate": currenttime }

            var promise1 = classdata.db.databasequerryhandler_secure("INSERT INTO users values (?,?,?,?,?,?,?,?,?,?)", [user.id, user.mailaddress, auth_getpwhash(registerdata.password1, registerdata.mailaddress), user.api, user.isadmin, user.isactive, user.maxentries, user.maxdomains, user.confirmedmail, user.registrationdate]);
            var promise2 = classdata.db.databasequerryhandler_secure("INSERT INTO users_sessions values (?,?,?,?,?,?,?);", [user.sessionid, user.id, user.cookie, user.ipv4, user.ipv6, user.active_until, user.logintime]);
            Promise.all([promise1, promise2]).then(async function (response) {
                classdata.mail.mailconfirmation_create({ "keytype": 2, "userid": user.id })
                resolve({ "success": true, "data": { cookie: user.cookie, api: user.api, id: user.id } })
                return;
            })
                .catch(function (err) {
                    that.log.addlog("Unknown ERROR:" + err, { color: "yellow", warn: "API-ACC-Warning", level: 2 })
                    resolve({ "success": false, "msg": "Unknown Error" })
                    return;
                })

        });

    }

    get_user_full(usertoinspect)  //Returns all details of a specific user [0] = user_sessions, [1] = user_data(as userclass), [2] = domains_owner,[3] = domains_shared
    {
        let requiredFields = { "id": "number" };
        usertoinspect = addfunctions.objectconverter(usertoinspect)
        let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, usertoinspect)
        if (!check_for_correct_datatype.success) {
            resolve({ "success": false, "msg": check_for_correct_datatype.msg })
            return;
        }

        var user_sessions = function (userid) {
            return new Promise(async (resolve, reject) => {
                classdata.db.databasequerryhandler_secure(`select * from users_sessions where userid=? `, [userid], function (err, res) {
                    if (err) {
                        reject(err)
                        return;
                    }
                    resolve(res)
                    return;
                });
            });
        }

        var user_data = function (userid) {
            return new Promise(async (resolve, reject) => {
                classdata.db.databasequerryhandler_secure(`select * from users where id=? `, [userid], function (err, res) {
                    if (err) {
                        reject(err)
                        return;
                    }
                    resolve(new classdata.classes.userclass(res[0]))
                    return;
                });
            });
        }

        var that = this;
        return new Promise(async (resolve) => {

            var promise1 = user_sessions(usertoinspect.id);
            var promise2 = user_data(usertoinspect.id)
            var promise3 = classdata.api.dns.domain_list_owner(new classdata.classes.userclass({ "id": usertoinspect.id }))
            var promise4 = classdata.api.dns.domain_list_shared(new classdata.classes.userclass({ "id": usertoinspect.id }))
            Promise.all([promise1, promise2, promise3, promise4]).then((response) => {
                resolve({ "success": true, "data": response })
                return;
            })
                .catch(function (err) {
                    resolve({ "success": false, "msg": "Error inspecting User" })
                    return;
                });
        });
    }

    get_user_all()  //Returns all users as userclass
    {
        var that = this;
        return new Promise(async (resolve) => {
            classdata.db.databasequerryhandler_secure(`select * from users`, [], function (err, results) {
                if (err) {
                    that.log.addlog("Unknown ERROR:" + err, { color: "yellow", warn: "API-ACC-Warning", level: 2 })
                    resolve({ "success": false, "msg": "Unknown Error" })
                    return;
                }

                var users = []
                for (let i = 0; i < results.length; i++) {
                    users.push(new classdata.classes.userclass(results[i]))
                    /*
                    let newuser = new classdata.classes.userclass()
                    let setworked = newuser.set_user_data(results[i])
                    if(setworked.success){"Error setting user:"+ setworked.msg}
                    */

                }

                resolve({ "success": true, "data": users })
                return;

            });

        });
    }

    update_user(data) {
        var that = this;
        return new Promise(async (resolve) => {

            let requiredFields = { "id": "number", "isactive": ["boolean", "number"], "confirmedmail": ["boolean", "number"], "isadmin": ["boolean", "number"], "maxdomains": "number", "maxentries": "number", "password": ["string", "null"], "newpassword": "boolean", "mailaddress": "string" };
            data = addfunctions.objectconverter(data)
            let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, data)
            if (!check_for_correct_datatype.success) {
                resolve({ "success": false, "msg": check_for_correct_datatype.msg })
                return;
            }

            if (data.newpassword) {

                //Password check
                let checkeduserdata = await addfunctions.check_for_valid_user_entries({ "password1": data.password })
                if (!checkeduserdata.success) {
                    resolve(checkeduserdata)
                    return
                }

                classdata.db.databasequerryhandler_secure(`UPDATE users SET mailaddress = ?, passwordhash =?,isadmin = ?,confirmedmail = ?, isactive=?, maxentries =?, maxdomains =? where id= ?`, [data.mailaddress, auth_getpwhash(data.password, data.mailaddress), data.isadmin, data.confirmedmail, data.isactive, data.maxentries, data.maxdomains, data.id], function (err, results) {
                    if (err) {
                        that.log.addlog("Unknown ERROR:" + err, { color: "yellow", warn: "API-ACC-Warning", level: 2 })
                        resolve({ "success": false, "msg": "Unknown Error" })
                        return;
                    }

                    if (results.affectedRows == 1) {
                        resolve({ "success": true, "data": "Userupdate saved" })
                        return;
                    }
                    else {
                        resolve({ "success": false, "msg": "Databaseupdate failed" })
                        return;
                    }
                });
            }
            else {
                classdata.db.databasequerryhandler_secure(`UPDATE users SET mailaddress = ?,isadmin = ?,confirmedmail = ?, isactive=?, maxentries =?, maxdomains =? where id= ?`, [data.mailaddress, data.isadmin, data.confirmedmail, data.isactive, data.maxentries, data.maxdomains, data.id], function (err, results) {
                    if (err) {
                        that.log.addlog("Unknown ERROR:" + err, { color: "yellow", warn: "API-ACC-Warning", level: 2 })
                        resolve({ "success": false, "msg": "Unknown Error" })
                        return;
                    }

                    if (results.affectedRows == 1) {
                        resolve({ "success": true, "data": "Userupdate saved" })
                        return;
                    }
                    else {
                        resolve({ "success": false, "msg": "Databaseupdate failed" })
                        return;
                    }
                });
            }
        });
    }

}

export { apiclass_acc }


function auth_getpwhash(password, mailaddress) {
    var hash = crypto.createHash('sha256').update(password + mailaddress).digest('base64');
    //Replate "/" with "+" to prevent problems with Escaping
    hash = hash.replace(/\//g, '+');
    return hash;
}




