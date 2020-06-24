# Device File Agent

This software implements the MediaFile daemon which runs inside a Volumio device.

The daemon starts an [HTTP Server](./src/HTTPServer) listening on `127.0.0.1:4000`, through which it receives commands and provides query results about its mantained catalog of MediaFiles.

The HTTP Server APIs are implemented and [documented](./src/HTTPServer/README.md) through the [OpenApi Specification](https://www.openapis.org/) standard.

## Package commands

- `npm run build`: Deletes the `./dist` folder, creates the OpenApi JSON spec, TS compiles the `./src` folder into the `./dist` folder.
- `npm run start`: Starts the daemon from the `./dist` folder
- `npm run start:ts`: Starts the daemon from the `./src` folder (does not create the OpenApi JSON spec)
- `npm run openApi:doc`: Starts the OpenApi documentation server on http://localhost:8080
- `npm run openApi:json`: Creates the OpenApi JSON spec.
- `npm run try`: `npm run build` && `npm run start`
