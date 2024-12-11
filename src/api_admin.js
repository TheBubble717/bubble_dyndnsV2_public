
"use strict";
import { addfunctions } from "./addfunctions.js"
import { classdata } from './main.js';

class apiclass_admin {
    constructor(config, log) {
        this.config = config;
        this.log = log
    }

    //Rewritten+
    async dns_upstream_servers_list() {
        try {
            var result = await classdata.db.databasequerryhandler_secure(`select * from dns_upstreamservers`, [])
            return { success: true, data: result };
        }
        catch (err) {
            throw new Error(err);
        }

    }

    //Rewritten+
    async dns_upstream_servers_enabledisable(dnsupstreamserver) {
        var that = this;

        let requiredFields = { "id": "number" };
        dnsupstreamserver = addfunctions.objectconverter(dnsupstreamserver)
        let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, dnsupstreamserver)
        if (!check_for_correct_datatype.success) {
            return ({ "success": false, "msg": check_for_correct_datatype.msg })
        }

        try {
            const databaseupdate = await classdata.db.databasequerryhandler_secure(`UPDATE dns_upstreamservers SET enabled = NOT enabled where id=?`, [dnsupstreamserver.id]);
            if (databaseupdate.affectedRows === 1) {
                return ({ "success": true, "data": "Done" })
            }
            else {
                return ({ "success": false, "msg": "Databaseupdate failed" })
            }
        }
        catch (err) {
            throw new Error(err);
        }


    }

    //Rewritten+
    async dns_upstream_servers_delete(dnsupstreamserver) {
        var that = this;

        let requiredFields = { "id": "number" };
        dnsupstreamserver = addfunctions.objectconverter(dnsupstreamserver)
        let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, dnsupstreamserver)
        if (!check_for_correct_datatype.success) {
            return ({ "success": false, "msg": check_for_correct_datatype.msg })
        }

        try {
            const databaseupdate = await classdata.db.databasequerryhandler_secure(`DELETE FROM dns_upstreamservers where id=?`, [dnsupstreamserver.id]);
            if (databaseupdate.affectedRows === 1) {
                return ({ "success": true, "data": "Done" })
            }
            else {
                return ({ "success": false, "msg": "Databaseupdate failed" })
            }
        }
        catch (err) {
            throw new Error(err);
        }

    }

    //Rewritten+
    async dns_upstream_servers_create(dnsupstreamserver) {
        var that = this;

        let requiredFields = { "address": "string" };
        dnsupstreamserver = addfunctions.objectconverter(dnsupstreamserver)
        let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, dnsupstreamserver)
        if (!check_for_correct_datatype.success) {
            return ({ "success": false, "msg": check_for_correct_datatype.msg })
        }

        if (!addfunctions.isIPv4(dnsupstreamserver.address)) {
            return ({ "success": false, "msg": "Address not a valid IPV4-Adress" })
        }

        //Find free id for the server
        try {
            do {
                var randomid = addfunctions.randomidf()
                var answer = await classdata.db.databasequerryhandler_secure(`select * from dns_upstreamservers where id=?`, [randomid]);
            }
            while (answer && answer.length)

        }
        catch (err) {
            throw new Error(err);
        }

        //Check if Upstreamserver with that IP allready exists
        try {
            let results = await classdata.db.databasequerryhandler_secure(`select * from dns_upstreamservers where address = ?`, [dnsupstreamserver.address]);
            if (results.length !== 0) {
                return ({ "success": false, "msg": "IP-Address already exists" })
            }
        }
        catch (err) {
            throw new Error(err);
        }

        try {
            const databaseupdate = await classdata.db.databasequerryhandler_secure(`INSERT into dns_upstreamservers values (?,true,?,NULL,0)`, [randomid, dnsupstreamserver.address]);
            if (databaseupdate.affectedRows === 1) {
                return ({ "success": true, "data": "Done" })
            }
            else {
                return ({ "success": false, "msg": "Databaseupdate failed" })
            }
        }
        catch (err) {
            throw new Error(err);
        }

    }

    //Rewritten+
    async bubbledns_servers_list() {
        try {
            var result = await classdata.db.databasequerryhandler_secure(`select * from bubbledns_servers`, [])
            return { success: true, data: result };
        }
        catch (err) {
            throw new Error(err);
        }
    }

    //Rewritten+
    async bubbledns_servers_synctest(bubblednsservertotest) {
        var that = this;
        let requiredFields = { "id": "number" };
        bubblednsservertotest = addfunctions.objectconverter(bubblednsservertotest)
        let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, bubblednsservertotest)
        if (!check_for_correct_datatype.success) {
            return ({ "success": false, "msg": check_for_correct_datatype.msg })
        }

        //Search BubbleDNS_SERVER
        var bubblednsserver = classdata.db.routinedata.bubbledns_servers.filter(r => r.id == bubblednsservertotest.id)[0]
        if (typeof bubblednsserver == "undefined") {
            return ({ "success": false, "msg": `BubbleDNS_Server with ID ${bubblednsservertotest.id} not found` })
        }

        //No good idea to check itself
        if (bubblednsserver.public_ipv4 === classdata.db.config.public_ip || bubblednsserver.public_ipv6 === classdata.db.config.public_ip) {

            //Should be looked in the future with multiple Masternodes
            try {
                let forcesynctesttruequery = await classdata.db.databasequerryhandler_secure(`UPDATE bubbledns_servers set synctest=1 where id=?`, [bubblednsservertotest.id])
                return ({ "success": false, "msg": "Server can't check itself, forcing Synctest=1!" })
            }
            catch (err) {
                throw new Error(err);
            }
        }

        var testdata = addfunctions.randomapif()
        var synctestresult = false;
        requesteddnsentry = {}
        try {
            await classdata.db.databasequerryhandler_secure("insert into bubbledns_servers_testvalues values (?);", [testdata])
            await addfunctions.waittime(3);
            var requesteddnsentry = await classdata.dnsserver.askrealdns_customserver("synctest", "TXT", function () { if (bubblednsserver.public_ipv4 != null) { return bubblednsserver.public_ipv4 } else { return bubblednsserver.public_ipv6 } }())
                .then(function (data) {
                    data.data = data.data.map(function (r) { return r[0] })
                    return ({ "success": true, "data": data }) //INTERNAL RETURN, not from whole function
                })
                .catch(function (err) {
                    return ({ "success": false, "msg": `Synctest failed! Got Code ${err.err.code} from DNS-Query` }) //INTERNAL RETURN, not from whole function
                })

        }
        catch (err) {
            throw new Error(err)
        }

        if (requesteddnsentry.success == true) {
            synctestresult = requesteddnsentry.data.includes(testdata);
        }


        try {
            var promise1 = classdata.db.databasequerryhandler_secure(`UPDATE bubbledns_servers set synctest =? where id = ? `, [synctestresult, bubblednsservertotest.id]);
            var promise2 = classdata.db.databasequerryhandler_secure(`DELETE from bubbledns_servers_testvalues where testvalue = ?`, [testdata]);
            const databaseupdate = await Promise.all([promise1, promise2])
            if (synctestresult) {
                return ({ "success": true, "data": "Done" })
            }
            else {
                return ({ "success": false, "msg": "Synctest failed! Testvalue not returned!" })
            }
        }
        catch (err) {
            throw new Error(err);
        }
    }

    //Rewritten+
    async bubbledns_servers_create(bubblednsserver) {
        var that = this;

        let requiredFields = { "subdomainname": "string", "enabled_dns": ["boolean", "number"], "enabled_web": ["boolean", "number"], "public_ipv4": ["string", "null"], "public_ipv6": ["string", "null"], "internal_ipv4": ["string", "null"], "internal_ipv6": ["string", "null"], "masternode": ["boolean", "number"] };
        bubblednsserver = addfunctions.objectconverter(bubblednsserver)
        let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, bubblednsserver)
        if (!check_for_correct_datatype.success) {
            return ({ "success": false, "msg": check_for_correct_datatype.msg })
        }

        //Public: IPV4 & IPV6 check
        if (!addfunctions.isIPv4(bubblednsserver.public_ipv4) && !((bubblednsserver.public_ipv4 === null) || (bubblednsserver.public_ipv4 === "null"))) {
            return ({ "success": false, "msg": "Public_IPV4 Address is neither a IPV4-Address nor 'null'" })
        }
        else if (!addfunctions.isIPv6(bubblednsserver.public_ipv6) && !((bubblednsserver.public_ipv6 === null) || (bubblednsserver.public_ipv6 === "null"))) {
            return ({ "success": false, "msg": "Public_IPV6 Address is neither a IPV6-Address nor 'null'" })
        }
        else if (((bubblednsserver.public_ipv4 === null) || (bubblednsserver.public_ipv4 === "null")) && ((bubblednsserver.public_ipv6 === null) || (bubblednsserver.public_ipv6 === "null"))) {
            return ({ "success": false, "msg": "Public_IPV4 Address or Public_IPV6 Address needs to be used" })
        }
        bubblednsserver.public_ipv4 = addfunctions.isIPv4(bubblednsserver.public_ipv4) === true ? bubblednsserver.public_ipv4 : null;
        bubblednsserver.public_ipv6 = addfunctions.isIPv6(bubblednsserver.public_ipv6) === true ? bubblednsserver.public_ipv6 : null;

        //Internal: IPV4 & IPV6 check
        if (!addfunctions.isIPv4(bubblednsserver.internal_ipv4) && !((bubblednsserver.internal_ipv4 === null) || (bubblednsserver.internal_ipv4 === "null"))) {
            return ({ "success": false, "msg": "Internal_IPV4 Address is neither a IPV4-Address nor 'null'" })
        }
        else if (!addfunctions.isIPv6(bubblednsserver.internal_ipv6) && !((bubblednsserver.internal_ipv6 === null) || (bubblednsserver.internal_ipv6 === "null"))) {
            return ({ "success": false, "msg": "Internal_IPV6 Address is neither a IPV6-Address nor 'null'" })
        }
        bubblednsserver.internal_ipv4 = addfunctions.isIPv4(bubblednsserver.internal_ipv4) === true ? bubblednsserver.internal_ipv4 : null;
        bubblednsserver.internal_ipv6 = addfunctions.isIPv6(bubblednsserver.internal_ipv6) === true ? bubblednsserver.internal_ipv6 : null;


        //Subdomainname always lowercase
        bubblednsserver.subdomainname = bubblednsserver.subdomainname.toLowerCase()

        //Find free id for the server
        try {
            do {
                var randomid = addfunctions.randomidf()
                var answer = await classdata.db.databasequerryhandler_secure(`select * from bubbledns_servers where id=?`, [randomid]);
            }
            while (answer && answer.length)

        }
        catch (err) {
            throw new Error(err);
        }

        //Check if subdomainname is still free
        try {
            let preventdouble = await classdata.db.databasequerryhandler_secure(`select * from bubbledns_servers where subdomainname = ?`, [bubblednsserver.subdomainname])
            if (preventdouble.length) {
                return ({ "success": false, "msg": "Subdomainname already in use" })
            }
        }
        catch (err) {
            throw new Error(err);
        }

        try {
            const databaseupdate = await classdata.db.databasequerryhandler_secure(`INSERT into bubbledns_servers values (?,?,?,?,?,?,?,?,0,?)`, [randomid, bubblednsserver.subdomainname, bubblednsserver.enabled_dns, bubblednsserver.enabled_web, bubblednsserver.public_ipv4, bubblednsserver.public_ipv6, bubblednsserver.internal_ipv4, bubblednsserver.internal_ipv6, bubblednsserver.masternode]);
            if (databaseupdate.affectedRows === 1) {
                return ({ "success": true, "data": "Done" })
            }
            else {
                return ({ "success": false, "msg": "Databaseupdate failed" })
            }
        }
        catch (err) {
            throw new Error(err);
        }
    }

    //Rewritten+
    async bubbledns_servers_update(bubblednsserver) {
        var that = this;

        let requiredFields = { "subdomainname": "string", "enabled_dns": ["boolean", "number"], "enabled_web": ["boolean", "number"], "public_ipv4": ["string", "null"], "public_ipv6": ["string", "null"], "internal_ipv4": ["string", "null"], "internal_ipv6": ["string", "null"], "masternode": ["boolean", "number"], "id": "number" };
        bubblednsserver = addfunctions.objectconverter(bubblednsserver)
        let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, bubblednsserver)
        if (!check_for_correct_datatype.success) {
            resolve({ "success": false, "msg": check_for_correct_datatype.msg })
            return;
        }

        //Public: IPV4 & IPV6 check
        if (!addfunctions.isIPv4(bubblednsserver.public_ipv4) && !((bubblednsserver.public_ipv4 === null) || (bubblednsserver.public_ipv4 === "null"))) {
            resolve({ "success": false, "msg": "Public_IPV4 Address is neither a IPV4-Address nor 'null'" })
            return;
        }
        else if (!addfunctions.isIPv6(bubblednsserver.public_ipv6) && !((bubblednsserver.public_ipv6 === null) || (bubblednsserver.public_ipv6 === "null"))) {
            resolve({ "success": false, "msg": "Public_IPV6 Address is neither a IPV6-Address nor 'null'" })
            return;
        }
        else if (((bubblednsserver.public_ipv4 === null) || (bubblednsserver.public_ipv4 === "null")) && ((bubblednsserver.public_ipv6 === null) || (bubblednsserver.public_ipv6 === "null"))) {
            resolve({ "success": false, "msg": "Public_IPV4 Address or Public_IPV6 Address needs to be used" })
            return;
        }
        bubblednsserver.public_ipv4 = addfunctions.isIPv4(bubblednsserver.public_ipv4) === true ? bubblednsserver.public_ipv4 : null;
        bubblednsserver.public_ipv6 = addfunctions.isIPv6(bubblednsserver.public_ipv6) === true ? bubblednsserver.public_ipv6 : null;

        //Internal: IPV4 & IPV6 check
        if (!addfunctions.isIPv4(bubblednsserver.internal_ipv4) && !((bubblednsserver.internal_ipv4 === null) || (bubblednsserver.internal_ipv4 === "null"))) {
            resolve({ "success": false, "msg": "Internal_IPV4 Address is neither a IPV4-Address nor 'null'" })
            return;
        }
        else if (!addfunctions.isIPv6(bubblednsserver.internal_ipv6) && !((bubblednsserver.internal_ipv6 === null) || (bubblednsserver.internal_ipv6 === "null"))) {
            resolve({ "success": false, "msg": "Internal_IPV6 Address is neither a IPV6-Address nor 'null'" })
            return;
        }
        bubblednsserver.internal_ipv4 = addfunctions.isIPv4(bubblednsserver.internal_ipv4) === true ? bubblednsserver.internal_ipv4 : null;
        bubblednsserver.internal_ipv6 = addfunctions.isIPv6(bubblednsserver.internal_ipv6) === true ? bubblednsserver.internal_ipv6 : null;



        //Subdomainname always lowercase
        bubblednsserver.subdomainname = bubblednsserver.subdomainname.toLowerCase()

        //enabled_web only available together with masternode
        if (!bubblednsserver.masternode && bubblednsserver.enabled_web) {
            return({ "success": false, "msg": "Enabled_web requires that the server runs as a masternode" })
        }

        //Check if subdomainname is still free
        try {
            let preventdouble = await classdata.db.databasequerryhandler_secure(`select * from bubbledns_servers where subdomainname = ? AND id != ?`, [bubblednsserver.subdomainname, bubblednsserver.id])
            if (preventdouble.length) {
                return({ "success": false, "msg": "Subdomainname already in use" })
            }
        }
        catch (err) {
            throw new Error(err);
        }


        try {
            const databaseupdate = await classdata.db.databasequerryhandler_secure(`UPDATE bubbledns_servers set subdomainname=?,enabled_dns=?,enabled_web=?,public_ipv4=?,public_ipv6=?,internal_ipv4=?,internal_ipv6=?,masternode=? where id =? `, [bubblednsserver.subdomainname, bubblednsserver.enabled_dns, bubblednsserver.enabled_web, bubblednsserver.public_ipv4, bubblednsserver.public_ipv6, bubblednsserver.internal_ipv4, bubblednsserver.internal_ipv6, bubblednsserver.masternode, bubblednsserver.id]);
            if (databaseupdate.affectedRows === 1) {
                return ({ "success": true, "data": "Done" });
            }
            else {
                return ({ "success": false, "msg": "Databaseupdate failed" })
            }
        }
        catch (err) {
            throw new Error(err);
        }
    }

    //Rewritten+
    async bubbledns_servers_delete(bubblednsserver) {
        var that = this;

            let requiredFields = { "id": "number" };
            bubblednsserver = addfunctions.objectconverter(bubblednsserver)
            let check_for_correct_datatype = addfunctions.check_for_correct_datatype(requiredFields, bubblednsserver)
            if (!check_for_correct_datatype.success) {
                resolve({ "success": false, "msg": check_for_correct_datatype.msg })
                return;
            }

            
        try {
            const databaseupdate = await classdata.db.databasequerryhandler_secure(`DELETE FROM bubbledns_servers where id =?`, [bubblednsserver.id]);
            if (databaseupdate.affectedRows === 1) {
                return ({ "success": true, "data": "Done" });
            }
            else {
                return ({ "success": false, "msg": "Databaseupdate failed" })
            }
        }
        catch (err) {
            throw new Error(err);
        }
    }

}

export { apiclass_admin }
