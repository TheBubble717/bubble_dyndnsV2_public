"use strict";
import { addfunctions } from "./addfunctions.js"
import { classdata } from './main.js';
import { createRequire } from "module"
import https from "node:https"
import fs from "fs"
const require = createRequire(import.meta.url)
var bodyParser = require("body-parser");
var express = require('express');
var cookieParser = require('cookie-parser')
var path = require('path');
import { escape as expressescape } from "./bubble_expressescape_library.js"
const rateLimit = require('express-rate-limit')
import {EventEmitter} from "node:events"

class webclass extends EventEmitter {
    constructor(config, log) {
        super();
        this.em = null;
        this.config = config;
        this.expressserver = null;
        this.http_s_server = null;
        this.log = log
    }

    createserver(callback) {
        var that = this;
        return new Promise(async (resolve, reject) => {

            that.expressserver = express();

            if (that.config.enable_ssl) {
                let ssloptions = {
                    cert: fs.readFileSync(path.resolve() + that.config.ssl.cert),
                    key: fs.readFileSync(path.resolve() + that.config.ssl.key),
                }

                that.http_s_server = https.createServer(ssloptions, that.expressserver);

                that.http_s_server.listen(that.config.port, that.config.hostname, async function () {
                    var answer = "WEB-SSL-Server was started successfully and is listening on Port: " + that.config.port
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
            else {

                that.http_s_server = that.expressserver.listen(that.config.port, that.config.hostname, async function () {
                    var answer = "WEB-Server was started successfully and is listening on Port: " + that.config.port
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

            that.http_s_server.on('error', async function (e) {
                if (callback && typeof callback == 'function') {
                    await callback(e.message, "");
                    resolve();
                }
                else {
                    reject(e.message);
                }
                return;
            });


            const apilimiter = rateLimit({
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 120, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
                standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
                legacyHeaders: false, // Disable the `X-RateLimit-*` headers
            })

            that.expressserver.use(bodyParser.urlencoded({ extended: false }))
            that.expressserver.use(bodyParser.json())
            that.expressserver.use(cookieParser())
            that.expressserver.use(expressescape)

            that.expressserver.use('/website/admin', async function (req, res, next) {
                let isadmin = await classdata.api.account.auth_isadmin_cookie(req.cookies.cookie)
                if (isadmin) {
                    next();
                } else {
                    res.status(403).send('Forbidden: You do not have access to this resource.');
                }
            }, express.static(path.resolve('website/admin/')));
            that.expressserver.use('/website', express.static(path.resolve('website')))
            that.expressserver.use(function (err, req, res, next) { console.error(err.stack); res.status(500).send('Something broke!'); });
            that.expressserver.set('trust proxy', 1)




            that.expressserver.post('/accapi*', apilimiter, async function (req, res) {

                if (req.body.task === undefined) {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "Task not given!" }))
                    res.end();
                    return;
                }

                let tasks = classdata.tasks.account
                if (tasks[req.body.task]) {
                    tasks[req.body.task].process(req, res, that)
                }
                else {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "Task unclear" }))
                    res.end();
                    return;
                }

            });

            that.expressserver.post('/autologin/', apilimiter, async function (req, res) {

                //Only continue if cookie is defined
                if (req.body.cookie === undefined) {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "Cookie not given!" }))
                    res.end();
                    return;
                }

                //Actual Auto-login
                var cookie = req.body.cookie;
                let user = await classdata.api.account.auth_cookie(cookie)
                if (user.success) {
                    user.data = user.data.get_user_personal()
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
            });

            that.expressserver.post('/dnsapi*', apilimiter, async function (req, res) {

                //Only continue if apikey AND task are defined!
                if ((req.body.apikey === undefined) || (req.body.task === undefined)) {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "API or Task not given!" }))
                    res.end();
                    return;
                }

                let tasks = classdata.tasks.dns
                if (tasks[req.body.task]) {
                    tasks[req.body.task].process(req, res, that)
                }
                else {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "Task unclear" }))
                    res.end();
                    return;
                }

            });

            that.expressserver.post('/adminapi/', apilimiter, async function (req, res) {
                //Only continue if apikey AND task are defined!
                if ((req.body.apikey === undefined) || (req.body.task === undefined)) {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "API or Task not given!" }))
                    res.end();
                    return;
                }

                let tasks = classdata.tasks.admin
                if (tasks[req.body.task]) {
                    tasks[req.body.task].process(req, res, that)
                }
                else {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "Task unclear" }))
                    res.end();
                    return;
                }

            });

            // /update?id=8063110&apikey=jfaG1n1NzPukGydLhyZqHn48giCuqb8GBPo8jys4YHyCl9SUbnQ3ekszZsTEnQSmIYWFDs1ayDd8qYTsiUE9nlwiQgak3Sx
            that.expressserver.get('/update*', apilimiter, async function (req, res) //Only works with IPV4 to be set automatically
            {

                if (req.query.id === undefined || req.query.apikey === undefined) {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "Data not complete" }))
                    res.end();
                    return;
                }

                //Set IPV4 if not given
                if (req.query.value === undefined) {
                    req.query.value = addfunctions.getclientipv4(req);
                }

                try {
                    let user = await classdata.api.account.auth_api(req.query.apikey)
                    if (user.success) {
                        let dnsentry = await classdata.api.dns.dnsentry_list(user.data, { "id": req.query.id })
                        if (dnsentry.success && typeof dnsentry.data !== "undefined" && dnsentry.data.length === 1) {
                            dnsentry.data[0].entryvalue = req.query.value;
                            let updateddnsentry = await classdata.api.dns.dnsentry_update(user.data, dnsentry.data[0])
                            if (updateddnsentry.success) {
                                res.writeHead(200, { 'Content-Type': 'text/html' });
                                res.write(JSON.stringify(updateddnsentry))
                                res.end();
                            }
                            else {
                                res.writeHead(403, { 'Content-Type': 'text/html' });
                                res.write(JSON.stringify(updateddnsentry));
                                res.end();
                                return;
                            }

                        }
                        else {
                            res.writeHead(403, { 'Content-Type': 'text/html' });
                            res.write(JSON.stringify({ "success": false, "msg": "Can't find DNS-Entry" }));
                            res.end();
                            return;
                        }

                    }
                    else {
                        res.writeHead(403, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(user));
                        res.end();
                        return;
                    }
                }
                catch (err) {
                    that.log.addlog("Unknown ERROR:" + err, { colour: "red", warn: "Allg. API-Error" })
                    resolve({ "success": false, "msg": "Unknown Error" })
                    return;
                }


            });

            that.expressserver.get('/confirm*', apilimiter, async function (req, res) {

                if (req.query.keytext === undefined) {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "Data not complete" }))
                    res.end();
                    return;
                }

                const { keytext, ...data } = req.query;
                var answer = await classdata.mail.mailconfirmation_processing({ "keytext": req.query.keytext }, data) //the whole req.query becomes data
                if (!answer.success) {
                    res.writeHead(302, { 'Location': '/404.html' });
                    res.end();
                    return;
                }
                else {
                    if (answer.data.completed) {
                        if (answer.data.keytype == 1) {

                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.write(JSON.stringify(answer))
                            res.end();
                            return;
                        }
                        else if (answer.data.keytype == 2) {
                            res.writeHead(302, { 'Location': `/` });
                            res.end();
                            return;
                        }
                    }
                    else {
                        if (answer.data.keytype == 1) {
                            res.writeHead(302, { 'Location': `/resetpasswd?keytext=${answer.data.keytext}` });
                            res.end();
                            return;
                        }
                        else {
                            res.writeHead(302, { 'Location': '/404.html' });
                            res.end();
                            return;
                        }
                    }
                }

            });

            that.expressserver.get(['*'], apilimiter, async function (req, res) {
                let content = await addfunctions.read_file("./website/index.html")
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.write(content);
                res.end();
            });

        });
    }

}






export { webclass }