
//+LOGIN
async function loginmenu() {
	window.history.replaceState("object or string", "Page Title", `/login`);
	websiteloader("/website/login.html")
		.then(async response => {
			document.getElementById("mainbody").innerHTML = response;
		});

}

function login(mailaddress, password, callback) {
	return new Promise((resolve, reject) => {
		var data = { "task": "auth_login", data:{"mailaddress": mailaddress, "password": password} }
		queryhandler(data, "/accapi", "POST", true).then(async response => {
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

function req_passwordreset(mailaddress, callback) {
	return new Promise((resolve, reject) => {
		var data = { "task": "req_passwordreset", data:{"mailaddress": mailaddress} }
		queryhandler(data, "/accapi", "POST", true).then(async response => {
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

function loginwithcookie(callback) //Fertig
{
	return new Promise(async (resolve, reject) => {

		let cookie = getCookie("cookie");
		if (cookie === undefined) {
			let error = `No cookie found!`
			if (callback && typeof callback == 'function') {
				await callback(error, "");
				resolve();
			}
			else {
				reject(error);
			}
			return;
		}
		var data = { "cookie": cookie }
		await queryhandler(data, "/autologin/", "POST", true)
			.then(async response => {
				if (callback && typeof callback == 'function') {
					await callback("", response.data);
					resolve();
				}
				else {
					resolve(response.data);
				}
				return;
			})
			.catch(async err => {
				if (callback && typeof callback == 'function') {
					await callback(err, "");
					resolve();
				}
				else {
					reject(err);
				}
				return;
			});
	});
}

function getCookie(name) //Fertig 
{
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop().split(';').shift();
}

//-LOGIN

//+LOGOUT
function logout() //fertig
{
	document.cookie = "cookie=; Expires=Thu, 01 Jan 1970 00:00:01 GMT;"
	window.location.reload();
}
//-LOGOUT

//+Register
async function registermenu() {
	window.history.replaceState("object or string", "Page Title", `/register`);
	websiteloader("/website/register.html")
		.then(async response => {
			document.getElementById("mainbody").innerHTML = response;
		});

}

function register(mailaddress, password1, password2, callback) {
	return new Promise((resolve, reject) => {
		var data = { "task": "auth_register", data:{"mailaddress": mailaddress, "password1": password1, "password2": password2} }
		queryhandler(data, "/accapi", "POST", true).then(async response => {
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
//-Register

//+resetpasswd
async function resetpasswdmenu() {
	console.log("hi")
	websiteloader("/website/reset_passwd.html")
		.then(async response => {
			document.getElementById("mainbody").innerHTML = response;
		});

}

function resetpasswd(password1, password2, callback) {
	
	return new Promise((resolve, reject) => {

		// Get the query string from the URL
		const urlParams = new URLSearchParams(window.location.search);

		// Extract the value of 'keytext' parameter
		const keytext = urlParams.get('keytext');

		var data = {"keytext":keytext,"password1":password1,"password2":password2}
		
		queryhandler(data, "/confirm", "GET", true).then(async response => {
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
//-resetpasswd

//+DNS-Entries
async function dnsmenu() {
	//Get Error when not logged in
	if (account === null) {
		websiteloader("/website/forbidden.html")
			.then(async response => {
				document.getElementById("mainbody").innerHTML = response;
			});
		return
	}

	window.history.replaceState("object or string", "Page Title", `/dns`);
	const promise1 = websiteloader("/website/dns.html");
	const promise2 = websiteloader("/website/dns_subbody.html");
	const promise3 = queryhandler({ "task": "domain_list_owner", "apikey": account.api }, "/dnsapi", "POST", true)
	const promise4 = queryhandler({ "task": "domain_list_shared", "apikey": account.api }, "/dnsapi", "POST", true)
	const promise5 = websiteloader("/website/dns_single_menu.html");
	const promise6 = queryhandler({ "task": "dns_get_allowed_dnstype_entries", "apikey": account.api }, "/dnsapi", "POST", true)
	Promise.all([promise1, promise2, promise3, promise4, promise5, promise6]).then((response) => {

		//If the domainselect exists currently, set to same value as previous
		if (document.getElementById("domainselect")) {
			var select_value = document.getElementById("domainselect").value
		}
		var alldomains = response[2].data.concat(response[3].data)
		document.getElementById("mainbody").innerHTML = response[0];


		//Setting the select menu-items
		for (let i = 0; i < alldomains.length; i++) {
			let optionElement = document.createElement("option");
			optionElement.value = alldomains[i].id;
			optionElement.text = alldomains[i].domainname;
			document.getElementById("domainselect").appendChild(optionElement);
			if (select_value == optionElement.value) {
				optionElement.selected = true;
			}
		}

		//EventListener that if the input of the select menu changed, the subdomains get rerenderred
		document.getElementById("domainselect").addEventListener("change", function () { render_items(response, document.getElementById("domainselect").value) });

		var render_items = function (response, renderdnsdomainid) {
			document.getElementById("subbody").innerHTML = ""
			for (let i = 0; i < alldomains.length; i++) {
				for (let u = 0; u < alldomains[i].dns_list.length; u++) {
					if ((alldomains[i].id == renderdnsdomainid) || renderdnsdomainid == "null") {
						let doc = document.implementation.createHTMLDocument();
						doc.documentElement.innerHTML = response[1];
						doc.getElementById("dnsentryname").textContent  = alldomains[i].dns_list[u].entryname
						doc.getElementById("dnsentrytype").textContent  = alldomains[i].dns_list[u].entrytype
						doc.getElementById("dnsentryvalue").textContent  = alldomains[i].dns_list[u].entryvalue
						doc.getElementById("lastchanged").textContent  = alldomains[i].dns_list[u].lastchangedtime


						//Rewrite IDs to prevent doubles!!!
						doc.getElementById("dnsentryname").id = `dnsentryname${alldomains[i].id}_${alldomains[i].dns_list[u].id}`
						doc.getElementById("dnsentrytype").id = `dnsentrytype${alldomains[i].id}_${alldomains[i].dns_list[u].id}`
						doc.getElementById("dnsentryvalue").id = `dnsentryvalue${alldomains[i].id}_${alldomains[i].dns_list[u].id}`
						doc.getElementById("lastchanged").id = `lastchanged${alldomains[i].id}_${alldomains[i].dns_list[u].id}`
						doc.getElementById("editentrybutton").id = `editentrybutton${alldomains[i].id}_${alldomains[i].dns_list[u].id}`
						doc.getElementById("deleteentrybutton").id = `deleteentrybutton${alldomains[i].id}_${alldomains[i].dns_list[u].id}`

						var editentrybutton = function (dnsentry) {
							let drageditor = document.implementation.createHTMLDocument();
							drageditor.documentElement.innerHTML = response[4];
							var allowed_dnstype = function(){
								var is_builtin = alldomains.filter(r => r.builtin == true && r.id == dnsentry.domainid)
								console.log(response[5])
								if(is_builtin.length)
								{
									return response[5].data.bulitin
								}
								else
								{
									return response[5].data.custom
								}
							}()
							render_single_menu(response[4], dnsentry, allowed_dnstype)
						}

						var deleteentrybutton = function (dnsentry) {
							var data = { "task": "dnsentry_delete", data:{"id": dnsentry.id}, "apikey": account.api }
							queryhandler(data, "/dnsapi", "POST", true).then(async response => {
								document.getElementById("dnserror").textContent  = `Update OK`;
								load_site()

							}).catch(async err => {
								document.getElementById("dnserror").textContent  = `Error during operation: ${err.msg}`
							})
						}

						// Add click event listener
						doc.querySelector(`#editentrybutton${alldomains[i].id}_${alldomains[i].dns_list[u].id}`).addEventListener('click', (event) => {
							event.preventDefault();
							editentrybutton(alldomains[i].dns_list[u])
						});
						doc.querySelector(`#deleteentrybutton${alldomains[i].id}_${alldomains[i].dns_list[u].id}`).addEventListener('click', (event) => {
							event.preventDefault();
							deleteentrybutton(alldomains[i].dns_list[u])
						});

						document.getElementById("subbody").appendChild(doc.documentElement)
					}
				}
			}
		}

		var render_single_menu = function (response, dnsentry, allowed_dnstype_entries) {


			let drageditor = document.implementation.createHTMLDocument();
			drageditor.documentElement.innerHTML = response;

			//Setting the select DNS-Entrytypes
			for (let i = 0; i < allowed_dnstype_entries.length; i++) {
				let optionElement = document.createElement("option");
				optionElement.value = allowed_dnstype_entries[i];
				optionElement.text = allowed_dnstype_entries[i];
				drageditor.getElementById("addeditmanu_dnsentrytype").appendChild(optionElement);
				if (dnsentry.entrytype == optionElement.value) {
					optionElement.selected = true;
				}
			}

			if (dnsentry.id) {
				drageditor.getElementById("headline").textContent  = `Editing existing: ${dnsentry.id}`
			}
			else {
				drageditor.getElementById("headline").textContent  = `Add new DNS-Entry`
			}
			drageditor.getElementById("addeditmanu_id").textContent  = dnsentry.id
			drageditor.getElementById("addeditmanu_domainid").textContent  = dnsentry.domainid
			drageditor.getElementById("addeditmanu_dnsentryname").setAttribute("value", dnsentry.entryname)
			drageditor.getElementById("addeditmanu_dnsentryvalue").setAttribute("value", dnsentry.entryvalue)

			//Find an open window to use the same position before closing the old and opening the new site
			if (document.querySelector('#draggablecontainer-main')) {
				drageditor.getElementById(`draggablecontainer-main`).style.top = document.querySelector('#draggablecontainer-main').style.top
				drageditor.getElementById(`draggablecontainer-main`).style.left = document.querySelector('#draggablecontainer-main').style.left
			}
			//Exit-Button
			drageditor.getElementById(`exitbtn`).setAttribute("onclick", `document.getElementById("draggablecontainer-main").innerHTML = ''`)


			// Add click event listener
			drageditor.querySelector(`#savebtn`).addEventListener('click', (event) => {
				event.preventDefault();
				var dnsentry = {
					"domainid": document.getElementById("addeditmanu_domainid").textContent ,
					"id": document.getElementById("addeditmanu_id").textContent ,
					"entryname": document.getElementById("addeditmanu_dnsentryname").value,
					"entrytype": document.getElementById("addeditmanu_dnsentrytype").value,
					"entryvalue": document.getElementById("addeditmanu_dnsentryvalue").value,
				}
				saveentrybutton(dnsentry)
			});

			document.getElementById("subbody_popupwindow").textContent  = ""
			document.getElementById("subbody_popupwindow").appendChild(drageditor.documentElement)
			//Make Div draggable
			dragElement(document.getElementById(`draggablecontainer-main`));

		}

		var addentrybutton = function () {
			let drageditor = document.implementation.createHTMLDocument();
			drageditor.documentElement.innerHTML = response[4];
			var dnsentry = { "id": null, "domainid": JSON.parse((document.getElementById("domainselect").value)), "entryname": "", "entrytype": "", "entryvalue": "" }
			var allowed_dnstype = function(){
				var is_builtin = alldomains.filter(r => r.builtin == true && r.id == dnsentry.domainid)
				console.log(response[5])
				if(is_builtin.length)
				{
					return response[5].data.bulitin
				}
				else
				{
					return response[5].data.custom
				}
			}()
			render_single_menu(response[4], dnsentry, allowed_dnstype)
		}

		var saveentrybutton = function (dnsentry) {
			if (dnsentry.id == "" || dnsentry.id == null) {
				//Neu Anlegen
				var data = { "task": "dnsentry_create", "data":dnsentry, "apikey": account.api }
			}
			else {
				var data = { "task": "dnsentry_update", "data":dnsentry, "apikey": account.api }
			}

			queryhandler(data, "/dnsapi", "POST", true).then(async response => {
				document.getElementById("dnssinglemenuerror").textContent  = `Update OK`;
				load_site()

			}).catch(async err => {
				document.getElementById("dnssinglemenuerror").textContent  = `Error during operation: ${err.msg}`
			})
		}

		document.querySelector(`#addentrybutton`).addEventListener('click', (event) => {
			event.preventDefault();
			addentrybutton()
		});

		if (document.getElementById("domainselect").value != "null") {
			render_items(response, document.getElementById("domainselect").value)
		}
		else {
			//First load, render everything
			render_items(response, "null")
		}
	});
}

//-DNS-Entries

//+DNS-Domains

function dnsdomainsmenu() { //FERTIG
	return new Promise(async (resolve) => {
		window.history.replaceState("object or string", "Page Title", `/dnsdomains`);
		const promise1 = websiteloader("/website/dnsdomains.html");
		const promise2 = queryhandler({ "task": "domain_list_owner", "apikey": account.api }, "/dnsapi", "POST", true)
		const promise3 = queryhandler({ "task": "domain_list_shared", "apikey": account.api }, "/dnsapi", "POST", true)
		Promise.all([promise1, promise2, promise3]).then((response) => {

			document.getElementById("mainbody").innerHTML = response[0];

			var buildlist = function (parentElementId, responseArray, isowner) {
				let ulElement = document.createElement('ul');

				// Special entry for creating a new domain
				if (isowner) {
					ulElement.innerHTML += '<li><a class="head1" onclick="dnsdomainsmenu_editmenu()">Create a new Domain!</a></li>';
				}

				// Loop through response data
				for (let i = 0; i < responseArray.length; i++) {
					// Create the <li> element
					let newdata = document.createElement('li');
					
					// Create the <a> element
					let link = document.createElement('a');
					link.classList.add('head1');  // Add the 'head1' class
					link.id = `dnsdomainsmenu_editmenu${responseArray[i].id}`;  // Set the dynamic ID
				
					// Set the text content safely
					link.textContent = responseArray[i].domainname; // Use textContent to insert domainname securely
				
					// Add click event listener
					link.addEventListener('click', (event) => {
						event.preventDefault();
						dnsdomainsmenu_editmenu(isowner, responseArray[i]); // Call the edit menu function
					});
				
					// Append the link to the <li> element
					newdata.appendChild(link);
				
					// Append the <li> to the parent <ul> element
					ulElement.appendChild(newdata);
				}

				// Assuming you have a parent element with an id where you want to append the ulElement
				let parentElement = document.getElementById(parentElementId);
				parentElement.innerHTML = '';
				parentElement.appendChild(ulElement);
			}

			buildlist("domainselectbody1", response[1].data, true);
			document.getElementById
			buildlist("domainselectbody2", response[2].data, false);
			resolve()
		});
	});
}

function dnsdomainsmenu_editmenu(isowner, domain) {

	//Create new domain
	if ((typeof domain == "undefined") && (typeof ownerid == "undefined")) {
		const promise1 = websiteloader("/website/dnsdomains_createnew.html");
		const promise2 = queryhandler({ "task": "dns_get_bubblednsservers", "apikey": account.api }, "/dnsapi", "POST", true)
		Promise.all([promise1, promise2]).then((response) => {

			let doc = document.implementation.createHTMLDocument();
			doc.documentElement.innerHTML = response[0];

			//Set Data
			doc.getElementById("nameserver1").textContent  = `ns1.*domain*: ${response[1].data.domain[0]} or to the ipv4 / ipv6 ${response[1].data.ip.ipv4[0]} / ${response[1].data.ip.ipv6[0]} `
			doc.getElementById("nameserver2").textContent  = `ns2.*domain*: ${response[1].data.domain[1]} or to the ipv4 / ipv6 ${response[1].data.ip.ipv4[1]} / ${response[1].data.ip.ipv6[1]} `




			var adddomainbtnfunction = function () {
				let domainname = document.getElementById('adddomaininput').value;
				const promise1 = queryhandler({ "task": "domain_create", "apikey": account.api, "data":{"domainname": domainname} }, "/dnsapi", "POST", true)
				Promise.all([promise1]).then(async (response) => {

					if (response[0].success) {
						document.getElementById("dnsdomain_error").textContent  = `Domain ${domainname} was successfully created!`
						await dnsdomainsmenu()
						dnsdomainsmenu_editmenu(true, response[0].data[0])
					}
					else {
						document.getElementById("dnsdomain_error").textContent  = `Error during operation: ${err.msg}`
					}

				})
					.catch(function (err) {
						document.getElementById("dnsdomain_error").textContent  = `Error during operation: ${err.msg}`
					})
			}




			document.getElementById("mainbody2").innerHTML = ""
			document.getElementById("mainbody2").appendChild(doc.documentElement)
			document.getElementById('adddomainbtn').addEventListener('click', adddomainbtnfunction);


		});
	}
	//Edit existing domain
	else if (isowner) {
		const promise1 = websiteloader("/website/dnsdomains_editexisting.html");
		Promise.all([promise1]).then((response) => {
			response = [...response, ...[domain]]

			var render_items = function (response) {
				let doc = document.implementation.createHTMLDocument();
				doc.documentElement.innerHTML = response[0];

				//Set Data
				doc.getElementById("domainname1").textContent  = `Editing "${response[1].domainname}"`
				doc.getElementById("domainname2").textContent  = response[1].domainname
				doc.getElementById("domainid").textContent  = response[1].id
				doc.getElementById("verificationstatus").textContent  = response[1].verified
				if (response[1].verificationdate == null) {
					response[1].verificationdate = "Never"
				}
				doc.getElementById("verificationdate").textContent  = response[1].verificationdate

				if (response[1].lastverificationresult1 == null) {
					response[1].lastverificationresult1 = "Never"
				}
				doc.getElementById("verificationresult1").textContent  = response[1].lastverificationresult1

				if (response[1].lastverificationresult2 == null) {
					response[1].lastverificationresult2 = "Never"
				}
				doc.getElementById("verificationresult2").textContent  = response[1].lastverificationresult2

				//Rewrite IDs to prevent doubles!!!
				doc.getElementById("domainname1").id = `domainname1${response[1].domainname}`
				doc.getElementById("domainname2").id = `domainname2${response[1].domainname}`
				doc.getElementById("domainid").id = `domainid${response[1].id}`
				doc.getElementById("verificationstatus").id = `verificationstatus${response[1].id}`
				doc.getElementById("verificationdate").id = `verificationdate${response[1].id}`
				doc.getElementById("verificationbtn").id = `verificationbtn${response[1].id}`
				doc.getElementById("deletedomainbtn").id = `deletedomainbtn${response[1].id}`
				doc.getElementById("addusershareinput").id = `addusershareinput${response[1].id}`
				doc.getElementById("addusersharebtn").id = `addusersharebtn${response[1].id}`

				var builtsharedlist = function (responseArray) {


					var usersharedelete = function (useridtodelete, domainid) {
						const promise1 = queryhandler({ "task": "domain_share_deleteuser", "apikey": account.api, "data":{"domainid": domainid, "userid": useridtodelete} }, "/dnsapi", "POST", true)
						Promise.all([promise1]).then(async (response) => {

							if (response[0].success) {
								document.getElementById("dnsdomain_error").textContent  = `User ${useridtodelete}was successfully deleted from the share`
								await dnsdomainsmenu()
								dnsdomainsmenu_editmenu(true, response[0].data[0])
							}
							else {
								document.getElementById("dnsdomain_error").textContent  = `Error during operation: ${err.msg}`
							}

						})
							.catch(function (err) {
								document.getElementById("dnsdomain_error").textContent  = `Error during operation: ${err.msg}`
							})
					}

					let ulElement = document.createElement('ul');
					// Loop through response data
for (let i = 0; i < responseArray.shared_list.length; i++) {
    // Create a new <li> element
    let newdata = document.createElement('li');
    
    // Create a new <a> element
    let link = document.createElement('a');
    link.classList.add('head1');  // Add the 'head1' class
    link.id = `dnsdomainsmenu_delshareduserbtn${responseArray.shared_list[i].id}`;  // Dynamically set ID

    // Set the text content (safe) for the mail address
    link.textContent = responseArray.shared_list[i].mailaddress; // Use textContent to insert mailaddress securely

    // Add click event listener to the link
    link.addEventListener('click', (event) => {
        event.preventDefault();
        usersharedelete(responseArray.shared_list[i].id, responseArray.id); // Call the usersharedelete function
    });

    // Append the link to the <li> element
    newdata.appendChild(link);

    // Append the <li> element to the parent <ul> element
    ulElement.appendChild(newdata);
}
					return ulElement;
				}

				var verificationbtnfunction = function (domainid) {

					const promise1 = queryhandler({ "task": "domain_verify", "apikey": account.api, "data":{"id": domainid }}, "/dnsapi", "POST", true)
					Promise.all([promise1]).then(async (response) => {

						if (response[0].success) {
							await dnsdomainsmenu()
							dnsdomainsmenu_editmenu(true, response[0].data[0])
						}
						else {
							document.getElementById("dnsdomain_error").textContent  = `Error during operation: ${err.msg}`
						}

					})
						.catch(function (err) {
							document.getElementById("dnsdomain_error").textContent  = `Error during operation: ${err.msg}`
						})
				}

				var deletedomainbtnfunction = function (domainid) {

					const promise1 = queryhandler({ "task": "domain_delete", "apikey": account.api, "data":{"id": domainid} }, "/dnsapi", "POST", true)
					Promise.all([promise1]).then((response) => {

						if (response[0].success) {
							document.getElementById("dnsdomain_error").textContent  = `Domain was successfully deleted!`
							dnsdomainsmenu()
						}
						else {
							document.getElementById("dnsdomain_error").textContent  = `Error during operation: ${err.msg}`
						}

					})
						.catch(function (err) {
							document.getElementById("dnsdomain_error").textContent  = `Error during operation: ${err.msg}`
						})
				}

				var addusersharebtnfunction = function (domainid, mailaddresstoadd) {

					const promise1 = queryhandler({ "task": "domain_share_adduser", "apikey": account.api, "data":{"domainid": domainid, "mailaddress": mailaddresstoadd} }, "/dnsapi", "POST", true)
					Promise.all([promise1]).then(async function (response) {
						if (response[0].success) {
							document.getElementById("dnsdomain_error").textContent  = `User ${mailaddresstoadd}  was successfully added!`
							await dnsdomainsmenu()
							dnsdomainsmenu_editmenu(true, response[0].data[0])
						}
						else {
							document.getElementById("dnsdomain_error").textContent  = `Error during operation: ${err.msg}`
						}

					})
						.catch(function (err) {
							document.getElementById("dnsdomain_error").textContent  = `Error during operation: ${err.msg}`
						})
				}



				doc.getElementById("sharedtousersbody").appendChild(builtsharedlist(response[1]));
				doc.getElementById(`verificationbtn${response[1].id}`).addEventListener('click', (event) => {
					event.preventDefault();
					verificationbtnfunction(response[1].id)
				});
				doc.getElementById(`deletedomainbtn${response[1].id}`).addEventListener('click', (event) => {
					event.preventDefault();
					deletedomainbtnfunction(response[1].id)
				});
				var addusershareinput = doc.getElementById(`addusershareinput${response[1].id}`)
				doc.getElementById(`addusersharebtn${response[1].id}`).addEventListener('click', (event) => {
					event.preventDefault();
					addusersharebtnfunction(response[1].id, addusershareinput.value)
				});




				document.getElementById("mainbody2").innerHTML = ""
				document.getElementById("mainbody2").appendChild(doc.documentElement)




			}



			var adddomainbtnfunction = function () {
				let domainname = document.getElementById('adddomaininput').value;
				const promise1 = queryhandler({ "task": "domain_create", "apikey": account.api, "data":{"domainname": domainname} }, "/dnsapi", "POST", true)
				Promise.all([promise1]).then((response) => {

					if (response[0].success) {
						document.getElementById("dnsdomain_error").textContent  = `Domain ${domainname} was successfully created!`
						dnsdomainsmenu_editmenu(true, response[0].data.id)
					}
					else {
						document.getElementById("dnsdomain_error").textContent  = `Error during operation: ${err.msg}`
					}

				})
					.catch(function (err) {
						document.getElementById("dnsdomain_error").textContent  = `Error during operation: ${err.msg}`
					})
			}


			render_items(response)



			//document.getElementById('adddomainbtn').addEventListener('click', adddomainbtnfunction);

		});
	}
	//Edit shared domain
	else {
		const promise1 = websiteloader("/website/dnsdomains_editshared.html");
		Promise.all([promise1]).then((response) => {

			document.getElementById("mainbody2").innerHTML = response[0];
		});
	}
}





//-DNS-Domains



function howtomenu() {
	window.history.replaceState("object or string", "Page Title", `/howto`);
	websiteloader("/website/howto.html")
		.then(async response => {
			document.getElementById("mainbody").innerHTML = response;
		});
}

function aboutusmenu() {
	window.history.replaceState("object or string", "Page Title", `/aboutus`);
	websiteloader("/website/aboutus.html")
		.then(async response => {
			document.getElementById("mainbody").innerHTML = response;
		});
}

function notfoundmenu() {
	window.history.replaceState("object or string", "Page Title", `/404`);
	websiteloader("/website/404.html")
		.then(async response => {
			document.getElementById("mainbody").innerHTML = response;
		});
}

function homemenu() {
	window.history.replaceState("object or string", "Page Title", `/home`);
	websiteloader("/website/home.html")
		.then(async response => {
			document.getElementById("mainbody").innerHTML = response;
		});
}






//WHen using multiple blocks, in "mainbody" the following style needs to be injected:
// style="-moz-column-width: 300px;-webkit-column-width: 300px;column-width: 300px; column-count: 2;