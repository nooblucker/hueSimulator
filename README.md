# A node.js based simulator for the Philips Hue API

As I started development of hueJS before getting my Hue starter kit, i needed to test my code with a simulated bridge.

## Install

Using npm:

```
sudo npm install -g hue-simulator
```

It should be installed [globally](http://blog.nodejitsu.com/npm-cheatsheet#Understanding_Global_versus_Local_installs_in_npm) by default, so you can start the simulator via command line, but to be sure we are adding the `-g` flag.

## Run

Start the simulator via command line:
```
sudo hue-simulator
```
Sudo is necessary because we want to listen on port 80.

## Debugger

Like a real bridge, you have a webinterface where you can enter commands. After starting the simulator, simply navigate your browser to the IP of the simulator.
![screenshot of webinterface](debugger.png "Debugger webinterface")
In the list on the left, you have predefined commands, so you don't always have to look up the correct URL and write the whole JSON-body of the message. Click on a button, and the command-form is filled with dummy data for this kind of command.

## Routes

`GET /linkbutton` will enable user registration for 30 seconds. By default, a user named "newdeveloper" is whitelisted. Registered users and state of the simulator will be lost when restarting. So you always have a "fresh" system.

At the moment, all routes from the hue API are available, except schedules.

