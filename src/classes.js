"use strict";
import { classdata } from './main.js';

class userclass {
    // Private fields
    #id;
    #mailaddress;
    #passwordhash;
    #api;
    #isadmin;
    #isactive;
    #maxentries;
    #maxdomains;
    #registrationdate;
    #cookie;
    #confirmedmail;

    constructor({
        id = null,
        mailaddress = null,
        passwordhash = null,
        api = null,
        isadmin = null,
        isactive = null,
        maxentries = null,
        maxdomains = null,
        registrationdate = null,
        cookie = null,
        confirmedmail = null,
    } = {}) {
        this.#id = id;
        this.#mailaddress = mailaddress;
        this.#passwordhash = passwordhash;
        this.#api = api;
        this.#isadmin = isadmin;
        this.#isactive = isactive;
        this.#maxentries = maxentries;
        this.#maxdomains = maxdomains;
        this.#registrationdate = registrationdate;
        this.#cookie = cookie;
        this.#confirmedmail = confirmedmail;
    }

    set_user_data({
        id = null,
        mailaddress = null,
        passwordhash = null,
        api = null,
        isadmin = null,
        isactive = null,
        maxentries = null,
        maxdomains = null,
        registrationdate = null,
        cookie = null,
        confirmedmail = null,
    } = {}) {
        if (id !== null) {
            this.#id = id;
        }
        if (mailaddress !== null) {
            this.#mailaddress = mailaddress;
        }
        if (passwordhash !== null) {
            this.#passwordhash = passwordhash;
        }
        if (api !== null) {
            this.#api = api;
        }
        if (isadmin !== null) {
            this.#isadmin = isadmin;
        }
        if (isactive !== null) {
            this.#isactive = isactive;
        }
        if (maxentries !== null) {
            this.#maxentries = maxentries;
        }
        if (maxdomains !== null) {
            this.#maxdomains = maxdomains;
        }
        if (registrationdate !== null) {
            this.#registrationdate = registrationdate;
        }
        if (cookie !== null) {
            this.#cookie = cookie;
        }
        if (confirmedmail !== null) {
            this.#confirmedmail = confirmedmail;
        }
    }

    async get_user_from_id() {
        var that = this;
        try {
            var result = await classdata.db.databasequerryhandler_secure(`select * from users where id=? `, [that.#id])
            if (result.length) {
                that.set_user_data(result[0])
                return ({ "success": true, "data": "Userdata loaded and saved!" })
            } else {
                return { success: false, msg: "No user found!" };
            }
        }
        catch (err) {
            return { success: false, msg: "Error Requesting User from ID" };
        }
    }

    async get_user_from_mailaddress() {
        var that = this;
        try {
            var result = await classdata.db.databasequerryhandler_secure(`select * from users where mailaddress=? `, [that.#mailaddress])
            if (result.length) {
                that.set_user_data(result[0])
                return ({ "success": true, "data": "Userdata loaded and saved!" })
            } else {
                return { success: false, msg: "No user found!" };
            }
        }
        catch (err) {
            return { success: false, msg: "Error Requesting User from Mailaddress" };
        }
    }

    get_user_public() {
        return {
            id: this.#id,
            mailaddress: this.#mailaddress,
            isadmin: this.#isadmin,
            isactive: this.#isactive,
            maxentries: this.#maxentries,
            maxdomains: this.#maxdomains,
            registrationdate: this.#registrationdate,
            confirmedmail: this.#confirmedmail
        };
    }

    get_user_personal() {
        return {
            id: this.#id,
            mailaddress: this.#mailaddress,
            isadmin: this.#isadmin,
            isactive: this.#isactive,
            maxentries: this.#maxentries,
            maxdomains: this.#maxdomains,
            registrationdate: this.#registrationdate,
            cookie: this.#cookie,
            api: this.#api,
            confirmedmail: this.#confirmedmail
        };
    }

    get_user_internal() {
        return {
            id: this.#id,
            mailaddress: this.#mailaddress,
            isadmin: this.#isadmin,
            isactive: this.#isactive,
            maxentries: this.#maxentries,
            maxdomains: this.#maxdomains,
            registrationdate: this.#registrationdate,
            cookie: this.#cookie,
            api: this.#api,
            passwordhash: this.#passwordhash,
            confirmedmail: this.#confirmedmail
        };
    }

}


export { userclass }


