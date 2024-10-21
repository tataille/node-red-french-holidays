# Development Environment setup

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