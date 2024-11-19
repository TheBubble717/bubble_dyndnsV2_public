"use strict";
import { addfunctions } from "./addfunctions.js"
import { classdata } from './main.js';

var tasks =
{

    "dnsentry_update":
    {
        description: "Register an Account on the site",
        example: "dnsapi?apikey=leckerapi&task=update&id=82917045&ipv4=1.2.3.4&ipv6=::1 oder dnsapi?apikey=leckerapi&task=update&id=82917045 für local oder &domain=sdas",
        process: async function (req, res, that) {
            pretask(req, res, that, async function (err, pretaskdata) {
                if (err) {
                    let answer = { "success": false, "msg": err }
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }

                //Only continue data is defined
                if (req.body.data === undefined) {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "Data not given!" }))
                    res.end();
                    return;
                }

                //Actual Update
                let answer = await classdata.api.dns.dnsentry_update(pretaskdata.user.data, req.body.data)
                if (answer.success) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer))
                    res.end();
                }
                else {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }
            });
        }

    },

    "dnsentry_delete":
    {
        description: "Register an Account on the site",
        example: "/dnsapi?apikey=leckerapi3&task=dns_delete&id=213212",
        process: async function (req, res, that) {
            pretask(req, res, that, async function (err, pretaskdata) {
                if (err) {
                    let answer = { "success": false, "msg": err }
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }

                //Only continue data is defined
                if (req.body.data === undefined) {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "Data not given!" }))
                    res.end();
                    return;
                }

                //Actual Deletion
                let answer = await classdata.api.dns.dnsentry_delete(pretaskdata.user.data, req.body.data)
                if (answer.success) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer))
                    res.end();
                }
                else {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }
            });
        }
    },

    "dnsentry_create":
    {
        description: "Register an Account on the site",
        example: "dnsapi?apikey=leckerapi&task=create&domain=testdomain&ipv4=1.2.3.4&ipv6=::1 oder /dnsapi?apikey=leckerapi&task=create&name=testdomain für local",
        process: async function (req, res, that) {
            pretask(req, res, that, async function (err, pretaskdata) {
                if (err) {
                    let answer = { "success": false, "msg": err }
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }

                //Only continue data is defined
                if (req.body.data === undefined) {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "Data not given!" }))
                    res.end();
                    return;
                }


                //Actual Creation
                let answer = await classdata.api.dns.dnsentry_create(pretaskdata.user.data, req.body.data)
                if (answer.success) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer))
                    res.end();
                }
                else {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }
            });
        }

    },

    "domain_list_owner":
    {
        description: "Register an Account on the site",
        example: "/dnsapi?apikey=leckerapi3&task=dns_list",
        process: async function (req, res, that) {
            pretask(req, res, that, async function (err, pretaskdata) {
                if (err) {
                    let answer = { "success": false, "msg": err }
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }

                //Actual Listing
                let answer = await classdata.api.dns.domain_list_owner(pretaskdata.user.data)
                if (answer.success) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer))
                    res.end();
                }
                else {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }
            });
        }
    },

    "domain_list_shared":
    {
        description: "Register an Account on the site",
        example: "/dnsapi?apikey=leckerapi3&task=dns_list",
        process: async function (req, res, that) {
            pretask(req, res, that, async function (err, pretaskdata) {
                if (err) {
                    let answer = { "success": false, "msg": err }
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }

                //Actual Listing
                let answer = await classdata.api.dns.domain_list_shared(pretaskdata.user.data)
                if (answer.success) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer))
                    res.end();
                }
                else {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }
            });
        }
    },

    "domain_create":
    {
        description: "Register an Account on the site",
        example: "dnsapi?apikey=leckerapi&task=create&domain=testdomain&ipv4=1.2.3.4&ipv6=::1 oder /dnsapi?apikey=leckerapi&task=create&name=testdomain für local",
        process: async function (req, res, that) {
            pretask(req, res, that, async function (err, pretaskdata) {
                if (err) {
                    let answer = { "success": false, "msg": err }
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }

                //Only continue data is defined
                if (req.body.data === undefined) {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "Data not given!" }))
                    res.end();
                    return;
                }

                //Actual Creation
                let creationresult = await classdata.api.dns.domain_create(pretaskdata.user.data, req.body.data)
                if (creationresult.success) {
                    let answer = await classdata.api.dns.domain_list_owner(pretaskdata.user.data, creationresult.data)
                    if (answer.success) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(answer))
                        res.end();
                    }
                    else {
                        res.writeHead(403, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(answer));
                        res.end();
                        return;
                    }
                }
                else {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(creationresult));
                    res.end();
                    return;
                }



            });
        }

    },

    "domain_delete":
    {
        description: "Register an Account on the site",
        example: "/dnsapi?apikey=leckerapi3&task=dns_delete&id=213212",
        process: async function (req, res, that) {
            pretask(req, res, that, async function (err, pretaskdata) {
                if (err) {
                    let answer = { "success": false, "msg": err }
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }

                //Only continue data is defined
                if (req.body.data === undefined) {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "Data not given!" }))
                    res.end();
                    return;
                }


                //Actual Deletion
                let answer = await classdata.api.dns.domain_delete(pretaskdata.user.data, req.body.data)
                if (answer.success) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer))
                    res.end();
                }
                else {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }
            });
        }
    },

    "domain_verify":
    {
        description: "Register an Account on the site",
        example: "dnsapi?apikey=leckerapi&task=create&domain=testdomain&ipv4=1.2.3.4&ipv6=::1 oder /dnsapi?apikey=leckerapi&task=create&name=testdomain für local",
        process: async function (req, res, that) {
            pretask(req, res, that, async function (err, pretaskdata) {
                if (err) {
                    let answer = { "success": false, "msg": err }
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }

                //Only continue data is defined
                if (req.body.data === undefined) {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "Data not given!" }))
                    res.end();
                    return;
                }

                //Actual Verification
                let answer1 = await classdata.api.dns.domain_verify(pretaskdata.user.data, req.body.data)
                if (answer1.success) {
                    let answer2 = await classdata.api.dns.domain_list_owner(pretaskdata.user.data, req.body.data)
                    if (answer2.success) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(answer2))
                        res.end();
                    }
                    else {
                        res.writeHead(403, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(answer2));
                        res.end();
                        return;
                    }

                }
                else {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer1));
                    res.end();
                    return;
                }



            });
        }

    },

    "domain_share_adduser":
    {
        description: "Register an Account on the site",
        example: "dnsapi?apikey=leckerapi&task=create&domain=testdomain&ipv4=1.2.3.4&ipv6=::1 oder /dnsapi?apikey=leckerapi&task=create&name=testdomain für local",
        process: async function (req, res, that) {
            pretask(req, res, that, async function (err, pretaskdata) {
                if (err) {
                    let answer = { "success": false, "msg": err }
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }

                //Only continue data is defined
                if (req.body.data === undefined) {
                    if (!((typeof req.body.data === "object") && (req.body.data !== null))) {
                        res.writeHead(403, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify({ "success": false, "msg": "Data not given!" }))
                        res.end();
                        return;
                    }
                }


                //Only continue if domainid and mailaddress is defined!
                if ((req.body.data.domainid === undefined) || (req.body.data.mailaddress === undefined)) {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "Domain ID or mailaddress is not provided" }))
                    res.end();
                    return;
                }



                //Actual Creation
                let creationresult = await classdata.api.dns.domain_share_adduser(pretaskdata.user.data, req.body.data.domainid, req.body.data.mailaddress)
                if (creationresult.success) {
                    let answer = await classdata.api.dns.domain_list_owner(pretaskdata.user.data, { "id": req.body.data.domainid })
                    if (answer.success) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(answer))
                        res.end();
                    }
                    else {
                        res.writeHead(403, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(answer));
                        res.end();
                        return;
                    }
                }
                else {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(creationresult));
                    res.end();
                    return;
                }



            });
        }

    },

    "domain_share_deleteuser":
    {
        description: "Register an Account on the site",
        example: "/dnsapi?apikey=leckerapi3&task=dns_delete&id=213212",
        process: async function (req, res, that) {
            pretask(req, res, that, async function (err, pretaskdata) {
                if (err) {
                    let answer = { "success": false, "msg": err }
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }

                //Only continue data is defined
                if (req.body.data === undefined) {
                    if (!((typeof req.body.data === "object") && (req.body.data !== null))) {
                        res.writeHead(403, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify({ "success": false, "msg": "Data not given!" }))
                        res.end();
                        return;
                    }
                }

                //Only continue if userid and domainid is defined!
                if ((req.body.data.userid === undefined) || (req.body.data.domainid === undefined)) {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "Domain ID or User ID is not provided" }))
                    res.end();
                    return;
                }

                //Actual Deletion
                let answer = await classdata.api.dns.domain_share_deleteuser(pretaskdata.user.data, req.body.data.domainid, req.body.data.userid)
                if (answer.success) {
                    let answer = await classdata.api.dns.domain_list_owner(pretaskdata.user.data, { "id": req.body.data.domainid })
                    if (answer.success) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(answer))
                        res.end();
                    }
                    else {
                        res.writeHead(403, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(answer));
                        res.end();
                        return;
                    }

                }
                else {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }
            });
        }
    },

    "dns_get_bubblednsservers":
    {
        description: "Register an Account on the site",
        example: "/dnsapi?apikey=leckerapi3&task=dns_delete&id=213212",
        process: async function (req, res, that) {
            pretask(req, res, that, async function (err, pretaskdata) {
                if (err) {
                    let answer = { "success": false, "msg": err }
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }

                let answer = await classdata.api.dns.dns_get_bubblednsservers()
                if (answer.success) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer))
                    res.end();
                }
                else {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }
            });
        }
    },

    "dns_get_allowed_dnstype_entries":
    {
        description: "Register an Account on the site",
        example: "/dnsapi?apikey=leckerapi3&task=dns_delete&id=213212",
        process: async function (req, res, that) {
            pretask(req, res, that, async function (err, pretaskdata) {
                if (err) {
                    let answer = { "success": false, "msg": err }
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }

                let answer = await classdata.api.dns.dns_get_allowed_dnstype_entries()
                if (answer.success) {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer))
                    res.end();
                }
                else {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }
            });
        }
    },

}


export { tasks, pretask }


async function pretask(req, res, that, callback) {

    return new Promise(async (resolve, reject) => {
        //Get ipv4-Address of the user.
        var useripv4 = addfunctions.getclientipv4(req);
        if (!addfunctions.isIPv4(useripv4)) {
            useripv4 = null;
        }

        //Get ipv6-Address of the user. //XXXXXXXXXXXX
        var useripv6 = null;

        //Check if apikey belongs to a user
        classdata.api.account.auth_api(req.body.apikey).then(async function (userreq) {
            if (userreq.success) {
                let answer = { "useripv4": useripv4, "useripv6": useripv6, "user": userreq }
                if (callback && typeof callback == 'function') {
                    await callback("", answer);
                    resolve();
                }
                else {
                    resolve(answer);
                }
                return;

            }
            else {
                let error = "API doesn't belong to a user"
                if (callback && typeof callback == 'function') {
                    await callback(error, "");
                    resolve();
                }
                else {
                    reject(error);
                }
                return;
            }
        })
    });
}

