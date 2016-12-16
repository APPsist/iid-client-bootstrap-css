var IID = (function ($) {
    //user and session
    var sessionId;
    var view;
    var eb;
    var user;
    var client_inf;
    var client_fingerprint;
    
    //templates
    var tmpl_meldungen;
    var tmpl_stations;
    var tmpl_orte;
    var tmpl_contacts;
    var tmpl_instructions;
    var tmpl_wissen;
    var tmpl_siteInfo;
    var tmpl_assistance;
    var tmpl_lernobjekt;

    //content
    var locations;
    var meldungen;
    var actual_assistance;
    var dummyContacts;
    var test_meldungen;

    var init = function () {
        client_inf = new ClientJS();
        client_fingerprint = client_inf.getFingerprint();

        selectPage('login_container');
        $('#login_error').hide();     

        test_meldungen = [{
            "id": "LPS_01", "assi_name": "Rüsten", "message": "Nächster Auftrag: \"Sensorgehäuse\" Chiron FZ 15 rüsten!", "level": "info", "created": "2016-02-18T09:30:00+01:00",
            action: { type: "post", address: "http://localhost:8080/services/psd/startSupport/a882004c-1feb-11e5-b5f7-727283247c7f", body: null } },
            {"id": "LPS_02", "assi_name": "Rüsten", "message": "Anleitung \"Rüsten\" wurde aktualisiert", "level": "info", "created": "2016-02-18T09:31:00+01:00",
            action: { type: "post", address: "http://localhost:8080/services/psd/startSupport/a882004c-1feb-11e5-b5f7-727283247c7f", body: null } }
    ];

        var tmpl_src_meldungen = loadTXT('./templates/tmpl_meldungen.html');
        tmpl_meldungen = Handlebars.compile(tmpl_src_meldungen);//compile the template
    

        var tmpl_src_orte = loadTXT('./templates/tmpl_liste_orte.html');
        tmpl_orte = Handlebars.compile(tmpl_src_orte);//compile the template
        meldungen = new Array();

        var tmpl_src_stations = loadTXT('./templates/tmpl_cat_stations.html');
        tmpl_siteOverview = Handlebars.compile(tmpl_src_stations);

        var tmpl_src_contacts = loadTXT('./templates/tmpl_cat_contacts.html');
        tmpl_contacts = Handlebars.compile(tmpl_src_contacts);//compile the template

        var tmpl_src_instructions = loadTXT('./templates/tmpl_cat_anleitungen.html');
        tmpl_instructions = Handlebars.compile(tmpl_src_instructions);//compile the template

        var tmpl_src_wissen = loadTXT('./templates/tmpl_cat_wissen.html');
        tmpl_wissen = Handlebars.compile(tmpl_src_wissen);//compile the template

        var tmpl_src_siteInfo = loadTXT('./templates/tmpl_cat_siteInfo.html');
        tmpl_siteInfo = Handlebars.compile(tmpl_src_siteInfo);//compile the template

        var tmpl_src_assistance = loadTXT('./templates/tmpl_anleitung_step.html');
        tmpl_assistance = Handlebars.compile(tmpl_src_assistance);

        var tmpl_src_lernobjekt = loadTXT('./templates/tmpl_lernobjekt.html');
        tmpl_lernobjekt = Handlebars.compile(tmpl_src_lernobjekt);

        dummyContacts = {
            "id": "contacts", "items": [
                { "catalog": "contacts", "displayName": "Herr Markus Rebmann", "role": "Leitung Großserien 6 Normzylinder (PF-RGP6)", "id": "contact_001", "imageUrl": "#", "phone": { "type": "post", "address": "#", "body": null }, "phone_no": "+49(6894)591-7476", "email_adr": "markus.rebmann@festo.com", "chat": { "type": "post", "address": "#", "body": null }, "video": { "type": "post", "address": "#", "body": null } },
                { "catalog": "contacts", "displayName": "Lisa Musterfrau", "role": "Mechatronikerin", "id": "contact_001", "imageUrl": "#", "phone": { "type": "post", "address": "#", "body": null }, "phone_no": "+49(6894)591-7820", "email_adr": "christine.steffen@festo.com", "chat": { "type": "post", "address": "#", "body": null } }
            ]
        };

        //dummyContacts = {
        //    "id": "contacts", "items": [
        //        { "catalog": "contacts", "displayName": "Homer Mustermann", "role": "Abteilungsleiter", "id": "contact_001", "imageUrl": "#", "phone": { "type": "post", "address": "#", "body": null }, "chat": { "type": "post", "address": "#", "body": null }, "video": { "type": "post", "address": "#", "body": null } },
        //        { "catalog": "contacts", "displayName": "Lisa Musterkind", "role": "Mechatronikerin", "id": "contact_001", "imageUrl": "#" },
        //        { "catalog": "contacts", "displayName": "Marge Musterfrau", "role": "Mechatronikerin", "id": "contact_001", "imageUrl": "#" },
        //        { "catalog": "contacts", "displayName": "Bart Musterkind", "role": "Mechatroniker", "id": "contact_001", "imageUrl": "#" },
        //        { "catalog": "contacts", "displayName": "Maggie Musterkind", "role": "Mechatronikerin", "id": "contact_001", "imageUrl": "#" }
        //    ]
        //};

        actual_assistance = "-";

        eb = new vertx.EventBus('/eventbus');
        eb.onclose = function () {
            console.log("WARNING: EventBus connection closed!");
            // reload page:            
            location.reload(true);
        };
        eb.onopen = function () {
            console.log("INFO: EventBus connection opened!");
            console.log("Fingerprint: " + client_fingerprint);
            eb.send("appsist:service:iid:server", {
                "action": "register",
                //"deviceId": "123456"
                "deviceId": String(client_fingerprint)
            }, function (response) {
                if (response.status == "ok") {
                    view = response.view;
                    console.log("View-ID: " + view.id);
                    registerHandlers();
                    IID.selectPage('login_container');
                } else {
                    console.error(response);  
                }
            });
        };
    };

    function registerHandlers() {
        eb.registerHandler("appsist:service:iid:client:" + view.id, function (request, response) {
            switch (request.action) {
                case "updateCatalog":
                    var catalog = request.catalog;

                    console.log('Received catalog update.', catalog)
                    updateCatalog(catalog, response);
                    break;
                case "showNotification":
                    var notification = request.notification;
                    //console.log(JSON.stringify(notification));                       
                    showNotification(notification, response);
                    break;
                case "dismissNotification":
                    var id = request.notificationId;
                    console.log(JSON.stringify(request));
                    // console.log('Dismissing notificatioin "' + id + '".');
                    //  dismissNotification(id, response);
                    break;
                case "displayAssistance":
                    var assistance = request.assistance;
                    console.log('Received assistance step.', assistance);
                    displayAssistance(assistance, response);
                    break;
                case "displayLearningObject":
                    var learningObject = request.learningObject;
                    console.log('Received learning object.', learningObject);
                    displayLearningObject(learningObject, response);
                    break;
                case "displaySiteOverview":
                    var siteOverview = request.siteOverview;
                    console.log('Received site overview.', siteOverview);
                    console.log(JSON.stringify(siteOverview));
                    displaySiteOverview(siteOverview, response);
                    break;
                case "displayStationInfo":
                    var stationInfo = request.stationInfo;
                    console.log('Received station info.', stationInfo);
                    console.log(JSON.stringify(stationInfo));
                    //displayStationInfo(stationInfo, response);
                    break;
                case "releaseView":
                    console.log('Received end display command.');
                    selectPage("page_anleitungen");
                    break;
                case 'getStatus':
    				console.log('Received heartbeat request.');
    				sendHeartbeat(response);
    				break;
                default:
                    response({
                        'status': 'error',
                        'code': 400,
                        'message': 'Unknown action command: ' + request.action
                    });
            }
        });
    }

    var login = function () {
        var userId = $('input[name=userId]').val();
        userId = $.trim(userId);
        var password = $('input[name=password]').val();
        password = $.trim(password);
        // Also we could use the password directly, we want to transfer only the hash.  
        var hash = CryptoJS.SHA256(password).toString();
        //console.log(hash);
        eb.send("appsist:service:iid:server:" + view.id, {
            "action": "login",
            "userId": userId,
            "hash": hash
            //"password" : password
        }, function (response) {

            if (response.status == "ok") {
                sessionId = response.session.id;
                console.log("Session-ID: " + sessionId);
                user = response.session.user;
                $('#login_error').hide();

                //add displayname to user menu
                var username = $('#display_username');
                username.empty();
                username.html(user.displayName);

                //Haupttätigkeit
                setUserActivity('main');

                // display locations
                getLocations();
               

                // show dummy contacts
                var cat = $('#content_contact');
                cat.empty();
                cat.html(tmpl_contacts(dummyContacts));
                $('#contacts_cat').liquidcarousel({ height: 670, duration: 600, hidearrows: true });

                //show page "Anleitungen"
                $(".active").removeClass("active");
                $('#main_menu_anleitungen').addClass("active");
                
                selectPage("page_safety");
                //selectPage("page_anleitungen");

                //displaySiteOverview();
                var response = "";
                showDummyNotification(test_meldungen[0], null);
                showDummyNotification(test_meldungen[1], null);
                selectLocation('station-20');                
                $('#station-20').children("span").show(); //enable symbol for actual location

            } else {
                if (response.code = 500) {
                    selectPage("page_safety");
                } else {
                    console.error(response);
                    $('#login_error').show();
                }
                
            }
        });
    }

    var logout = function () {
        eb.send("appsist:service:iid:server:" + view.id, {
            "action": "logout"
        }, function (response) {

            if (response.status == "ok") {
                console.log("Logged out");
                selectPage("login_container");
            } else {
                console.error(response);
            }
        });
    }

    var getLocations = function () {
        eb.send("appsist:service:iid:server:" + view.id, {
            "action": "getFixLocations"
        }, function (response) {
            if (response.status == "ok") {
                console.log("Getlocations: Response OK");
                //console.log(JSON.stringify(response.locations));

                locations = response.locations;
                var liste = $('#liste_orte');
                liste.html(tmpl_orte(response));

                // add onClick function to display location symbol
                $('#liste_orte li').click(function () {
                    $('#liste_orte li span').hide(); //hide symbols for locations
                    $(this).children("span").show(); //enable symbol for actual location
                });
                $('#liste_orte li span').hide(); //hide symbols for locations
            } else {
                console.error(response);
            }
        });
    }

    function selectLocation(location_ID) {
        var myLocation;
        for (var i in locations) {
            var loc = locations[i];

            if (loc.id == location_ID) {
                myLocation = locations[i];
                break;
            }
        }

        if (myLocation != null) {
            //show current location in GUI
            var loc_string = myLocation.displayName.replace(":", ":<br />");
            $('#current_location').html(loc_string);

            //action select location 
            eb.send("appsist:service:iid:server:" + view.id, {
                "action": "setLocation",
                "location": myLocation
            }, function (response) {

                if (response.status == "ok") {
                    console.log("OK: Set location to: " + myLocation.id);
                } else {
                    console.error(response);
                }
            });
        }
    }

    function setUserActivity(user_role) {
        //action set user_role
        eb.send("appsist:service:iid:server:" + view.id, {
            "action": "setUserActivity",
            "sId":view.id,
            "activity": user_role
        }, function (response) {

            if (response.status == "ok") {
                console.log("OK: Set user_role to: " + user_role);
            } else {
                console.error(response);
                console.log("ERROR: Set user_role to: " + user_role + " -> did not work!");
            }
        });
        
        if (user_role == "main") {
            $("#main_activity span").addClass("icon-OK");
            $("#side_activity span").removeClass("icon-OK");
        } else {
            if (user_role == "side") {
                $("#side_activity span").addClass("icon-OK");
                $("#main_activity span").removeClass("icon-OK");
            }
        }
    }
    
    function showNotification(notification, response) {
        meldungen.push(notification);
        $('#show_meldungen').attr('data-toggle', 'dropdown');
        var liste = $('#meldungen_liste');
        liste.append(tmpl_meldungen(notification));

        console.log("OK: Meldung empfangen mit ID: " + notification.id);

        response({
            'status': 'ok'
        });
    }

    function showDummyNotification(notification) {
        meldungen.push(notification);
        $('#show_meldungen').attr('data-toggle', 'dropdown');
        var liste = $('#meldungen_liste');
        liste.append(tmpl_meldungen(notification));

        console.log("OK: Meldung empfangen mit ID: " + notification.id);        

        $('#meldungen_liste').first().on('click', {
            action: notification.action
        }, function (event) {
            var action = event.data.action;
            performAction(action);
        });
        actual_assistance = notification.assi_name;
    }


    function updateCatalog(catalog, response) {
        var error_state = false;
        switch (catalog.id) {
            case "instructions":
                var cat = $('#content_anleitungen');
                cat.empty();
                cat.html(tmpl_instructions(catalog));
                $('#instructions_cat').liquidcarousel({ height: 670, duration: 600, hidearrows: true });

                //add actions
                for (var i in catalog.items) {
                    var cat_item = catalog.items[i];
                    if (cat_item.action) {
                        $('#instruction-' + cat_item.id).on('click', {
                            action: cat_item.action
                        }, function (event) {
                            var action = event.data.action;
                            performAction(action);
                        });
                    }
                }
                break;

            case "learningObjects":
                var cat = $('#content_wissen');
                cat.empty();
                cat.html(tmpl_wissen(catalog));
                $('#wissen_cat').liquidcarousel({ height: 670, duration: 600, hidearrows: true });

                //add actions
                for (var i in catalog.items) {
                    var item = catalog.items[i];
                    if (item.action) {
                        $('#learningObjects-' + item.id).on('click', {
                            action: item.action
                        }, function (event) {
                            var action = event.data.action;
                            performAction(action);
                        });
                    }
                }
                break;

            case "siteInfo":
                if (catalog.items.length > 0) {
                    console.log(JSON.stringify(catalog));
                    var cat = $('#content_siteOverview');
                    cat.empty();
                    cat.html(tmpl_siteInfo(catalog));

                    //add actions
                    for (var i in catalog.items) {
                        var item = catalog.items[i];
                        if (item.action) {
                            $('#station-ID-' + item.id).on('click', {
                                action: item.action
                            }, function (event) {
                                var action = event.data.action;
                                performAction(action);
                            });
                        }
                    }
                } else {
                    console.log("Catalog siteInfo is empty!");
                }
                break;

            case "contacts":
                var cat = $('#content_contact');
                cat.empty();
                cat.html(tmpl_contacts(catalog));
                $('#wissen_cat').liquidcarousel({ height: 670, duration: 600, hidearrows: true });
                break;

            default:
                error_state = true;

        }

        if (error_state) {
            console.log("ERROR: No catalog with ID: " + catalog.id);
            response({
                'status': 'error',
                'code': 400,
                'message': 'Unknown catalog: ' + catalog.id
            });
        } else {
            console.log("OK: Updated catalog with ID: " + catalog.id);
            response({
                'status': 'ok'
            });
        }
    }

    function displayAssistance(assistance, response) {
        var assist = $('#content_assistenz');
        assist.empty();
        assist.html(tmpl_assistance(assistance));

        //console.log(JSON.stringify(assistance.navigation));

        //add title of assitance process
        $('#assistance_title').html(actual_assistance);

        //add actions
        for (var i in assistance.navigation) {
            var test = i.toString();
            if (i.toString() == "buttons") {
                // add actions to big blue action buttons
                for (var b = 0; b < assistance.navigation.buttons.length; b++) {
                    //console.log("Button-ID [" + b + "]" + " " + assistance.navigation.buttons[b].id);                   
                    var item = assistance.navigation.buttons[b];
                    if (item.action) {
                        $('#nav_button-' + item.id).on('click', {
                            action: item.action
                        }, function (event) {
                            var action = event.data.action;
                            performAction(action);
                        });
                    }
                }
            } else {
                // add actions to small grey buttons
                var assi_item = assistance.navigation[i];
                console.log("add action: " + i);

                $('#assi_' + i).on('click', {
                    action: assi_item
                }, function (event) {
                    var action = event.data.action;
                    performAction(action);
                });
            }
        }

        response({
            'status': 'ok'
        });

        selectPage('page_assistenz');

    }


    function displayLearningObject(learning, response) {
        var assist = $('#content_lernobjekt');
        assist.empty();
        assist.html(tmpl_lernobjekt(learning));

        //Tabs-Navigation
        $(".tabs-menu a").click(function (event) {
            event.preventDefault();
            $(this).parent().addClass("current");
            $(this).parent().siblings().removeClass("current");
            var tab = $(this).attr("href");
            $(".tab-content").not(tab).css("display", "none");
            $(tab).fadeIn();
        });

        selectPage('page_lernobjekt');

        response({
            'status': 'ok'
        });
    }

    function displaySiteOverview(siteOverview, response) {  
        //var content_test = {
        //    "stations": [{ "station": "MachineIdentifier [stationID=Anlage1, machineID=Maschine20]", "level": "info", "content": { "type": "frame", "src": "/sites/Anlage1/stations/Maschine20" } },
        //    { "station": "MachineIdentifier [stationID=Anlage1, machineID=Maschine20]", "level": "info", "content": { "type": "frame", "src": "/sites/Anlage1/stations/Maschine20" } },
        //    { "station": "MachineIdentifier [stationID=Anlage1, machineID=Maschine20]", "level": "error", "content": { "type": "frame", "src": "/sites/Anlage1/stations/Maschine20" } },
        //    { "station": "MachineIdentifier [stationID=Anlage1, machineID=Maschine20]", "level": "warning", "content": { "type": "frame", "src": "/sites/Anlage1/stations/Maschine20" } }], "site": "Anlage1"
        //};

        var cat = $('#content_stations');
        cat.empty();
        cat.html(tmpl_siteOverview(siteOverview));
        //cat.html(tmpl_siteOverview(content_test));
        $('#stations_overview_cat').liquidcarousel({ height: 670, duration: 600, hidearrows: true });

        selectPage('page_stations');

        response({
            'status': 'ok'
        });
    }
    
    function sendHeartbeat(response) {
		response({
			'status' : 'ok'
		});
	}

    function performAction(action) {
        console.log("Performing action:", action);
        eb.send("appsist:service:iid:server:" + view.id, {
            "action": "performAction",
            "actionToPerform": action
        }, function (response) {

            console.log("Action response: " + JSON.stringify(response, null, 2));
        });
    }

    function selectPage(page) {
        $('.page').hide();
        $('#' + page).show();

        //Navigation
        if (page == "login_container" || page == "page_assistenz") {
            $('#navigation_menu').hide();
        } else {
            $('#navigation_menu').show();
        }

        $(window).trigger('resize');
    }

    function loadTXT(url) {
        var data = "<h1> failed to load url : " + url + "</h1>";
        $.ajax({
            async: false,
            dataType: "text",
            url: url,
            success: function (response) {
                data = response;
            }
        });
        return data;
    }

    function setAssistance(title) {
        actual_assistance = title;
    }

    return {
        init: init,
        login: login,
        logout: logout,
        getLocations: getLocations,
        selectLocation: selectLocation,
        setUserActivity: setUserActivity,
        setAssistance: setAssistance,
        //open for development only 
        selectPage: selectPage,
    };
})($);