# BubbleDNS - Dynamic DNS-Server

BubbleDNS is a self-hosted Dynamic DNS (DDNS) service similar to DynDNS or NO-IP, built to give you complete control over your DNS management. Powered by a flexible nodejs backend, BubbleDNS ensures reliable updates to your IP address, keeping your devices and services always accessible.


## Key Features
* Self-Hosting Freedom: Full control over your DNS setup, hosted entirely on your server.
* Simple Updates: Update your IP via a lightweight web service using tools like curl.
* Custom Domains: Easily add and configure your own domain for dynamic updates.
* Open Source: The whole source code is available here on Github.


## Getting Started
### Requirements
* A domain where the Registrar allows setting the NS Records (Like Namcheap).
* A server with (Nodejs, Mariadb and Apache/Ngnix) OR (~~~Docker~~~ coming soon).
* Open the following ports:
    * 53/udp
    * 80/tcp
    * 443/tcp


## Installation - NodeJS and Mariadb

```
git clone git@github.com:TheBubble717/bubble_dyndnsV2.git
cd bubble_dyndnsV2
nano db.sql --- Change the <YourPassword> to a secure password and under "maindomain", write the maindomain under which everything runs
mysql < db.sql
nano config.json --- Change the <YourPassword> to the same password and under "public_ip" the ip the server will be avaiable under.
npm i
node server.js
```

If you are running the server as a non-sudo user, you may not be able to use port 53/udp directly. I added a small guide under `InstallData/Installation.txt`

During the firt startup, a User with the Username `bubbledns@"maindomain"` is registered and becomes an administrator. The console will post the random generated password to login.
This server gets also registered as `"ns1"."maindomain"` as an `masternode`. Only `masternodes` can make changes to the database.
Last but not least, the domain `maindomain` gets also registered under the administrator account and becomes a so called `builtin` domain.
Built in Domains can be used by every useraccount. After that, the server kills itself.

The Webserver should be available under https://127.0.0.1:12512, you can add an Apache Reverse Proxy (an example is under `InstallData/apacheconfig.conf`).
You can directly access the webserver with the configfile: `webserver.hostname = "0.0.0.0"`, but I would recommend generating a new ssl certificate!

## Keeping the Server Running - NodeJS and Mariadb

I prefer using pm2, which you can install and run the server.js with:

```
npm i -g pm2
pm2 start server.js
```
If the DNS server settings are changed, for example via the web interface, the server may restart automatically.


## Fine-Tuning the Server #1 - Settings - NodeJS and Mariadb

### Database-Settings - NodeJS and Mariadb
Most of the fundamental changes can be made in the database, so that every change gets replicated to the rest of the servers
Please don't change those values before first starting up the server.
```
--- Amount of dns_entries a newly created user can create
insert into bubbledns_settings values("standardmaxentries","5");  
--- Amount of domains a newly created user can claim
insert into bubbledns_settings values("standardmaxdomains","2");  
--- Disable/Enable Password reset over Mail
insert into bubbledns_settings values("enable_passwordreset",true); 
--- Disable/Enable Registration
insert into bubbledns_settings values("enable_register",true);    
--- Maindomain, as already explained
insert into bubbledns_settings values("maindomain","bubbledns.com"); 
--- Allow the use as an real dns server (querying any dns question to an Upstream Server)
--- This should only be allowed if the server is only available in a private network
insert into bubbledns_settings values("allowuseageasrealproxy","false");
--- Ban Time if a Upstream DNS Server has a Timeout
insert into bubbledns_settings values("realdns_bantime","43200");
--- Set which dnstypes can be sent to the BubbleDNS-Server
insert into bubbledns_settings values("allowed_dnstype_questions","[`A`,`AAAA`,`CNAME`,`MX`,`NS`,`PTR`,`SRV`,`SOA`,`CAA`,`TXT`]");
--- Set which dnstypes a user(or admin) is allowed to set on an "builtin" domain
insert into bubbledns_settings values("allowed_dnstype_entries_builtin","[`A`,`AAAA`]");
--- Set which dnstypes the owner(or share) is allowed to set on an "custom" domain (Domain added by an user)
insert into bubbledns_settings values("allowed_dnstype_entries_custom","[`A`,`AAAA`,`CNAME`,`MX`,`TXT`]");
```

### Server-Settings - NodeJS and Mariadb
Inside config.json, some compartments have the items `screenLogLevel`, `fileLogLevel` and `debug`.
* `screenLogLevel`: Only show Logs higher or same level on the screen (1 = Logs, 2 = Warning, 3 = Errors)
* `fileLogLevel`: Only write Logs higher or same level to the Log-File (1 = Logs, 2 = Warning, 3 = Errors)
* `debug`: Adds the File & Line from which the log was added.
Logging everything can decrease performance, so I would recommend only logging warnings.


## Fine-Tuning the Server #2 - Mailserver - NodeJS and Mariadb
Some Elements on the Frontend like the Mailserver Configuration can only be done in the mysql server directly:
```
Insert into mailserver_settings values ("Host","Port","true/false for SSL/no SSL","Username","Password")
```
Don't add multiple Mailservers, only the first one will be used.

## Fine-Tuning the Server #3 - Multiple Servers - NodeJS and Mariadb
Multiple servers with linked databases are supported.
On my current setup, I use a Master-Slave Replication. It is also possible to use a Master-Master Replication and add the other server also as an `masternodes` in the Webinterface.

Master-Slave-Installation
Great tutorial under: https://mariadb.com/kb/en/setting-up-replication/

## Final Words
The Front-End is a little bit of a mess and requires a complete overhaul. The Project is a One-Man-Show and it takes some time to add everything. If you find any Bugs, Errors or Vulnerabilities, please let me know!