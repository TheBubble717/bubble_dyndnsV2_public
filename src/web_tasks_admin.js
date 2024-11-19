"use strict";
import { addfunctions } from "./addfunctions.js"
import { classdata } from './main.js';

var tasks =
{
    "dns_upstream_servers_list":
    {
        description: "Register an Account on the site",
        example: "",
        process: async function (req, res, that) {
            pretask(req, res, that, async function (err, pretaskdata) {
                if (err) {
                    let answer = { "success": false, "msg": err }
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }



                classdata.api.admin.dns_upstream_servers_list().then(function (answer) {
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
                })
                    .catch(function (err) {
                        res.writeHead(500, { 'Content-Type': 'text/html' });
                        res.write("Error dns_upstream_servers_list error")
                        res.end();
                        return;
                    })

            });
        }
    },

    "dns_upstream_servers_enabledisable":
    {
        description: "Register an Account on the site",
        example: "",
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

                classdata.api.admin.dns_upstream_servers_enabledisable(req.body.data).then(function (answer) {
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
                })
                    .catch(function (err) {
                        res.writeHead(500, { 'Content-Type': 'text/html' });
                        res.write("Error dns_upstream_servers_enabledisable error")
                        res.end();
                        return;
                    })
            });
        }
    },

    "dns_upstream_servers_delete":
    {
        description: "Register an Account on the site",
        example: "",
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

                classdata.api.admin.dns_upstream_servers_delete(req.body.data).then(function (answer) {
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
                })
                    .catch(function (err) {
                        res.writeHead(500, { 'Content-Type': 'text/html' });
                        res.write("Error dns_upstream_servers_delete error")
                        res.end();
                        return;
                    })

            });
        }
    },

    "dns_upstream_servers_create":
    {
        description: "Register an Account on the site",
        example: "",
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

                classdata.api.admin.dns_upstream_servers_create(req.body.data).then(function (answer) {
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
                })
                    .catch(function (err) {
                        res.writeHead(500, { 'Content-Type': 'text/html' });
                        res.write("Error dns_upstream_servers_create error")
                        res.end();
                        return;
                    })

            });
        }
    },

    "user_management_list_all":
    {
        description: "Register an Account on the site",
        example: "",
        process: async function (req, res, that) {
            pretask(req, res, that, async function (err, pretaskdata) {
                if (err) {
                    let answer = { "success": false, "msg": err }
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }

                classdata.api.account.get_user_all().then(function (answer) {
                    if (answer.success) {
                        answer.data = answer.data.map(function (user) { return user.get_user_public() })
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
                })
                    .catch(function (err) {
                        res.writeHead(500, { 'Content-Type': 'text/html' });
                        res.write("Error user_management_list_all error")
                        res.end();
                        return;
                    })

            });
        }
    },

    "user_management_list_id":
    {
        description: "Register an Account on the site",
        example: "",
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

                classdata.api.account.get_user_full(req.body.data).then(function (answer1) {
                    if (answer1.success) {
                        answer1.data[1] = answer1.data[1].get_user_public()
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(answer1))
                        res.end();

                    }
                    else {
                        res.writeHead(403, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(answer1));
                        res.end();
                        return;
                    }
                })
                    .catch(function (err) {
                        res.writeHead(500, { 'Content-Type': 'text/html' });
                        res.write("Error user_management_list_id error")
                        res.end();
                        return;
                    })
            });
        }
    },

    "user_management_update_user":
    {
        description: "Register an Account on the site",
        example: "",
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

                classdata.api.account.update_user(req.body.data).then(function (answer) {
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
                })
                    .catch(function (err) {
                        res.writeHead(500, { 'Content-Type': 'text/html' });
                        res.write("Error user_management_list_id error")
                        res.end();
                        return;
                    })
            });
        }
    },

    "bubbledns_servers_list":
    {
        description: "Register an Account on the site",
        example: "",
        process: async function (req, res, that) {
            pretask(req, res, that, async function (err, pretaskdata) {
                if (err) {
                    let answer = { "success": false, "msg": err }
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }

                classdata.api.admin.bubbledns_servers_list().then(function (bubblednsservers) {
                    if (bubblednsservers.success) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(bubblednsservers))
                        res.end();
                        return;
                    }
                    else {
                        res.writeHead(403, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(bubblednsservers));
                        res.end();
                        return;
                    }
                })
                    .catch(function (err) {
                        res.writeHead(500, { 'Content-Type': 'text/html' });
                        res.write("Error bubbledns_servers_list error")
                        res.end();
                        return;
                    })

            });
        }
    },

    "bubbledns_servers_synctest":
    {
        description: "Register an Account on the site",
        example: "",
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

                classdata.api.admin.bubbledns_servers_synctest(req.body.data).then(function (answer) {
                    if (answer.success) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(answer))
                        res.end();
                        return;
                    }
                    else {
                        res.writeHead(403, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(answer));
                        res.end();
                        return;
                    }
                })
                    .catch(function (err) {
                        res.writeHead(500, { 'Content-Type': 'text/html' });
                        res.write("Error bubbledns_servers_list error")
                        res.end();
                        return;
                    })

            });
        }
    },

    "bubbledns_servers_create":
    {
        description: "Register an Account on the site",
        example: "",
        process: async function (req, res, that) {
            pretask(req, res, that, async function (err, pretaskdata) {
                if (err) {
                    let answer = { "success": false, "msg": err }
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }

                //Only continue data id defined
                if (req.body.data === undefined) {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "Data not given!" }))
                    res.end();
                    return;
                }

                classdata.api.admin.bubbledns_servers_create(req.body.data).then(function (answer) {
                    if (answer.success) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(answer))
                        res.end();
                        return;
                    }
                    else {
                        res.writeHead(403, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(answer));
                        res.end();
                        return;
                    }
                })
                    .catch(function (err) {
                        res.writeHead(500, { 'Content-Type': 'text/html' });
                        res.write("Error bubbledns_servers_create error")
                        res.end();
                        return;
                    })

            });
        }
    },

    "bubbledns_servers_update":
    {
        description: "Register an Account on the site",
        example: "",
        process: async function (req, res, that) {
            pretask(req, res, that, async function (err, pretaskdata) {
                if (err) {
                    let answer = { "success": false, "msg": err }
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }

                //Only continue data id defined
                if (req.body.data === undefined) {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "Data not given!" }))
                    res.end();
                    return;
                }

                classdata.api.admin.bubbledns_servers_update(req.body.data).then(function (answer) {
                    if (answer.success) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(answer))
                        res.end();
                        return;
                    }
                    else {
                        res.writeHead(403, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(answer));
                        res.end();
                        return;
                    }
                })
                    .catch(function (err) {
                        res.writeHead(500, { 'Content-Type': 'text/html' });
                        res.write("Error bubbledns_servers_update error")
                        res.end();
                        return;
                    })

            });
        }
    },
   
    "bubbledns_servers_delete":
    {
        description: "Register an Account on the site",
        example: "",
        process: async function (req, res, that) {
            pretask(req, res, that, async function (err, pretaskdata) {
                if (err) {
                    let answer = { "success": false, "msg": err }
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify(answer));
                    res.end();
                    return;
                }

                //Only continue data id defined
                if (req.body.data === undefined) {
                    res.writeHead(403, { 'Content-Type': 'text/html' });
                    res.write(JSON.stringify({ "success": false, "msg": "Data not given!" }))
                    res.end();
                    return;
                }

                classdata.api.admin.bubbledns_servers_delete(req.body.data).then(function (answer) {
                    if (answer.success) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(answer))
                        res.end();
                        return;
                    }
                    else {
                        res.writeHead(403, { 'Content-Type': 'text/html' });
                        res.write(JSON.stringify(answer));
                        res.end();
                        return;
                    }
                })
                    .catch(function (err) {
                        res.writeHead(500, { 'Content-Type': 'text/html' });
                        res.write("Error bubbledns_servers_delete error")
                        res.end();
                        return;
                    })

            });
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

        //Check if apikey belongs to a user & isadmin =1
        classdata.api.account.auth_api(req.body.apikey).then(async function (userreq) {
            if (userreq.success) {
                if (userreq.data.get_user_public().isadmin) {
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
                    let error = "API doesn't belong to a user or is not an admin"
                    if (callback && typeof callback == 'function') {
                        await callback(error, "");
                        resolve();
                    }
                    else {
                        reject(error);
                    }
                    return;
                }
            }
            else {
                let error = "API doesn't belong to a user or is not an admin"
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




export { tasks, pretask }