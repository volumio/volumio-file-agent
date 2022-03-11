# Device File Agent

This software implements a daemon which runs inside a Volumio device.

The daemon purpose is to scan the filesystem (upon instruction to do so by the Volumio core) and to maintain an intenal catalog of Tracks an Albums.

The Volumio Core can communicate with the daemon through an [HTTP Interface](./src/HTTPServer) exposed on `127.0.0.1:4000`.

The HTTP interface is implemented and [documented](./src/HTTPServer/README.md) through the [OpenApi Specification](https://www.openapis.org/) standard.

Internally the agent is a long running process wich performs I/O with various sources:

- the filesystem
- the network
- an SQLite Database

> [The Agent architecture](./src/Agent/Readme.md)

## Package commands

- `npm run build`: Deletes the `./dist` folder, creates the OpenApi JSON spec, TS compiles the `./src` folder into the `./dist` folder.
- `npm run start`: Starts the daemon from the `./dist` folder
- `npm run start:ts`: Starts the daemon from the `./src` folder (does not create the OpenApi JSON spec)
- `npm run openApi:doc`: Starts the OpenApi documentation server on http://localhost:8080
- `npm run openApi:json`: Creates the OpenApi JSON spec.
- `npm run try`: `npm run build` && `npm run start`
