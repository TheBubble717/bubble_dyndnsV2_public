
"use strict";
import { addfunctions } from "./addfunctions.js"
import { classdata } from './main.js';

class apiclass_dns {
    constructor(config, log) {
        this.config = config;
        this.log = log
    }


    dnsentry_update(user, dnsentry) {
        var that = this;
        return new Promise(async (resolve) => {

            //Check if everything that's needed in dnsentry is set
            let requiredFields = { "entryname": "string", "entryvalue": ["string", "number"], "entrytype": "string", "domainid": "number", "id": "number" };
            dnsentry = addfunctions.objectconverter(dnsentry)
            let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, dnsentry)
            if (!check_for_correct_datatype.success) {
                resolve({ "success": false, "msg": check_for_correct_datatype.msg })
                return;
            }

            //Entryname is always lowercase
            dnsentry.entryname = dnsentry.entryname.toLowerCase()


            //Check if the dns_entry exists and user is it's owner
            try {
                let dnsentryfromdb = await classdata.db.databasequerryhandler_secure(`select * from dns_entries where ownerid = ? and id = ?`, [user.get_user_public().id, dnsentry.id]);
                if (!dnsentryfromdb.length) {
                    resolve({ "success": false, "msg": "Error updating DNS-Entry, Entry not found" })
                    return;
                }
            }
            catch (err) {
                that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                resolve({ "success": false, "msg": "Unknown Error" })
                return;
            }

            //Check if DNS-Entry is free
            try {
                let testvalue = await classdata.db.databasequerryhandler_secure(`select * from dns_entries where entryname = ? and domainid = ? and ownerid != ?`, [dnsentry.entryname, dnsentry.domainid, user.get_user_public().id]);
                if (testvalue.length) {
                    resolve({ "success": false, "msg": "DNS-Entry is already in use by a user" })
                    return;
                }
            }
            catch (err) {
                that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                resolve({ "success": false, "msg": "Unknown Error" })
                return;
            }


            //Check if DNS-Entry is in banned
            try {
                let domaindata = await classdata.db.databasequerryhandler_secure(`select * from domains where id = ?`, [dnsentry.domainid]);
                let banlist = []
                let banlist1 = await classdata.db.databasequerryhandler_secure(`select * from subdomains_banned_all`, []);
                let banlist2 = []

                if (domaindata[0].builtin) {
                    banlist2 = await classdata.db.databasequerryhandler_secure(`select * from subdomains_banned_builtin`, [])
                }
                banlist = [...banlist1, ...banlist2]
                let testvalue = banlist.filter(r => r.subdomainname == dnsentry.entryname)
                if (testvalue.length) {
                    resolve({ "success": false, "msg": "DNS-Entry-Name in banned list" })
                    return;
                }

            }
            catch (err) {
                that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                resolve({ "success": false, "msg": "Unknown Error" })
                return;
            }

            //Check if dnsentry.entryname is at least 4 characters long
            if (dnsentry.entryname.length < 4) {
                resolve({ "success": false, "msg": "DNS-Entry-Name too short (4 is min)" })
                return;
            }
            //Check if dnsentry.entryname is max 19 characters long
            if (dnsentry.entryname.length > 20) {
                resolve({ "success": false, "msg": "DNS-Entry-Name is too long (20 is max)" })
                return;
            }

            // Validate dnsentry.entryname to allow a-z, A-Z, 0-9, *, @, -, ., and _
            if (dnsentry.entryname.match(/^[a-zA-Z0-9*@\-._]+$/) === null) {
                resolve({ "success": false, "msg": "DNS-Entry-Name contains unallowed characters" });
                return;
            }

            //Check if dnsentry.entryvalue is max 49 characters long
            if (dnsentry.entryvalue.length > 50) {
                resolve({ "success": false, "msg": "DNS-Entry-Value is too long (50 is max)" })
                return;
            }

            if (!addfunctions.check_dns_entry_validation(dnsentry.entrytype, dnsentry.entryvalue)) {
                resolve({ "success": false, "msg": "DNS-Type wouldn't work with DNS-Value" });
                return;
            }

            //Check if entrytype is allowed to save
            try {
                let domain = await classdata.db.databasequerryhandler_secure(`select * from domains where id=?`, [dnsentry.domainid]);
                if (domain[0].builtin && !classdata.db.routinedata.bubbledns_settings.allowed_dnstype_entries_builtin.includes(dnsentry.entrytype)) {
                    resolve({ "success": false, "msg": "DNS-Type not allowed" });
                    return;
                }
                else if (!domain[0].builtin && !classdata.db.routinedata.bubbledns_settings.allowed_dnstype_entries_custom.includes(dnsentry.entrytype)) {
                    resolve({ "success": false, "msg": "DNS-Type not allowed" });
                    return;
                }
            }
            catch (err) {
                that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                resolve({ "success": false, "msg": "Unknown Error" })
                return;
            }


            let time = addfunctions.current_time()
            let currenttime = `${time.year}-${time.month}-${time.day} ${time.hour}:${time.min}:${time.sec}`
            classdata.db.databasequerryhandler_secure(`UPDATE dns_entries SET entryname = ?,entryvalue = ? ,entrytype = ? , lastchangedtime = ? where id = ? and ownerid = ?`, [dnsentry.entryname, dnsentry.entryvalue, dnsentry.entrytype, currenttime, dnsentry.id, user.get_user_public().id], function (err, results) {
                if (err) {
                    that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                    resolve({ "success": false, "msg": "Unknown Error" })
                    return;
                }
                if (results.affectedRows == 1) {
                    resolve({ "success": true, "data": "Done" });
                    return;
                }
                else {
                    resolve({ "success": false, "msg": "Databaseupdate failed" })
                    return;
                }
            });

        });
    }


    dnsentry_delete(user, dnsentry) {
        var that = this;
        return new Promise(async (resolve) => {

            //Check if everything that's needed in dnsentry is set
            let requiredFields = { "id": "number" };
            dnsentry = addfunctions.objectconverter(dnsentry)
            let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, dnsentry)
            if (!check_for_correct_datatype.success) {
                resolve({ "success": false, "msg": check_for_correct_datatype.msg })
                return;
            }


            classdata.db.databasequerryhandler_secure(`DELETE FROM dns_entries where ownerid = ? and id = ?`, [user.get_user_public().id, dnsentry.id], function (err, answer) {
                if (err) {
                    that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                    resolve({ "success": false, "msg": "Unknown Error" })
                    return;
                }
                if (answer.affectedRows === 1) {
                    resolve({ "success": true, "data": "Done" })
                    return;
                }
                else {
                    resolve({ "success": false, "msg": "Error deleting subdomain" })
                    return;
                }
            });
        });
    }


    dnsentry_list(user, dnsentry = null) {
        var that = this;
        return new Promise(async (resolve) => {

            if (dnsentry == null) {
                classdata.db.databasequerryhandler_secure(`SELECT * FROM dns_entries where ownerid = ?`, [user.get_user_public().id], function (err, answer) {
                    if (err) {
                        that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                        resolve({ "success": false, "msg": "Unknown Error" })
                        return;
                    }
                    resolve({ "success": true, "data": answer })
                    return;

                });
            }
            else {

                //Check if everything that's needed in dnsentry is set
                let requiredFields = { "id": "number" };
                dnsentry = addfunctions.objectconverter(dnsentry)
                let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, dnsentry)
                if (!check_for_correct_datatype.success) {
                    resolve({ "success": false, "msg": check_for_correct_datatype.msg })
                    return;
                }


                classdata.db.databasequerryhandler_secure(`SELECT * FROM dns_entries where ownerid = ? and id = ?`, [user.get_user_public().id, dnsentry.id], function (err, answer) {
                    if (err) {
                        that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                        resolve({ "success": false, "msg": "Unknown Error" })
                        return;
                    }
                    resolve({ "success": true, "data": answer })
                    return;

                });
            }


        });
    }


    dnsentry_create(user, dnsentry) {
        var that = this;
        return new Promise(async (resolve) => {

            //Check if everything that's needed in dnsentry is set
            let requiredFields = { "entryname": "string", "entryvalue": ["string", "number"], "entrytype": "string", "domainid": "number" };
            dnsentry = addfunctions.objectconverter(dnsentry)
            let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, dnsentry)
            if (!check_for_correct_datatype.success) {
                resolve({ "success": false, "msg": check_for_correct_datatype.msg })
                return;
            }

            //Entryname is always lowercase
            dnsentry.entryname = dnsentry.entryname.toLowerCase()


            //Check if user is allowed to use the domainname or is the owner
            try {
                let testvalue1 = await classdata.db.databasequerryhandler_secure(`select * from domains where id = ? AND (ownerid = ? OR builtin = ?) AND isregistered = ?;`, [dnsentry.domainid, user.get_user_public().id, true, true]);
                let testvalue2 = await classdata.db.databasequerryhandler_secure(`select * from domains_share where domainid = ? AND userid = ?`, [dnsentry.domainid, user.get_user_public().id]);
                let isallowedtouse = testvalue1.concat(testvalue2)
                if (!isallowedtouse.length) {
                    resolve({ "success": false, "msg": "Domain doesn't exist or user is not the owner / not shared with you" })
                    return;
                }
            }
            catch (err) {
                that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                resolve({ "success": false, "msg": "Unknown Error" })
                return;
            }


            //Check if DNS-Entry is free
            try {
                let testvalue = await classdata.db.databasequerryhandler_secure(`select * from dns_entries where entryname = ? and domainid = ? and ownerid != ?`, [dnsentry.entryname, dnsentry.domainid, user.get_user_public().id]);
                if (testvalue.length) {
                    resolve({ "success": false, "msg": "DNS-Entry is already in use by a user" })
                    return;
                }
            }
            catch (err) {
                that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                resolve({ "success": false, "msg": "Unknown Error" })
                return;
            }


            //Check if DNS-Entry-limit isn't reached already
            try {
                let testvalue = await classdata.db.databasequerryhandler_secure(`select * from dns_entries where ownerid = ?`, [user.get_user_public().id]);
                if (testvalue.length >= user.get_user_public().maxentries) {
                    resolve({ "success": false, "msg": "DNS-Entry-Limit reached" })
                    return;
                }
            }
            catch (err) {
                that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                resolve({ "success": false, "msg": "Unknown Error" })
                return;
            }

            //Check if DNS-Entry is in banned
            try {
                let domaindata = await classdata.db.databasequerryhandler_secure(`select * from domains where id = ?`, [dnsentry.domainid]);
                let banlist = []
                let banlist1 = await classdata.db.databasequerryhandler_secure(`select * from subdomains_banned_all`, []);
                let banlist2 = []

                if (domaindata[0].builtin) {
                    banlist2 = await classdata.db.databasequerryhandler_secure(`select * from subdomains_banned_builtin`, [])
                }
                banlist = [...banlist1, ...banlist2]
                let testvalue = banlist.filter(r => r.subdomainname == dnsentry.entryname)
                if (testvalue.length) {
                    resolve({ "success": false, "msg": "DNS-Entry-Name in banned list" })
                    return;
                }

            }
            catch (err) {
                that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                resolve({ "success": false, "msg": "Unknown Error" })
                return;
            }


            //Check if dnsentry.entryname is at least 4 characters long
            if (dnsentry.entryname.length < 4) {
                resolve({ "success": false, "msg": "DNS-Entry-Name too short (4 is min)" })
                return;
            }
            //Check if dnsentry.entryname is max 19 characters long
            if (dnsentry.entryname.length > 20) {
                resolve({ "success": false, "msg": "DNS-Entry-Name is too long (20 is max)" })
                return;
            }

            // Validate dnsentry.entryname to allow a-z, A-Z, 0-9, *, @, -, ., and _
            if (dnsentry.entryname.match(/^[a-zA-Z0-9*@\-._]+$/) === null) {
                resolve({ "success": false, "msg": "DNS-Entry-Name contains unallowed characters" });
                return;
            }

            //Check if dnsentry.entryvalue is max 49 characters long
            if (dnsentry.entryvalue.length > 50) {
                resolve({ "success": false, "msg": "DNS-Entry-Value is too long (50 is max)" })
                return;
            }

            if (!addfunctions.check_dns_entry_validation(dnsentry.entrytype, dnsentry.entryvalue)) {
                resolve({ "success": false, "msg": "DNS-Type wouldn't work with DNS-Value" });
                return;
            }


            //Check if entrytype is allowed to save
            try {
                let domain = await classdata.db.databasequerryhandler_secure(`select * from domains where id=?`, [dnsentry.domainid]);
                if (domain[0].builtin && !classdata.db.routinedata.bubbledns_settings.allowed_dnstype_entries_builtin.includes(dnsentry.entrytype)) {
                    resolve({ "success": false, "msg": "DNS-Type not allowed" });
                    return;
                }
                else if (!domain[0].builtin && !classdata.db.routinedata.bubbledns_settings.allowed_dnstype_entries_custom.includes(dnsentry.entrytype)) {
                    resolve({ "success": false, "msg": "DNS-Type not allowed" });
                    return;
                }
            }
            catch (err) {
                that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                resolve({ "success": false, "msg": "Unknown Error" })
                return;
            }


            //Find free id for the subdomain
            try {
                do {
                    var randomid = addfunctions.randomidf()
                    var answer = await classdata.db.databasequerryhandler_secure(`select * from dns_entries where id = ?`, [randomid]);
                }
                while (answer && answer.length)

            }
            catch (err) {
                that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                resolve({ "success": false, "msg": "Unknown Error" })
                return;
            }

            //Add
            //Get current time
            let time = addfunctions.current_time()
            let currenttime = `${time.year}-${time.month}-${time.day} ${time.hour}:${time.min}:${time.sec}`

            classdata.db.databasequerryhandler_secure(`INSERT INTO dns_entries VALUES (?,?,?,?,?,?,?)`, [randomid, user.get_user_public().id, dnsentry.domainid, currenttime, dnsentry.entryname, dnsentry.entryvalue, dnsentry.entrytype], function (err, res) {
                if (err) {
                    that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                    resolve({ "success": false, "msg": "Unknown Error" })
                    return;
                }
                resolve({ "success": true, "data": "Done" })
                return;

            });
        });
    }


    domain_list_owner(user, domain = null) //Domainnames the user is the owner of //If domainid is set, only query this specific domainid
    {

        var shared_list_function = function (domainid) {
            return new Promise(async (resolve, reject) => {
                classdata.db.databasequerryhandler_secure(`select users.mailaddress,users.id from domains_share INNER JOIN users on domains_share.userid = users.id where domains_share.domainid = "?" `, [domainid], function (err, res) {
                    if (err) {
                        reject(err)
                        return;
                    }
                    resolve(res)
                    return;

                });
            });
        }

        var dnsentry_list_function = function (user, domainid) {
            return new Promise(async (resolve, reject) => {
                classdata.db.databasequerryhandler_secure(`select dns_entries.* from dns_entries INNER JOIN domains ON domains.id = dns_entries.domainid where dns_entries.ownerid = ? AND domains.id=? `, [user.get_user_public().id, domainid], function (err, res) {
                    if (err) {
                        reject(err)
                        return;
                    }
                    resolve(res)
                    return;
                });
            });
        }

        var that = this;
        return new Promise(async (resolve) => {

            if (domain == null) {
                classdata.db.databasequerryhandler_secure(`select * from domains where ownerid=? AND isregistered=?`, [user.get_user_public().id, true]).then(async (response1) => {

                    for (let i = 0; i < response1.length; i++) {
                        response1[i].shared_list = await shared_list_function(response1[i].id)
                        response1[i].dns_list = await dnsentry_list_function(user, response1[i].id)
                    }

                    resolve({ "success": true, "data": response1 })
                    return;
                })
                    .catch(function (err) {
                        that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                        resolve({ "success": false, "msg": "Unknown Error" })
                        return;
                    })
            }
            else {

                //Check if everything that's needed in dnsentry is set
                let requiredFields = { "id": "number" };
                domain = addfunctions.objectconverter(domain)
                let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, domain)
                if (!check_for_correct_datatype.success) {
                    resolve({ "success": false, "msg": check_for_correct_datatype.msg })
                    return;
                }


                classdata.db.databasequerryhandler_secure(`select * from domains where ownerid=? AND id=? AND isregistered=?`, [user.get_user_public().id, domain.id, true]).then(async (response1) => {

                    for (let i = 0; i < response1.length; i++) {
                        response1[i].shared_list = await shared_list_function(response1[i].id)
                        response1[i].dns_list = await dnsentry_list_function(user, response1[i].id)
                    }

                    resolve({ "success": true, "data": response1 })
                    return;
                })
                    .catch(function (err) {
                        that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                        resolve({ "success": false, "msg": "Unknown Error" })
                        return;
                    })
            }





        });
    }


    domain_list_shared(user, domain = null) //Domainnames the user got share of (excluding the main domain (bubbledns.com))
    {
        var dnsentry_list_function = function (user, domainid) {
            return new Promise(async (resolve, reject) => {
                classdata.db.databasequerryhandler_secure(`select dns_entries.* from dns_entries INNER JOIN domains ON domains.id = dns_entries.domainid where dns_entries.ownerid = ? AND domains.id=?`, [user.get_user_public().id, domainid], function (err, res) {
                    if (err) {
                        reject(err)
                        return;
                    }
                    resolve(res)
                    return;
                });
            });
        }

        var that = this;
        return new Promise(async (resolve) => {

            if (domain == null) {
                //shared by someone
                var promise1 = classdata.db.databasequerryhandler_secure(`select domains.* from domains INNER JOIN domains_share on domains_share.domainid = domains.id where domains_share.userid=? AND domains.isregistered=?`, [user.get_user_public().id, true])
                var promise2 = classdata.db.databasequerryhandler_secure(`select domains.* from domains where builtin=?`, [true])
                Promise.all([promise1, promise2]).then(async (response) => {
                    var response1 = [...response[0], ...response[1]]
                    for (let i = 0; i < response1.length; i++) {
                        response1[i].shared_list = []
                        response1[i].dns_list = await dnsentry_list_function(user, response1[i].id)
                    }

                    resolve({ "success": true, "data": response1 })
                    return;
                })
                    .catch(function (err) {
                        that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                        resolve({ "success": false, "msg": "Unknown Error" })
                        return;
                    })
            }
            else {

                //Check if everything that's needed in dnsentry is set
                let requiredFields = { "id": "number" };
                domain = addfunctions.objectconverter(domain)
                let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, domain)
                if (!check_for_correct_datatype.success) {
                    resolve({ "success": false, "msg": check_for_correct_datatype.msg })
                    return;
                }

                classdata.db.databasequerryhandler_secure(`select domains.* from domains INNER JOIN domains_share on domains_share.domainid = domains.id where domains_share.userid=? AND domains.isregistered=?`, [user.get_user_public().id, domain.id, true]).then(async (response1) => {

                    for (let i = 0; i < response1.length; i++) {
                        response1[i].shared_list = []
                        response1[i].dns_list = await dnsentry_list_function(user, response1[i].id)
                    }

                    resolve({ "success": true, "data": response1 })
                    return;
                })
                    .catch(function (err) {
                        that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                        resolve({ "success": false, "msg": "Unknown Error" })
                        return;
                    })
            }





        });
    }


    domain_create(user, domain) {
        var that = this;
        return new Promise(async (resolve) => {

            let requiredFields = { "domainname": "string" };
            domain = addfunctions.objectconverter(domain)
            let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, domain)
            if (!check_for_correct_datatype.success) {
                resolve({ "success": false, "msg": check_for_correct_datatype.msg })
                return;
            }

            //Domainname is always lowercase
            domain.domainname = domain.domainname.toLowerCase()

            //Check if domainname is a valid Domain
            if (!addfunctions.isTLDomain(domain.domainname)) {
                resolve({ "success": false, "msg": "Domainname is not a valid name" })
                return;
            }

            var reregistering = false //if the domain already exists in the database and gets reactivated!

            //Check if domain is free
            try {
                let testvalue = await classdata.db.databasequerryhandler_secure(`select * from domains where domainname = ?`, [domain.domainname]);
                if (testvalue.length) {
                    if (!testvalue[0].isregistered && (testvalue[0].ownerid == user.get_user_public().id)) {
                        reregistering = true;
                    }
                    else {
                        resolve({ "success": false, "msg": "Domain is already registered" })
                        return;
                    }

                }
            }
            catch (err) {
                that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                resolve({ "success": false, "msg": "Unknown Error" })
                return;
            }

            if (!reregistering) {

                //Check if domain-limit isn't reached already
                try {
                    let testvalue = await classdata.db.databasequerryhandler_secure(`select * from domains where ownerid = ?`, [user.get_user_public().id]);
                    if (testvalue.length >= user.get_user_public().maxdomains) {
                        resolve({ "success": false, "msg": "Domain-Limit reached" })
                        return;
                    }
                }
                catch (err) {
                    that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                    resolve({ "success": false, "msg": "Unknown Error" })
                    return;
                }

                //Find free id for the domain
                try {
                    do {
                        var randomid = addfunctions.randomidf()
                        var answer = await classdata.db.databasequerryhandler_secure(`select * from domains where id = ?`, [randomid]);
                    }
                    while (answer && answer.length)

                }
                catch (err) {
                    that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                    resolve({ "success": false, "msg": "Unknown Error" })
                    return;
                }

                //Add
                let domaindata = { "id": randomid, "ownerid": user.get_user_public().id, "name": domain.domainname, "verified": 0, verificationdate: null }
                classdata.db.databasequerryhandler_secure(`INSERT INTO domains VALUES (?,?,?,?,?,?,?,?,?)`, [domaindata.id, false, domaindata.ownerid, domaindata.name, domaindata.verified, domaindata.verificationdate, null, null, true], function (err, res) {
                    if (err) {
                        that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                        resolve({ "success": false, "msg": "Unknown Error" })
                        return;
                    }
                    resolve({ "success": true, "data": domaindata })
                    return;

                });
            }
            else {

                //Get Data from Database
                try {
                    var olddomaindata = await classdata.db.databasequerryhandler_secure(`select * from domains where domainname = ?`, [domain.domainname]);
                }
                catch (err) {
                    that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                    resolve({ "success": false, "msg": "Unknown Error" })
                    return;
                }



                //Add
                let domaindata = { "id": olddomaindata[0].id, "ownerid": olddomaindata[0].ownerid, "name": olddomaindata[0].domainname, "verified": olddomaindata[0].verified, verificationdate: olddomaindata[0].verified }
                classdata.db.databasequerryhandler_secure(`update domains set isregistered =? where id= ?`, [true, olddomaindata[0].id], function (err, res) {
                    if (err) {
                        that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                        resolve({ "success": false, "msg": "Unknown Error" })
                        return;
                    }
                    resolve({ "success": true, "data": domaindata })
                    return;

                });
            }




        });
    }


    domain_delete(user, domaintodelete) {
        var that = this;
        return new Promise(async (resolve) => {

            let requiredFields = { "id": "number" };
            domaintodelete = addfunctions.objectconverter(domaintodelete)
            let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, domaintodelete)
            if (!check_for_correct_datatype.success) {
                resolve({ "success": false, "msg": check_for_correct_datatype.msg })
                return;
            }

            classdata.db.databasequerryhandler_secure(`select * from domains where ownerid = ? and id = ?`, [user.get_user_public().id, domaintodelete.id], function (err, domaincheck) {
                if (err) {
                    that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                    resolve({ "success": false, "msg": "Unknown Error" })
                    return;
                }
                if (domaincheck.length) {

                    const promise1 = classdata.db.databasequerryhandler_secure(`update domains set isregistered =? where id= ? AND ownerid = ?`, [false, domaintodelete.id, user.get_user_public().id,]);
                    const promise2 = classdata.db.databasequerryhandler_secure(`DELETE FROM domains_share where domainid = ?`, [domaintodelete.id]);
                    const promise3 = classdata.db.databasequerryhandler_secure(`DELETE FROM dns_entries where domainid = ?`, [domaintodelete.id]);
                    Promise.all([promise1, promise2, promise3]).then((response) => {
                        resolve({ "success": true, "data": "Done" })
                        return;
                    })
                        .catch(function (err) {
                            resolve({ "success": false, "msg": "Error deleting domain" })
                            return;
                        });
                }
            });
        });
    }


    domain_verify(user, domaintoverify)  //Verify
    {
        var that = this;
        return new Promise(async (resolve) => {

            let requiredFields = { "id": "number" };
            domaintoverify = addfunctions.objectconverter(domaintoverify)
            let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, domaintoverify)
            if (!check_for_correct_datatype.success) {
                resolve({ "success": false, "msg": check_for_correct_datatype.msg })
                return;
            }


            //Check if specific domain exists, user is the owner and the domain is currently registered -> Get the data of it.
            classdata.db.databasequerryhandler_secure(`select * from domains where id = ? and ownerid = ? AND isregistered =?`, [domaintoverify.id, user.get_user_public().id, true], function (err, sharelist) {
                if (err) {
                    that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                    resolve({ "success": false, "msg": "Unknown Error" })
                    return;
                }
                if (sharelist.length) {

                    //If you want to verify the maindomain, drop the test to prevent that the domain fails
                    if (classdata.db.routinedata.bubbledns_settings.maindomain == sharelist[0].domainname) {
                        resolve({ "success": false, "msg": "Can't verify the maindomain!" })
                        return;
                    }

                    const promise1 = classdata.dnsserver.askrealdns(`${sharelist[0].domainname}`, "NS");
                    const promise2 = that.dns_get_bubblednsservers()
                    Promise.all([promise1, promise2]).then(async (dnsresponse) => {

                        for (let i = 0; i < dnsresponse[0].data.length; i++) {
                            if (!addfunctions.isIPv4(dnsresponse[0].data[i])) {
                                try {
                                    let answer = await classdata.dnsserver.askrealdns(`${dnsresponse[0].data[i]}`, "A")
                                    dnsresponse[0].data[i] = answer.data[0]
                                }
                                catch (err) {
                                    that.log.addlog("Error Verifying Domain:" + err.err.code, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                                    resolve({ "success": false, "msg": "Error Verifying Domain" })
                                    return;
                                }
                            }
                        }

                        if (!dnsresponse[1].success) {
                            resolve({ "success": false, "msg": "Unable to resolve the dnsserver-Settings" })
                            return;
                        }

                        // Extract the data we need to check
                        const dnsResponseData = dnsresponse[0].data;
                        const ipv4Addresses = dnsresponse[1].data.ip.ipv4.filter(ip => ip !== null); // Filter out null values
                        const ipv6Addresses = dnsresponse[1].data.ip.ipv6.filter(ip => ip !== null); // Filter out null values

                        // Combine both IPv4 and IPv6 addresses
                        const allIpAddresses = [...ipv4Addresses, ...ipv6Addresses];

                        // Function to check if an element is in an array
                        const isInArray = (item, array) => array.includes(item);

                        // Check each IP address in dnsResponseData and report if it is not in allIpAddresses
                        const incorrectIps = dnsResponseData.filter(ip => !isInArray(ip, allIpAddresses));


                        // Print results
                        if (incorrectIps.length === 0) {
                            var verified = 1;
                        } else {
                            var verified = 0;
                        }

                        var verificationresult = dnsResponseData.map(function (r) {
                            if (allIpAddresses.includes(r)) {
                                return { "ip": r, "status": "(✓)" }
                            }
                            else {
                                return { "ip": r, "status": "(X)" }
                            }
                        })

                        let time = addfunctions.current_time()
                        var currenttime = `${time.year}-${time.month}-${time.day} ${time.hour}:${time.min}:${time.sec}`

                        classdata.db.databasequerryhandler_secure(`UPDATE domains set verified = ?, verificationdate= ?, lastverificationresult1= ?, lastverificationresult2= ? where id = ? and ownerid = ?`, [verified, currenttime, `${verificationresult[0].ip} - ${verificationresult[0].status}`, `${verificationresult[1].ip} - ${verificationresult[1].status}`, domaintoverify.id, user.get_user_public().id], function (err, res) {
                            if (res.affectedRows > 0) {
                                resolve({ "success": true, "data": { "ns1": `${verificationresult[0].ip} - ${verificationresult[0].status}`, "ns2": `${verificationresult[1].ip} - ${verificationresult[0].status}`, "verificationsuccess": verified, "verificationdate": currenttime } })
                                return;
                            }
                            else {
                                resolve({ "success": false, "msg": "Unable to update the verification updates" })
                                return;
                            }
                        });

                    })
                        .catch(function (err) {
                            resolve({ "success": false, "msg": "Error Verifying Domain" })
                            return;
                        })
                }
            });
        });
    }


    domain_share_adduser(user, domainid, mailaddress) { //Add the mailaddress to the allowed list of the domain
        var that = this;
        return new Promise(async (resolve) => {

            let requiredFields = { "domainid": "number", "mailaddress": "string" };
            let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, { "domainid": domainid, "mailaddress": mailaddress })
            if (!check_for_correct_datatype.success) {
                resolve({ "success": false, "msg": check_for_correct_datatype.msg })
                return;
            }

            //Check if user is the owner of the domain
            try {
                let testvalue = await classdata.db.databasequerryhandler_secure(`select * from domains where ownerid = ? AND id = ? AND isregistered=?`, [user.get_user_public().id, domainid, true]);
                if (!testvalue.length) {
                    resolve({ "success": false, "msg": "Domain was not found!" })
                    return;
                }
            }
            catch (err) {
                that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                resolve({ "success": false, "msg": "Unknown Error" })
                return;
            }

            //Fetch the userdata from the userid
            classdata.db.databasequerryhandler_secure(`select * from users where mailaddress=?`, [mailaddress], async function (err, toadduser) {
                if (!toadduser.length) {
                    resolve({ "success": false, "msg": "User not found!" })
                    return;
                }

                //Check if user is already in the shared list
                try {
                    let testvalue = await classdata.db.databasequerryhandler_secure(`select * from domains_share where domainid = ? and userid = ?`, [domainid, toadduser[0].id]);
                    if (testvalue.length) {
                        resolve({ "success": false, "msg": "User already in Share List" })
                        return;
                    }
                }
                catch (err) {
                    that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                    resolve({ "success": false, "msg": "Unknown Error" })
                    return;
                }

                //Check if toadduser is the owner of the domain
                if (user.get_user_public().id === toadduser[0].id) {
                    resolve({ "success": false, "msg": "You can't add yourself" })
                    return;
                }


                classdata.db.databasequerryhandler_secure(`INSERT INTO domains_share VALUES (?,?)`, [domainid, toadduser[0].id], async function (err, res) {
                    if (err) {
                        that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                        resolve({ "success": false, "msg": "Unknown Error" })
                        return;
                    }

                    resolve({ "success": true, "data": "Done" })
                    return;

                });
            });
        });

    }


    domain_share_deleteuser(user, domainid, useridtodelete) {
        var that = this;
        return new Promise(async (resolve) => {

            let requiredFields = { "domainid": "number", "useridtodelete": "number" };
            let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, { "domainid": domainid, "useridtodelete": useridtodelete })
            if (!check_for_correct_datatype.success) {
                resolve({ "success": false, "msg": check_for_correct_datatype.msg })
                return;
            }

            classdata.db.databasequerryhandler_secure(`select domains_share.* from domains_share INNER JOIN domains ON domains_share.domainid = domains.id where domains_share.domainid = ? AND domains_share.userid = ? AND domains.ownerid = ? AND domains.isregistered = ?`, [domainid, useridtodelete, user.get_user_public().id, true], function (err, sharelist) {
                if (err) {
                    that.log.addlog("Unknown ERROR: " + err, { color: "yellow", warn: "API-DNS-Warning", level: 2 })
                    resolve({ "success": false, "msg": "Unknown Error" })
                    return;
                }
                if (sharelist.length) {
                    const promise1 = classdata.db.databasequerryhandler_secure(`DELETE FROM domains_share where domainid = ? and userid = ?`, [domainid, useridtodelete]);
                    const promise2 = classdata.db.databasequerryhandler_secure(`DELETE FROM dns_entries where domainid = ? and ownerid = ?`, [domainid, useridtodelete]);
                    Promise.all([promise1, promise2]).then((response) => {
                        resolve({ "success": true, "data": "Done" })
                        return;
                    })
                        .catch(function (err) {
                            resolve({ "success": false, "msg": "Error deleting User from Share" })
                            return;
                        })
                }
                else {
                    resolve({ "success": false, "msg": "Error deleting User from Share" })
                    return;
                }
            });
        });
    }


    dns_get_bubblednsservers() {
        var that = this;
        return new Promise(async (resolve) => {
            var dnsservers = {
                "domain": [],
                "ip": {
                    "ipv4": [],
                    "ipv6": []
                }
            }
            for (let i = 0; i < classdata.db.routinedata.bubbledns_servers.length; i++) {
                if (classdata.db.routinedata.bubbledns_servers[i].enabled_dns && classdata.db.routinedata.bubbledns_servers[i].synctest) {
                    dnsservers.domain.push(`${classdata.db.routinedata.bubbledns_servers[i].subdomainname}.${classdata.db.routinedata.bubbledns_settings.maindomain}`)
                    dnsservers.ip.ipv4.push(classdata.db.routinedata.bubbledns_servers[i].public_ipv4)
                    dnsservers.ip.ipv6.push(classdata.db.routinedata.bubbledns_servers[i].public_ipv6)
                }
            }
            resolve({ "success": true, "data": dnsservers })
            return;
        });
    }


    dns_get_allowed_dnstype_entries() {
        return new Promise(async (resolve) => {
            resolve({ "success": true, "data": { "bulitin": classdata.db.routinedata.bubbledns_settings.allowed_dnstype_entries_builtin, "custom": classdata.db.routinedata.bubbledns_settings.allowed_dnstype_entries_custom } })
        });

    }

}

export { apiclass_dns }