"use strict";
import { addfunctions } from "./addfunctions.js"
import { classdata } from './main.js';


var tasks =
{
    "auth_register":
    {
        description: "Register an Account on the site",
        example: "/accapi?task=auth_register&mailaddress=hal1lo&password1=du&password2=du",
        do_pretask: true,
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
                req.body.data.useripv4 = pretaskdata.useripv4
                req.body.data.useripv6 = pretaskdata.useripv6


                //Actual Registration
                classdata.api.account.auth_register(req.body.data).then(function (user) {
                    if (user.success) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(user))
                        res.end();
                    }
                    else {
                        res.writeHead(403, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(user))
                        res.end();
                        return;
                    }
                })
                    .catch(function (err) {
                        res.writeHead(500, { 'Content-Type': 'text/html' });
                        res.write("Error registering")
                        res.end();
                        return;
                    })

            });


        }
    },

    "auth_login":
    {
        description: "Register an Account on the site",
        example: "/accapi?task=login&mailaddress=hal1lo&password=du",
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
                req.body.data.useripv4 = pretaskdata.useripv4
                req.body.data.useripv6 = pretaskdata.useripv6

                //Actual Login
                classdata.api.account.auth_login(req.body.data).then(function (user) {
                    if (user.success) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(user))
                        res.end();
                    }
                    else {
                        res.writeHead(403, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(user))
                        res.end();
                        return;
                    }
                })
                    .catch(function (err) {
                        res.writeHead(500, { 'Content-Type': 'text/html' });
                        res.write("Error login")
                        res.end();
                        return;
                    })

            });

        }

    },

    "req_passwordreset":
    {
        description: "Register an Account on the site",
        example: "/accapi?task=login&mailaddress=hal1lo&password=du",
        process: async function (req, res, that) {

            //Only continue data is defined
            if (req.body.data === undefined) {
                res.writeHead(403, { 'Content-Type': 'text/html' });
                res.write(JSON.stringify({ "success": false, "msg": "Data not given!" }))
                res.end();
                return;
            }

            //Mailaddress check
            let checkeduserdata =  await addfunctions.check_for_valid_user_entries({ "mailaddress": req.body.data.mailaddress })
            if (!checkeduserdata.success) {
                res.writeHead(403, { 'Content-Type': 'text/html' });
                res.write(JSON.stringify(checkeduserdata))
                res.end();
                return
            }

            var user = new classdata.classes.userclass({ "mailaddress": req.body.data.mailaddress })
            var load_useranswer = await user.get_user_from_mailaddress()
            if (load_useranswer.success) {
                classdata.mail.mailconfirmation_create({ "keytype": 1, "userid": user.get_user_public().id })
            }
            var standardanswer = { "success": true, data: "Recovery E-Mail was sent to the User" }
            await addfunctions.waittime_random(100, 2000)
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(JSON.stringify(standardanswer))
            res.end();

        }

    }
}


async function pretask(req, res, that, callback) {
    return new Promise(async (resolve, reject) => {

        //Get ipv4-Address of the user.
        var useripv4 = addfunctions.getclientipv4(req);
        if (!addfunctions.isIPv4(useripv4)) {
            useripv4 = null;
        }

        //Get ipv6-Address of the user. //XXXXXXXXXXXX
        var useripv6 = null;



        let answer = { "useripv4": useripv4, "useripv6": useripv6 }
        if (callback && typeof callback == 'function') {
            await callback("", answer);
            resolve();
        }
        else {
            resolve(answer);
        }
        return;
    });
}

export { tasks, pretask }