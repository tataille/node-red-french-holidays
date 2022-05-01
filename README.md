# node-red-french-holiday

<a href="https://www.buymeacoffee.com/jeanmarctaz"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a beer&emoji=🍺&slug=jeanmarctaz&button_colour=40DCA5&font_colour=ffffff&font_family=Cookie&outline_colour=000000&coffee_colour=FFDD00" /></a>


A <a href="http://nodered.org" target="_new">Node-RED</a> node to retrieve French School Academy and public holiday depending on School Academie and geo location..

## Install

Using the Node Red palette manager.

Alternatively, run the following command in your Node-RED user directory - typically `~/.node-red`

```bash
npm install node-red-french-holiday
```

## Usage

Retrieves French School Holiday and Public Holiday based on School Academy, geo location and output them to the next node.

```json
[{"id":"f6f2187d.f17ca8","type":"tab","label":"Exemple Académie Rennes & Féries Métropole","disabled":false,"info":""},{"id":"69a824ffaab0680b","type":"french-holiday","z":"f6f2187d.f17ca8","name":"Vacances","academy":"Rennes","geo":"Métropole","x":340,"y":240,"wires":[["821c23230cbef1e6"]]},{"id":"821c23230cbef1e6","type":"debug","z":"f6f2187d.f17ca8","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"payload","targetType":"msg","statusVal":"","statusType":"auto","x":550,"y":240,"wires":[]},{"id":"d2702ce52d9c5d50","type":"inject","z":"f6f2187d.f17ca8","name":"","props":[{"p":"payload"}],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","payload":"test","payloadType":"str","x":130,"y":240,"wires":[["69a824ffaab0680b"]]}]
```

## Examples

### blal

sss

### blallb

ss

## Development

```bash
    docker run -it -p 1880:1880 -v node_red_data:/data -v $(pwd):/node-red-french-holiday --name nodered nodered/node-red
    333
```

Then connect your VS Code into __nodered__ container

To install the module in "debug" mode

```bash
cd /data/
npm install /node-red-french-holiday/
```

Then restart node-red container
