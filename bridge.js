var express = require("express");
var app = express();
var FS = require("fs");

var CronJob = require('cron').CronJob;
var request = require('request');

Date.prototype.isValid = function() {
  return isFinite(this);
}

Date.prototype.isPast = function() {
    return this < new Date();
}

Date.prototype.toHueDateTimeFormat = function() {
    return this.isValid() ? this.toJSON().substr(0, 19) : 'invalid date';
}

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
    } else {
        res.send(200, [
            {
                error: {
                    type: 1,
                    address: '/',
                    description: 'unauthorized user'
                }
            }
        ]);
    }
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
    "schedules": {}
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

// -- Schedules API

// Returns a list of all schedules in the system. Each group has a name and unique identification number.
// If there are no schedules then the bridge will return an empty object, {}.
app.get('/api/:username/schedules', whitelist, function(req, res) {
    var result = mapObject(app.get('state').schedules, function(schedule) {
        return selectSubsetFromJSON(schedule, 'name');
    });
    res.send(200, JSON.stringify(result));
});

var nextScheduleId = function() {
    var id = 1;
    while(app.get('state').schedules[id]) id++;
    return id;
}

var scheduleNameExists = function(name) {
    for (var scheduleId in app.get('state').schedules) {
        var schedule = app.get('state').schedules[scheduleId];
        if (schedule.name === name) return true; 
    }
    return false;
}

var nextScheduleName = function() {
    var name = 'schedule'; // default name for schedules
    var number = 1;
    while (scheduleNameExists(name)) {
        name = 'schedule ' + (number++);
    }
    return name;
}

var scheduleCronJobs = {};

var createSchedule = function(id, schedule) {
    app.get('state').schedules[id] = schedule;
    scheduleCronJobs[id] = new CronJob(new Date(schedule.time), function onTickSchedule() {
        console.log('schedule ' + id + ' executing command: ' + JSON.stringify(schedule.command));
        request({
            'uri': 'http://127.0.0.1:' + (process.env.PORT || 80) + schedule.command.address,
            'method': schedule.command.method,
            'body': JSON.stringify(schedule.command.body)
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log(body);
            } else console.log(error);
        });
        this.stop();
    }, function onCompleteSchedule() {
        // on complete or stop: remove the schedule and the cronjob
        delete scheduleCronJobs[id];
        delete app.get('state').schedules[id];
        console.log('schedule ' + id + ' removed.');
    }, 
    true // start job directly
    );
}

var deleteSchedule = function(id) {
    var job = scheduleCronJobs[id];
    if (job) {
        job.stop();
    }
}

// create schedule (real bridge can save up to 100)
app.post('/api/:username/schedules', whitelist, function(req, res) {
    // parameter time and command are required
    if (!req.body.time || !req.body.command) {
        res.send(200, JSON.stringify([
            {
                "error": {
                    "type": 5,
                    "address": "/schedules",
                    "description": "invalid/missing parameters in body"
                }
            }
        ]));
    }
    // bridge time is measured in UTC
    var date = new Date(req.body.time);
    if (!date.isValid() || date.isPast()) {
        // invalid date and dates in the past raise error 7
        res.send(200, JSON.stringify([
            {
                "error": {
                    "type": 7,
                    "address": "/schedules/time",
                    "description": "invalid value, "+req.body.time+", for parameter, time"
                }
            }
        ]));
    }
    // parameters are limited to different number of characters, those errors are not yet raised in the simulator
    var name = req.body.name || nextScheduleName();
    var description = req.body.description || '';
    var command = req.body.command;
    var time = req.body.time;
    var id = nextScheduleId();
    var created = new Date().toHueDateTimeFormat();
    var schedule = {
        'name': name,
        'description': description,
        'command': command,
        'time': time,
        'created': created,
        'status': 'enabled'
    };
    createSchedule(id, schedule);
    // output
    res.send(200, JSON.stringify([{
        "success":{"id": id.toString() }
    }]));
});

// get schedule attributes
app.get('/api/:username/schedules/:id', whitelist, function(req, res) {
    var id = req.params.id;
    var schedule = app.get('state').schedules[id];
    if (!schedule) {
        // todo: duplicate code -> try to understand how bridge error handler works and do it abstract
        // error 3 seems to be 'resource x not available' error
        res.send(200, JSON.stringify([
            {
                "error": {
                    "type": 3,
                    "address": "/schedules/"+id,
                    "description": "resource, /schedules/"+id+", not available"
                }
            }
        ]))
    } else {
        res.send(200, JSON.stringify(schedule));
    }
});

// set schedule attributes
app.put('/api/:username/schedules/:id', whitelist, function(req, res) {
    var id = req.params.id;
    if (!app.get('state').schedules[id]) {
        res.send(200, JSON.stringify([
            {
                "error": {
                    "type": 704,
                    "address": "/schedules/"+id,
                    "description": "Cannot create schedule because tag, "+id+", is invalid."
                }
            }
        ]));
    } else {
        if (req.body.time) {
            var date = new Date(req.body.time);
            if (!date.isValid() || date.isPast()) {
                // invalid date and dates in the past raise error 7
                res.send(200, JSON.stringify([
                    {
                        "error": {
                            "type": 7,
                            "address": "/schedules/time",
                            "description": "invalid value, "+req.body.time+", for parameter, time"
                        }
                    }
                ]));
                return;
            }
        }
        var schedule = app.get('state').schedules[id];
        schedule.created = new Date().toHueDateTimeFormat();
        var result = updateProperties(schedule, req.body, '/schedules/'+id+'/');
        deleteSchedule(id);
        createSchedule(id, schedule);
        res.send(200, JSON.stringify(result));
    }
});

// delete schedule
app.delete('/api/:username/schedules/:id', whitelist, function(req, res) {
    var id = req.params.id;
    if (app.get('state').schedules[id]) {
        deleteSchedule(id);
        res.send(200, JSON.stringify([{"success": "/schedules/" + id + " deleted."}]));
    } else {
        res.send(200, JSON.stringify([
            {
                "error": {
                    "type": 3,
                    "address": "/schedules/"+id,
                    "description": "resource, /schedules/"+id+", not available"
                }
            }
        ]));
    }
});

/*
// create initial test schedule which turns all lights on in 2 seconds
createSchedule(1, {
    "name": "schedule",
    "description": "",
    "command": {
        "address": "/api/newdeveloper/groups/0/action",
        "body": {
            "on": true
        },
        "method": "PUT"
    },
    "time": new Date(new Date().valueOf()+2000).toHueDateTimeFormat(),
    "created": new Date().toHueDateTimeFormat(),
    "status": "enabled"
});
*/

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
