function adminmenu() {
	window.history.replaceState("object or string", "Page Title", `/admin`);
	websiteloader("/website/admin/admin.html")
		.then(async response => {
			document.getElementById("mainbody").innerHTML = response;
		});
}


async function admin_dnsupstreammenu() {
	//Get Error when not logged in
	if (account === null || account.isadmin === false) {
		websiteloader("/website/forbidden.html")
			.then(async response => {
				document.getElementById("mainbody").innerHTML = response;
			});
		return
	}
	window.history.replaceState("object or string", "Page Title", `/admin`);
	const promise1 = websiteloader("/website/admin/admin_dns_upstream_servers_main.html");
	const promise2 = websiteloader("/website/admin/admin_dns_upstream_servers_subbody.html");
	const promise3 = queryhandler({ "task": "dns_upstream_servers_list", "apikey": account.api }, "/adminapi/", "POST", true)
	Promise.all([promise1, promise2, promise3]).then((response) => {

		document.getElementById("mainbody2").innerHTML = response[0];

		for (let i = 0; i < response[2].data.length; i++) {

			if (response[2].data[i].lasttimebanned != null) {
				const date = new Date(parseInt(response[2].data[i].lasttimebanned));
				response[2].data[i].lasttimebanned_local = date.toLocaleString();
			}
			else {
				response[2].data[i].lasttimebanned_local = "Never"
			}

			let doc = document.implementation.createHTMLDocument();
			doc.documentElement.innerHTML = response[1];
			doc.getElementById("id").textContent  = response[2].data[i].id
			if (response[2].data[i].enabled == 1) {
				doc.getElementById("enabledbtn").style.backgroundColor = 'green';
			}
			else {
				doc.getElementById("enabledbtn").style.backgroundColor = 'red';
			}
			doc.getElementById("address").textContent  = response[2].data[i].address
			doc.getElementById("lasttimebanned").textContent  = response[2].data[i].lasttimebanned_local
			doc.getElementById("amountbanned").textContent  = response[2].data[i].amountbanned


			//Rewrite IDs to prevent doubles!!!
			doc.getElementById("id").id = `id${i}`
			doc.getElementById("enabledbtn").id = `enabledbtn${i}`
			doc.getElementById("address").id = `address${i}`
			doc.getElementById("lasttimebanned").id = `lasttimebanned${i}`
			doc.getElementById("deletedomainbtn").id = `deletedomainbtn${i}`

			//
			//Write functions of buttons
			//


			//Enabled-Button
			var button_element = doc.getElementById(`enabledbtn${i}`)
			var onclick = button_element.getAttribute("onclick");
			if (typeof (onclick) != "function") {
				button_element.setAttribute('onclick', `admin_dns_upstream_changer(${i},"dns_upstream_servers_enabledisable")`);
			} else {
				button_element.onclick = function () {
					dns_changer(i, "dns_upstream_servers_enabledisable")
				};
			}

			//Deletebutton
			var button_element = doc.getElementById(`deletedomainbtn${i}`)
			var onclick = button_element.getAttribute("onclick");
			if (typeof (onclick) != "function") {
				button_element.setAttribute('onclick', `admin_dns_upstream_changer(${i},"dns_upstream_servers_delete")`);
			} else {
				button_element.onclick = function () {
					dns_changer(i, "dns_upstream_servers_delete")
				};
			}

			document.getElementById("subbody").append(doc.documentElement)
		}

	});
}

function admin_dns_upstream_changer(i, task) {
	if (task == "dns_upstream_servers_enabledisable") {
		let address = document.getElementById(`address${i}`).textContent 
		let id = document.getElementById(`id${i}`).textContent 
		var funktion = function (id, callback) {
			return new Promise((resolve, reject) => {
				var data = { "task": "dns_upstream_servers_enabledisable", "data": {"id": id}, "apikey": account.api }
				queryhandler(data, "/adminapi/", "POST", true).then(async response => {
					if (callback && typeof callback == 'function') {
						await callback("", response);
						resolve();
					}
					else {
						resolve(response);
					}
					return;
				}).catch(async err => {
					if (callback && typeof callback == 'function') {
						await callback(err, "");
						resolve();
					}
					else {
						reject(err);
					}
					return;
				})
			});
		}

		funktion(id, function (err, res) {
			if (err) {
				document.getElementById("dnserror").textContent  = `Error during operation: ${err.msg}`
			}
			else {
				document.getElementById("dnserror").textContent  = `${address} was successfully updated. success:${res.success}`;
				admin_dnsupstreammenu()
			}
		});
	}

	else if (task == "dns_upstream_servers_delete") {
		let address = document.getElementById(`address${i}`).textContent 
		let id = document.getElementById(`id${i}`).textContent 
		var funktion = function (id, callback) {
			return new Promise((resolve, reject) => {
				var data = { "task": "dns_upstream_servers_delete", "data": {"id": id}, "apikey": account.api }
				queryhandler(data, "/adminapi/", "POST", true).then(async response => {
					if (callback && typeof callback == 'function') {
						await callback("", response);
						resolve();
					}
					else {
						resolve(response);
					}
					return;
				}).catch(async err => {
					if (callback && typeof callback == 'function') {
						await callback(err, "");
						resolve();
					}
					else {
						reject(err);
					}
					return;
				})
			});
		}

		funktion(id, function (err, res) {
			if (err) {
				document.getElementById("dnserror").textContent  = `Error during operation: ${err.msg}`
			}
			else {
				document.getElementById("dnserror").textContent  = `${address} was successfully updated. success:${res.success}`;
				admin_dnsupstreammenu()
			}
		});
	}

	else if (task == "dns_upstream_servers_create") {
		let address = document.getElementById(`serverinput`).value
		var funktion = function (address, callback) {
			return new Promise((resolve, reject) => {
				var data = { "task": "dns_upstream_servers_create", "data": {"address": address}, "apikey": account.api }
				queryhandler(data, "/adminapi/", "POST", true).then(async response => {
					if (callback && typeof callback == 'function') {
						await callback("", response);
						resolve();
					}
					else {
						resolve(response);
					}
					return;
				}).catch(async err => {
					if (callback && typeof callback == 'function') {
						await callback(err, "");
						resolve();
					}
					else {
						reject(err);
					}
					return;
				})
			});
		}

		funktion(address, function (err, res) {

			if (err) {
				document.getElementById("dnserror").textContent  = `Error during operation: ${err.msg}`
			}
			else {
				document.getElementById("dnserror").textContent  = `${address} was successfully created. success:${res.success}`;
				admin_dnsupstreammenu()
			}
		});
	}


}

async function admin_usermenu() {
	//Get Error when not logged in
	if (account === null || account.isadmin === false) {
		websiteloader("/website/forbidden.html")
			.then(async response => {
				document.getElementById("mainbody").innerHTML = response;
			});
		return
	}
	const promise1 = websiteloader("/website/admin/admin_usermanagement_main.html");
	const promise2 = websiteloader("/website/admin/admin_usermanagement_smallmenu.html");
	const promise3 = queryhandler({ "task": "user_management_list_all", "apikey": account.api }, "/adminapi/", "POST", true);
	Promise.all([promise1, promise2, promise3]).then((response) => {

		document.getElementById("mainbody2").innerHTML = response[0];

		for (let i = 0; i < response[2].data.length; i++) {

			let doc = document.implementation.createHTMLDocument();
			doc.documentElement.innerHTML = response[1];


			doc.getElementById("mailaddressM").textContent  = response[2].data[i].mailaddress
			doc.getElementById("idM").textContent  = response[2].data[i].id
			doc.getElementById("isadminM").textContent  = response[2].data[i].isadmin
			doc.getElementById("isactiveM").textContent  = response[2].data[i].isactive
			if (response[2].data[i].isactive !== 1) {
				doc.getElementById(`singleusermenuM`).style.backgroundColor = 'grey';
			}




			//Rewrite IDs to prevent doubles!!!
			doc.getElementById("singleusermenuM").id = `singleusermenuM${response[2].data[i].id}`
			doc.getElementById("mailaddressM").id = `mailaddressM${response[2].data[i].id}`
			doc.getElementById("idM").id = `idM${response[2].data[i].id}`
			doc.getElementById("isadminM").id = `isadminM${response[2].data[i].id}`
			doc.getElementById("isactiveM").id = `isactiveM${response[2].data[i].id}`


			//
			//Write functions of buttons
			//


			//Open profile editor (admin_user_single_user_menu)
			var button_element = doc.getElementById(`singleusermenuM${response[2].data[i].id}`)
			var onclick = button_element.getAttribute("onclick");
			if (typeof (onclick) != "function") {
				button_element.setAttribute('onclick', `admin_user_single_user_menu(${response[2].data[i].id})`);
			} else {
				button_element.onclick = function () {
					admin_user_single_user_menu(response[2].data[i])
				};
			}


			//Inactive Accounts to the back of the site
			if (!response[2].data[i].isactive) {
				document.getElementById("subbody").innerHTML = document.getElementById("subbody").innerHTML + doc.documentElement.innerHTML;
			}
			else {
				document.getElementById("subbody").innerHTML = doc.documentElement.innerHTML + document.getElementById("subbody").innerHTML
			}


		}
	});
}

async function admin_user_single_user_menu(id) {
	const promise1 = websiteloader("/website/admin/admin_usermangement_single_user_body.html");
	const promise2 = queryhandler({ "task": "user_management_list_id", "apikey": account.api, data:{"id": id} }, "/adminapi/", "POST", true)
	const promise3 = websiteloader("/website/admin/admin_usermangement_single_user_dnsentry.html");
	Promise.all([promise1, promise2, promise3]).then((response) => {



		var render_user = function (response) {
			let doc = document.implementation.createHTMLDocument();
			doc.documentElement.innerHTML = response[0];

			//Set Data
			doc.getElementById("headline").textContent  = `Profile Editor: ${response[1].data[1].mailaddress}`
			doc.getElementById("id").textContent  = response[1].data[1].id
			doc.getElementById("mailaddress").setAttribute("value", response[1].data[1].mailaddress)
			if (response[1].data[0].length) {
				doc.getElementById("lastloginipv4").textContent  = response[1].data[0][response[1].data[0].length - 1].ipv4
				doc.getElementById("lastloginipv6").textContent  = response[1].data[0][response[1].data[0].length - 1].ipv6
				doc.getElementById("lastlogintime").textContent  = response[1].data[0][response[1].data[0].length - 1].logintime
			}
			else {
				doc.getElementById("lastloginipv4").textContent  = "No Session available"
				doc.getElementById("lastloginipv6").textContent  = "No Session available"
				doc.getElementById("lastlogintime").textContent  = "No Session available"
			}
			doc.getElementById("isadmin").setAttribute("value", response[1].data[1].isadmin)
			doc.getElementById("isactive").setAttribute("value", response[1].data[1].isactive)
			doc.getElementById("confirmedmail").setAttribute("value", response[1].data[1].confirmedmail)
			doc.getElementById("maxentries").setAttribute("value", response[1].data[1].maxentries)
			doc.getElementById("maxdomains").setAttribute("value", response[1].data[1].maxdomains)
			doc.getElementById("registrationdate").textContent  = response[1].data[1].registrationdate

			//Rewrite IDs to prevent doubles!!!
			doc.getElementById("exitbtn").id = `exitbtn${response[1].data[1].id}`
			doc.getElementById("savebtn").id = `savebtn${response[1].data[1].id}`
			doc.getElementById("headline").id = `headline${response[1].data[1].id}`
			doc.getElementById("id").id = `id${response[1].data[1].id}`
			doc.getElementById("mailaddress").id = `mailaddress${response[1].data[1].id}`
			doc.getElementById("passwordset").id = `passwordset${response[1].data[1].id}`
			doc.getElementById("lastloginipv4").id = `ipv4${response[1].data[1].id}`
			doc.getElementById("lastloginipv6").id = `ipv6${response[1].data[1].id}`
			doc.getElementById("isadmin").id = `isadmin${response[1].data[1].id}`
			doc.getElementById("confirmedmail").id = `confirmedmail${response[1].data[1].id}`
			doc.getElementById("isactive").id = `isactive${response[1].data[1].id}`
			doc.getElementById("maxentries").id = `maxentries${response[1].data[1].id}`
			doc.getElementById("maxdomains").id = `maxdomains${response[1].data[1].id}`
			doc.getElementById("registrationdate").id = `registrationdate${response[1].data[1].id}`
			doc.getElementById("lastlogintime").id = `lastlogintime${response[1].data[1].id}`
			doc.getElementById("usererror").id = `usererror${response[1].data[1].id}`



			//
			//Write functions of buttons
			//

			//Exit-Button
			doc.getElementById(`exitbtn${response[1].data[1].id}`).setAttribute("onclick", `document.getElementById("draggablecontainer-main").innerHTML = ''`)
			//Save-Button
			doc.querySelector(`#savebtn${response[1].data[1].id}`).addEventListener('click', (event) => {
				event.preventDefault();
				userid = document.querySelector('[id^="draggablecontainer-main"]').querySelector('[id^="id"]').innerHTML
				var userupdate = {
					"id": userid,
					"mailaddress": document.getElementById(`mailaddress${userid}`).value,
					"password": document.getElementById(`passwordset${userid}`).value,
					"newpassword": document.getElementById(`passwordset${userid}`).value === "" ? false : true,
					"isadmin": document.getElementById(`isadmin${userid}`).value,
					"isactive": document.getElementById(`isactive${userid}`).value,
					"confirmedmail": document.getElementById(`confirmedmail${userid}`).value,
					"maxentries": document.getElementById(`maxentries${userid}`).value,
					"maxdomains": document.getElementById(`maxdomains${userid}`).value
				}
				savebutton(userupdate)
			});


			var savebutton = function (userupdate) {
				var data = { "task": "user_management_update_user", "data": userupdate, "apikey": account.api }

				queryhandler(data, "/adminapi", "POST", true).then(async response => {
					document.getElementById(`usererror${userupdate.id}`).textContent  = `Update OK`;
					admin_usermenu()

				}).catch(async err => {
					document.getElementById(`usererror${userupdate.id}`).textContent  = `Error during operation: ${err.msg}`
				})
			}


			//
			//Positioning the window
			//

			//Find an open window to use the same position before closing the old and opening the new site
			if (document.querySelector('[id^="draggablecontainer-main"]')) {
				doc.getElementById(`draggablecontainer-main`).style.top = document.querySelector('[id^="draggablecontainer-main"]').style.top
				doc.getElementById(`draggablecontainer-main`).style.left = document.querySelector('[id^="draggablecontainer-main"]').style.left
			}



			//Now put everything online on the site and make the windows draggable
			document.getElementById("subbody_popupwindow").innerHTML = ""
			document.getElementById("subbody_popupwindow").appendChild(doc.documentElement)
			//Make Div draggable
			dragElement(document.getElementById(`draggablecontainer-main`));



		}
		render_user(response)
	})
		.catch(function (err) {
			document.getElementById("dnserror").textContent  = `Error during operation: ${err.msg}`
		});
}

async function admin_logsmenu() {
	websiteloader("/website/admin/admin_dnslog_main.html")
		.then(async response => {
			document.getElementById("mainbody2").innerHTML = response;

		});
}

async function admin_bubbledns_serversmenu() {

	var render_items_real = function (response) {
		for (let i = 0; i < response[2].data[0].length; i++) {
			let doc = document.implementation.createHTMLDocument();
			doc.documentElement.innerHTML = response[1];

			//Setting Values
			doc.getElementById("bubbledns_subdomain").textContent  = response[2].data[0][i].subdomainname
			doc.getElementById("bubbledns_public_ipv4").textContent  = response[2].data[0][i].public_ipv4
			doc.getElementById("bubbledns_public_ipv6").textContent  = response[2].data[0][i].public_ipv6
			doc.getElementById("bubbledns_synctest").textContent  = response[2].data[0][i].synctest
			doc.getElementById("bubbledns_masternode").textContent  = response[2].data[0][i].masternode


			//Rewrite IDs to prevent doubles!!!
			doc.getElementById("bubbledns_subdomain").id = `bubbledns_subdomainR${response[2].data[0][i].id}`
			doc.getElementById("bubbledns_public_ipv4").id = `bubbledns_public_ipv4R${response[2].data[0][i].id}`
			doc.getElementById("bubbledns_public_ipv6").id = `bubbledns_public_ipv6R${response[2].data[0][i].id}`
			doc.getElementById("bubbledns_synctest").id = `bubbledns_synctestR${response[2].data[0][i].id}`
			doc.getElementById("bubbledns_masternode").id = `bubbledns_masternodeR${response[2].data[0][i].id}`
			doc.getElementById("singlebubblednsserver").id = `singlebubblednsserverR${response[2].data[0][i].id}`



			//
			//Write functions of buttons
			//


			// Add click event listener
			//Open bubbledns_server editor (admin_user_single_user_menu)
			doc.querySelector(`#singlebubblednsserverR${response[2].data[0][i].id}`).addEventListener('click', (event) => {
				event.preventDefault();
				render_real_single_menu(response[2].data[0][i], response[3])
			});


			document.getElementById("subbodyR").appendChild(doc.documentElement)
		}


		//Create new Bubbledns-Server
		let doc = document.implementation.createHTMLDocument();
		doc.documentElement.innerHTML = response[1];
		let bubblednsentry = {
			"id": null,
			"subdomainname": "",
			"public_ipv4": "",
			"synctest": 0,
			"public_ipv6": "",
			"internal_ipv4":"",
			"internal_ipv6":"",
			"enabled_dns": "",
			"enabled_web": "",
			"masternode": ""
		}
		doc.getElementById("bubbledns_subdomain").textContent  = "NEW"
		doc.getElementById("bubbledns_public_ipv4").textContent  = ""
		doc.getElementById("bubbledns_public_ipv6").textContent  = ""
		doc.getElementById("bubbledns_synctest").textContent  = ""
		doc.getElementById("bubbledns_masternode").textContent  = ""

		//Rewrite IDs to prevent doubles!!!
		doc.getElementById("bubbledns_subdomain").id = `bubbledns_subdomainNEW`
		doc.getElementById("bubbledns_public_ipv4").id = `bubbledns_public_ipv4NEW`
		doc.getElementById("bubbledns_public_ipv6").id = `bubbledns_public_ipv6NEW`
		doc.getElementById("bubbledns_synctest").id = `bubbledns_synctestNEW`
		doc.getElementById("bubbledns_masternode").id = `bubbledns_masternodeNEW`
		doc.getElementById("singlebubblednsserver").id = `singlebubblednsserverNEW`


		//Open bubbledns_server editor (admin_user_single_user_menu)
		doc.querySelector(`#singlebubblednsserverNEW`).addEventListener('click', (event) => {
			event.preventDefault();
			render_real_single_menu(bubblednsentry, response[3])
		});

		document.getElementById("subbodyR").appendChild(doc.documentElement)

	}

	var render_real_single_menu = function (bubblednsentry, innerHTML) {

		let doc = document.implementation.createHTMLDocument();
		doc.documentElement.innerHTML = innerHTML;


		//Setting Values
		if (bubblednsentry.id !== null) {
			doc.getElementById("headline").textContent  = `Editing existing: ${bubblednsentry.id}`
		}
		else {
			doc.getElementById("headline").textContent  = `Add new BubbleDNS-Server`
		}
		doc.getElementById("id").textContent  = bubblednsentry.id
		doc.getElementById("synctest").textContent  = bubblednsentry.synctest
		doc.getElementById("subdomainname").setAttribute("value", bubblednsentry.subdomainname)
		doc.getElementById("public_ipv4").setAttribute("value", bubblednsentry.public_ipv4)
		doc.getElementById("public_ipv6").setAttribute("value", bubblednsentry.public_ipv6)
		doc.getElementById("internal_ipv4").setAttribute("value", bubblednsentry.internal_ipv4)
		doc.getElementById("internal_ipv6").setAttribute("value", bubblednsentry.internal_ipv6)
		doc.getElementById("enableddns").setAttribute("value", bubblednsentry.enabled_dns)
		doc.getElementById("enabledweb").setAttribute("value", bubblednsentry.enabled_web)
		doc.getElementById("masternode").setAttribute("value", bubblednsentry.masternode)






		//
		//Write functions of buttons
		//


		// Add click event listener
		//Open bubbledns_server editor (admin_user_single_user_menu)
		doc.querySelector(`#synctestbutton`).addEventListener('click', (event) => {
			event.preventDefault();
			do_synctest(bubblednsentry)
		});
		//Open bubbledns_server editor (admin_user_single_user_menu)
		doc.querySelector(`#savebtn`).addEventListener('click', (event) => {
			event.preventDefault();
			var doc = document.querySelector('[id^="draggablecontainer-main"]')
			var bubblednsentry = {
				"id": doc.querySelector("#id").textContent ,
				"subdomainname": doc.querySelector('#subdomainname').value,
				"public_ipv4": doc.querySelector("#public_ipv4").value,
				"public_ipv6": doc.querySelector("#public_ipv6").value,
				"internal_ipv4": doc.querySelector("#internal_ipv4").value,
				"internal_ipv6": doc.querySelector("#internal_ipv6").value,
				"enabled_dns": doc.querySelector("#enableddns").value,
				"enabled_web": doc.querySelector("#enabledweb").value,
				"masternode": doc.querySelector("#masternode").value,
				"virtual": false,
			}
			do_save(bubblednsentry)
		});

		//Open bubbledns_server editor (admin_user_single_user_menu)
		doc.querySelector(`#deletebtn`).addEventListener('click', (event) => {
			event.preventDefault();
			do_delete(bubblednsentry)
		});


		//Exit-Button
		doc.getElementById(`exitbtn`).setAttribute("onclick", `document.getElementById("draggablecontainer-main").innerHTML = ''`)



		//
		//Positioning the window
		//

		//Find an open window to use the same position before closing the old and opening the new site
		if (document.querySelector('[id^="draggablecontainer-main"]')) {
			doc.getElementById(`draggablecontainer-main`).style.top = document.querySelector('[id^="draggablecontainer-main"]').style.top
			doc.getElementById(`draggablecontainer-main`).style.left = document.querySelector('[id^="draggablecontainer-main"]').style.left
		}
		//Now put everything online on the site and make the windows draggable
		document.getElementById("subbody_popupwindow").innerHTML = ""
		document.getElementById("subbody_popupwindow").appendChild(doc.documentElement)
		//Make Div draggable
		dragElement(document.getElementById(`draggablecontainer-main`));


	}

	var render_items_virtual = function (response) {
		for (let i = 0; i < response[2].data[1].length; i++) {
			let doc = document.implementation.createHTMLDocument();
			doc.documentElement.innerHTML = response[4];


			//Setting Values
			doc.getElementById("bubbledns_subdomain").textContent  = response[2].data[1][i].subdomainname
			doc.getElementById("bubbledns_bubblednsserverid").textContent  = response[2].data[1][i].bubblednsserverid



			//Rewrite IDs to prevent doubles!!!
			doc.getElementById("bubbledns_subdomain").id = `bubbledns_subdomainV${response[2].data[1][i].id}`
			doc.getElementById("bubbledns_bubblednsserverid").id = `bubbledns_bubblednsserveridV${response[2].data[1][i].id}`
			doc.getElementById("singlebubblednsserver").id = `singlebubblednsserverV${response[2].data[1][i].id}`


			//
			//Write functions of buttons
			//



			// Add click event listener
			//Open bubbledns_server editor (admin_user_single_user_menu)
			
			doc.querySelector(`#singlebubblednsserverV${response[2].data[1][i].id}`).addEventListener('click', (event) => {
				event.preventDefault();
				render_virtual_single_menu(response[2].data[1][i], response[5])
			});


			document.getElementById("subbodyV").appendChild(doc.documentElement)
		}


		//Create new Bubbledns-Server
		let doc = document.implementation.createHTMLDocument();
		doc.documentElement.innerHTML = response[4];
		let bubblednsentry = {
			"id": null,
			"subdomainname": "",
			"bubblednsserverid": "",
		}
		doc.getElementById("bubbledns_subdomain").textContent  = "NEW"
		doc.getElementById("bubbledns_bubblednsserverid").textContent  = ""

		//Rewrite IDs to prevent doubles!!!
		doc.getElementById("bubbledns_subdomain").id = `bubbledns_subdomainNEW`
		doc.getElementById("bubbledns_bubblednsserverid").id = `bubbledns_bubblednsserveridVNEW`
		doc.getElementById("singlebubblednsserver").id = `singlebubblednsserverVNEW`


		//Open bubbledns_server editor (admin_user_single_user_menu)
		doc.querySelector(`#singlebubblednsserverVNEW`).addEventListener('click', (event) => {
			event.preventDefault();
			render_virtual_single_menu(bubblednsentry, response[5])
		});

		document.getElementById("subbodyV").appendChild(doc.documentElement)

	}

	var render_virtual_single_menu = function (bubblednsentry, innerHTML) {

		let doc = document.implementation.createHTMLDocument();
		doc.documentElement.innerHTML = innerHTML;

		console.log(bubblednsentry)


		//Setting Values
		if (bubblednsentry.id !== null) {
			doc.getElementById("headline").textContent  = `Editing existing: ${bubblednsentry.id}`
		}
		else {
			doc.getElementById("headline").textContent  = `Add new Virtual BubbleDNS-Server`
		}
		doc.getElementById("id").textContent  = bubblednsentry.id
		doc.getElementById("subdomainname").setAttribute("value", bubblednsentry.subdomainname)
		doc.getElementById("bubblednsserverid").setAttribute("value", bubblednsentry.bubblednsserverid)





		//
		//Write functions of buttons
		//


		// Add click event listener
		//Open bubbledns_server editor (admin_user_single_user_menu)
		doc.querySelector(`#savebtn`).addEventListener('click', (event) => {
			event.preventDefault();
			var doc = document.querySelector('[id^="draggablecontainer-main"]')
			var bubblednsentry = {
				"id": doc.querySelector("#id").textContent ,
				"subdomainname": doc.querySelector('#subdomainname').value,
				"bubblednsserverid": doc.querySelector('#bubblednsserverid').value,
				"virtual": true,
			}
			do_save(bubblednsentry)
		});

		//Open bubbledns_server editor (admin_user_single_user_menu)
		doc.querySelector(`#deletebtn`).addEventListener('click', (event) => {
			event.preventDefault();
			do_delete(bubblednsentry)
		});


		//Exit-Button
		doc.getElementById(`exitbtn`).setAttribute("onclick", `document.getElementById("draggablecontainer-main").innerHTML = ''`)



		//
		//Positioning the window
		//

		//Find an open window to use the same position before closing the old and opening the new site
		if (document.querySelector('[id^="draggablecontainer-main"]')) {
			doc.getElementById(`draggablecontainer-main`).style.top = document.querySelector('[id^="draggablecontainer-main"]').style.top
			doc.getElementById(`draggablecontainer-main`).style.left = document.querySelector('[id^="draggablecontainer-main"]').style.left
		}
		//Now put everything online on the site and make the windows draggable
		document.getElementById("subbody_popupwindow").innerHTML = ""
		document.getElementById("subbody_popupwindow").appendChild(doc.documentElement)
		//Make Div draggable
		dragElement(document.getElementById(`draggablecontainer-main`));


	}

	var do_synctest = function (bubblednsentry) {
		var data = { "task": "bubbledns_servers_synctest", "data": { "id": bubblednsentry.id }, "apikey": account.api }

		queryhandler(data, "/adminapi", "POST", true).then(async response => {
			document.getElementById(`usererror`).textContent  = `Update OK`;
			admin_bubbledns_serversmenu()

		}).catch(async err => {
			document.getElementById(`usererror`).textContent  = `Error during operation: ${err.msg}`
		})
	}

	var do_save = function (bubblednsentry) {
		if (bubblednsentry.id == "") {
			var data = { "task": "bubbledns_servers_create", "data": bubblednsentry, "apikey": account.api }
		}
		else {
			var data = { "task": "bubbledns_servers_update", "data": bubblednsentry, "apikey": account.api }
		}
		queryhandler(data, "/adminapi", "POST", true).then(async response => {
			document.getElementById(`usererror`).textContent  = `Update OK`;
			admin_bubbledns_serversmenu()

		}).catch(async err => {
			document.getElementById(`usererror`).textContent  = `Error during operation: ${err.msg}`
		})
	}

	var do_delete = function (bubblednsentry) {
		var data = { "task": "bubbledns_servers_delete", "data": bubblednsentry, "apikey": account.api }

		queryhandler(data, "/adminapi", "POST", true).then(async response => {
			document.getElementById(`usererror`).textContent  = `Update OK`;
			admin_bubbledns_serversmenu()

		}).catch(async err => {
			document.getElementById(`usererror`).textContent  = `Error during operation: ${err.msg}`
		})
	}


	const promise1 = websiteloader("/website/admin/admin_bubbledns_servers_main.html");
	const promise2 = websiteloader("/website/admin/admin_bubbledns_servers_real_smallmenu.html");
	const promise3 = queryhandler({ "task": "bubbledns_servers_list", "apikey": account.api }, "/adminapi/", "POST", true);
	const promise4 = websiteloader("/website/admin/admin_bubbledns_servers_real_single_body.html");
	const promise5 = websiteloader("/website/admin/admin_bubbledns_servers_virtual_smallmenu.html");
	const promise6 = websiteloader("/website/admin/admin_bubbledns_servers_virtual_single_body.html");
	Promise.all([promise1, promise2, promise3, promise4,promise5,promise6]).then((response) => {
		document.getElementById("mainbody2").innerHTML = response[0];
		render_items_real(response)
		render_items_virtual(response)





	})
}