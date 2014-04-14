var express = require("express");
var app = express();
var FS = require("fs");

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    // what about X-Requested-With, X-HTTP-Method-Override, Accept ?

    if (req.method === 'OPTIONS') {
        res.end();
    } else {
        next();
    }
};

var sendJSON = function(req, res, next) {
    res.header('Content-Type', 'application/json; charset=UTF-8');
    next();
};

var whitelist = function(req, res, next) {
    if (req && req.params && req.params.hasOwnProperty('username')) {
        var username = req.params.username;
        if (app.get('state').config.whitelist.hasOwnProperty(username)) {
            req.username = username;
            next();
        }
    }
    res.send(200, [
        {
            error: {
                type: 1,
                address: '/',
                description: 'unauthorized user'
            }
        }
    ]);
};

app.use(express.logger());
app.use(express.static(__dirname + '/public_html'));
app.use(function(request, response, next) {
    // http://developers.meethue.com/7_messagestructureresponse.html says the request body MUST be JSON,
    // but the SDK doesn't necessarily send the proper headers
    if (request.method === 'POST' || request.method === 'PUT') {
        request.headers['content-type'] = 'application/json; charset=UTF-8';
    }
    
    next();
});
app.use(express.json());
app.use(allowCrossDomain);
app.use(sendJSON);

app.set('state', {
    "lights": {
        "1": {
            "state": {
                "on": false,
                "bri": 0,
                "hue": 0,
                "sat": 0,
                "xy": [0.0000, 0.0000],
                "ct": 0,
                "alert": "none",
                "effect": "none",
                "colormode": "hs",
                "reachable": true
            },
            "type": "Extended color light",
            "name": "Hue Lamp 1",
            "modelid": "LCT001",
            "swversion": "65003148",
            "pointsymbol": {
                "1": "none",
                "2": "none",
                "3": "none",
                "4": "none",
                "5": "none",
                "6": "none",
                "7": "none",
                "8": "none"
            }
        },
        "2": {
            "state": {
                "on": true,
                "bri": 254,
                "hue": 33536,
                "sat": 144,
                "xy": [0.3460, 0.3568],
                "ct": 201,
                "alert": "none",
                "effect": "none",
                "colormode": "hs",
                "reachable": true
            },
            "type": "Extended color light",
            "name": "Hue Lamp 2",
            "modelid": "LCT001",
            "swversion": "65003148",
            "pointsymbol": {
                "1": "none",
                "2": "none",
                "3": "none",
                "4": "none",
                "5": "none",
                "6": "none",
                "7": "none",
                "8": "none"
            }
        }
    },
    "groups": {
        "1": {
            "action": {
                "on": true,
                "bri": 254,
                "hue": 33536,
                "sat": 144,
                "xy": [0.3460, 0.3568],
                "ct": 201,
                "effect": "none",
                "colormode": "xy"
            },
            "lights": ["1", "2"],
            "name": "Group 1"
        }
    },
    "config": {
        "name": "Philips hue",
        "mac": "00:00:88:00:bb:ee",
        "dhcp": true,
        "ipaddress": "192.168.1.74",
        "netmask": "255.255.255.0",
        "gateway": "192.168.1.254",
        "proxyaddress": "",
        "proxyport": 0,
        "UTC": "2012-10-29T12:00:00",
        "whitelist": {
            "newdeveloper": {
                "last use date": "2012-10-29T12:00:00",
                "create date": "2012-10-29T12:00:00",
                "name": "test user"
            }
        },
        "swversion": "01003542",
        "swupdate": {
            "updatestate": 0,
            "url": "",
            "text": "",
            "notify": false
        },
        "linkbutton": false,
        "portalservices": false
    },
    "schedules": {
        "1": {
            "name": "schedule",
            "description": "",
            "command": {
                "address": "/api/0/groups/0/action",
                "body": {
                    "on": true
                },
                "method": "PUT"
            },
            "time": "2012-10-29T12:00:00"
        }
    }
});

app.get('/', function(req, res) {
    res.redirect(301, 'index.html');
});

app.get('/linkbutton', function(request, response) {
    app.get('state').config.linkbutton = true;
    setTimeout(function() {
        app.get('state').config.linkbutton = false;
    }, 30000);
    response.send(200, "link button pushed. you have 30 seconds to register new usernames");
});

// -- Lights API

// get all lights
app.get('/api/:username/lights', whitelist, function(req, res) {
    // get light state
    var lights = app.get('state').lights;
    // only send names of lights
    var result = mapObject(lights, function(light) {
        return selectSubsetFromJSON(light, 'name');
    });
    res.send(200, JSON.stringify(result));
});

var mapObject = function(obj, fn) {
    var result = {};
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            result[key] = fn(obj[key]);
        }
    }
    return result;
};

var selectSubsetFromJSON = function(json, keys) {
    var result = {};
    // cast 'keys' to array
    if (typeof keys !== 'object') {
        keys = [keys];
    }
    for (var i = 0; i < keys.length; i++) {
        result[keys[i]] = json[keys[i]];
    }
    return result;
};

// get new lights TODO
app.get('/api/:username/lights/new', whitelist, function(req, res) {
    res.send(200, JSON.stringify({
        "7": {
            "name": "Hue Lamp 7"
        },
        "8": {
            "name": "Hue Lamp 8"
        },
        "lastscan": "2012-10-29T12:00:00"
    }));
});

// search for new lights TODO
// accept a new light object and add it to lights list
// since this isn't a real feature of the Hue bridge API, didn't modify the return value
app.post('/api/:username/lights', whitelist, function(req, res) {
    if(req.body && req.body.length > 0){
        //figure out next index
        var numKeys = Object.keys(app.get('state').lights).length;
        //Clone one of the existing objects as a placeholder at the new index
        app.get('state').lights[numKeys + 1] = JSON.parse(JSON.stringify(app.get('state').lights[1]));
        var newLight = app.get('state').lights[numKeys + 1];
        //update name
        if(req.body.name != null && req.body.name != undefined){
        	newLight.name = req.body.name;
        }
        //update state
        updateProperties(newLight.state,req.body.state,null);
    }
    res.send(200, JSON.stringify([{"success": {"/lights": "Searching for new devices"}}]));
});

// get light
app.get('/api/:username/lights/:id', whitelist, function(req, res) {
    var id = req.params.id;
    res.send(200, JSON.stringify(app.get('state').lights[id]));
});

// rename light
app.put('/api/:username/lights/:id', whitelist, function(req, res) {
    var name = req.body.name;
    var id = req.params.id;
    app.get('state').lights[id]["name"] = name;
    var success = {};
    success["/lights/" + id + "/name"] = name;
    res.send(200, JSON.stringify([{"success": success}]));
});

// change light state
app.put('/api/:username/lights/:id/state', whitelist, function(req, res) {
    var id = req.params.id;
    var state = app.get('state').lights[id].state;
    var response = updateProperties(state, req.body, "/lights/" + id + "/state/");
    res.send(200, JSON.stringify(response));
});

var updateProperties = function(obj, props, successPath) {
    var response = [];
    for (var propertyToBeUpdated in props) {
        if (props.hasOwnProperty(propertyToBeUpdated)) {
            if (obj.hasOwnProperty(propertyToBeUpdated)) {
                var newValue = props[propertyToBeUpdated];
                obj[propertyToBeUpdated] = newValue;
                // TODO: currently all values are treated as string ! this could lead to bugs and has to be fixed
                if (successPath) {
                    var success = {};
                    success[successPath + propertyToBeUpdated] = newValue;
                    response.push({
                        "success": success
                    });
                }
            }
        }
    }
    return response;
};

// -- Groups API

// get groups
app.get('/api/:username/groups', whitelist, function(req, res) {
    // get light state
    var groups = app.get('state').groups;
    // only send names of lights
    var result = mapObject(groups, function(group) {
        return selectSubsetFromJSON(group, 'name');
    });
    res.send(200, JSON.stringify(result));
});

// get group attributes
app.get('/api/:username/groups/:id', whitelist, function(req, res) {
    var id = req.params.id;
    res.send(200, JSON.stringify(app.get('state').groups[id]));
});

// set group attributes
app.put('/api/:username/groups/:id', whitelist, function(req, res) {
    var id = req.params.id;
    var name = req.body.name;
    var lights = req.body.lights;
    var group = app.get('state').groups[id];
    var result = [];

    if (name) {
        group.name = name;
        var success = {};
        success["/groups/" + id + "/name"] = name;
        result.push({"success": success});
    }

    if (lights) {
        group.lights = lights;
        var success = {};
        success["/groups/" + id + "/lights"] = lights;
        result.push({"success": success});
    }

    res.send(200, JSON.stringify(result));
});

// set group state
app.put('/api/:username/groups/:id/action', whitelist, function(req, res) {
    var id = req.params.id;
    var action = req.body;
    var group = app.get('state').groups[id];

    var lights = [];
    if (id === '0') {
        for (var lightId in app.get('state').lights) {
            lights.push(lightId);
        }
    } else {
        if (group) {
            lights = group.lights;
            group.action = action;
        } else {
            // error TODO proper handling
            console.error("no group found");
        }
    }

    for (var i = 0; i < lights.length; i++) {
        var lightId = lights[i];
        var lightState = app.get('state').lights[lightId].state;
        updateProperties(lightState, action);
    }

    var result = [];
    for (var property in action) {
        var success = {};
        success["/groups/" + id + "/action/" + property] = action[property];
        result.push({"success": success});
    }

    res.send(200, JSON.stringify(result));
});

// -- Configuration API

// create user
app.post('/api', function(request, response) {
    var devicetype = request.body.devicetype;
    var username = request.body.username;
    if (!username) {
        username = "letmegeneratethatforyou";
    }
    if (app.get('state').config.linkbutton) {
        app.get('state').config.whitelist[username] = {
            "last use date": "2012-10-29T12:00:00",
            "create date": "2012-10-29T12:00:00",
            "name": devicetype
        };
        response.send(200, JSON.stringify([
            {
                success: {
                    "username": username
                }
            }
        ]));
    } else {
        response.send(200, JSON.stringify([
            {
                error: {
                    type: 101,
                    address: '',
                    description: 'link button not pressed'
                }
            }
        ]));
    }
});

// get config
app.get('/api/:username/config', function(req, res) {
    // config does not give unauthorized_user error, but a public part of the config
    if (req && req.params && req.params.hasOwnProperty('username')) {
        var username = req.params.username;
        if (app.get('state').config.whitelist.hasOwnProperty(username)) {
            res.send(200, JSON.stringify(app.get('state').config));
        }
    }
    // only send name and swversion if the user is not authed
    res.send(200, JSON.stringify(selectSubsetFromJSON(app.get('state').config, ['name', 'swversion'])));
});

// change config
app.put('/api/:username/config', whitelist, function(request, response) {
    var result = updateProperties(app.get('state').config, request.body, "/config/");
    response.send(200, JSON.stringify(result));
});

// delete user
app.delete('/api/:username/config/whitelist/:userToBeDeleted', whitelist, function(req, res) {
    var deleteUsername = req.params.userToBeDeleted;
    delete app.get('state').config.whitelist[deleteUsername];
    res.send(200, JSON.stringify([{"success": "/config/whitelist/" + deleteUsername + " deleted."}]));
});

// get full state
app.get('/api/:username', whitelist, function(request, response) {
    response.send(200, JSON.stringify(app.get('state')));
});

app.get('/description.xml', function(request, response) {
    FS.readFile(__dirname + '/description.xml', {encoding: 'utf8'}, function(err, data) {
        if (err) throw err;

        var address = app._server.address();
        if (address.address === '0.0.0.0') {
            // bound to all interfaces, just return the host that the request came in on
            address.address = request.headers.host;
        }

        data = data
            .replace(/\{\{IP\}\}/g, address.address)
            .replace(/\{\{PORT\}\}/g, address.port);

        response.header('Content-Type', 'application/xml; charset=UTF-8');
        response.send(200, data);
    });
});


module.exports = app;
