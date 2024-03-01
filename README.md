# node-red-french-holidays for node-red

[![Node.js CI](https://github.com/tataille/node-red-french-holidays/actions/workflows/node.js.yml/badge.svg)](https://github.com/tataille/node-red-french-holidays/actions/workflows/node.js.yml)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/tataille/node-red-french-holidays/graphs/commit-activity)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Issues](https://img.shields.io/github/issues/tataille/node-red-french-holidays.svg?style=flat-square)](https://github.com/tataille/node-red-french-holidays/issues)
[![NPM](https://img.shields.io/npm/dm/@tataille/node-red-french-holidays)](https://www.npmjs.com/package/@tataille/node-red-french-holidays)

<a href="https://www.buymeacoffee.com/jeanmarctaz"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a beer&emoji=🍺&slug=jeanmarctaz&button_colour=40DCA5&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00" /></a>

A <a href="http://nodered.org" target="_new">Node-RED</a> node to retrieve French School Academy and public holidays depending on School Academy and geo location..

Requires a network connection to retrieve data dynamically from the following official APIs:

* <https://api.gouv.fr/documentation/jours-feries>
* <https://api.gouv.fr/documentation/api-calendrier-scolaire>

!['Retrieve French Holidays'](https://github.com/tataille/node-red-french-holidays/blob/main/assets/example.gif)

## Install

Using the Node Red palette manager.

Alternatively, run the following command in your Node-RED user directory - typically `~/.node-red`


```bash
npm install npm i @tataille/node-red-french-holidays@X.X.X
```

### Update

Use the node-red palette manager to update the module. 

![assets](https://github.com/tataille/node-red-french-holidays/blob/main/assets/node-update.gif)

## Usage

Retrieves French School Holiday and Public Holiday based on School Academy, geo location and output them to the next node.

```json
[{"id":"f6f2187d.f17ca8","type":"tab","label":"Exemple Académie Rennes & Fériés Métropole","disabled":false,"info":""},{"id":"69a824ffaab0680b","type":"french-holidays","z":"f6f2187d.f17ca8","name":"Vacances","academy":"Rennes","geo":"Métropole","x":340,"y":240,"wires":[["821c23230cbef1e6"]]},{"id":"821c23230cbef1e6","type":"debug","z":"f6f2187d.f17ca8","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","statusVal":"","statusType":"auto","x":550,"y":240,"wires":[]},{"id":"d2702ce52d9c5d50","type":"inject","z":"f6f2187d.f17ca8","name":"","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"test","payloadType":"str","x":130,"y":240,"wires":[["69a824ffaab0680b"]]}]
```

Data are returned in __msg.payload__

Example of result when querying api on January 2 2024 for Academy of Clermont-Ferrand (Metropole)

```json
{
  "day": 5,
  "isPublicHoliday": false,
  "isTomorrowPublicHoliday": false,
  "publicHolidayName": null,
  "nextPublicHolidayName": "Lundi de Pâques",
  "nextPublicHolidayDate": "01/04/2024",
  "isSchoolHolidays": true,
  "schoolHolidaysEndDate": "03/03/2024"
  "isTomorrowSchoolHolidays": true,
  "schoolHolidaysName": "Vacances d'Hiver",
  "nextSchoolHolidaysCoutdownInDays": 49,
  "nextSchoolHolidaysName": "Vacances de Printemps",
  "nextSchoolHolidaysStartDate": "12/04/2024",
  "nextSchoolHolidaysEndDate": "28/04/2024",
  "schoolPeriod": "2023-2024",
  "year": 2024,
  "region": "Métropole",
  "academy": "Clermont-Ferrand",
  "zones": "Zone A",
  "version": "1.2.0"
}
```

## Examples

### Retrieving data on a daily base

![Full workflow](https://github.com/tataille/node-red-french-holidays/blob/main/assets/catch-example.png)

```json
[{"id":"d88debded16f7c16","type":"switch","z":"59b8c1f4183c9197","name":"","property":"day-info.day","propertyType":"global","rules":[{"t":"eq","v":"0","vt":"str"},{"t":"eq","v":"6","vt":"str"},{"t":"else"}],"checkall":"false","repair":false,"outputs":3,"x":190,"y":580,"wires":[["08db052087e131ec"],["08db052087e131ec"],["7b2060ccee5932ce"]]}]
```

### Error handling

Due to the fact the plugin interact with external APIs provided by French government, external errors (missing records, connection errors..) are thrown to the node-red core. To handle the exceptions and program a new query, a __catch__ block must be added to the __node-red__ flow. Error details can be found in the exception message payload.

## Development Environment setup

Here are the steps to successfully setup your development environment to contribute to this project

Setup using the VS Code dev container
This will set up a docker container with all the required tools and dependencies to get started.

* Go to the [node-red-french-holidays](https://github.com/tataille/node-red-french-holidays) repository and fork it.

* Clone your forked repository to your local machine.

* Open the project in VS Code.

* Install the [Remote - Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers).

* Click the green button in the lower-left corner of the window that says "Reopen in Container".

* Wait for the container to build and start.

* Open a terminal in VS Code and run "node-red"  to start the __node-red__  server.


```bash
    node-red
```

To stop the __node-red__ server, just enter "ctrl-c" in VS Code terminal where the __node-red__ server run.

To install the module in __debug__ mode, open a terminal in VS Code and run commands:

```bash
cd /root/.node-red
npm install /workspaces/node-red-french-holidays/
node-red
```


To start the tests

```bash
cd /workspaces/node-red-french-holidays
npm test
```

