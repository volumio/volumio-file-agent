# Device File Agent

This software implements the MediaFile daemon which runs inside a Volumio device.

The daemon starts an [HTTP Server](./src/HTTPServer) listening on `127.0.0.1:4000`, through which it receives commands and provides query results about its mantained catalog of MediaFiles.

The HTTP Server APIs are implemented and [documented](./src/HTTPServer/README.md) through the [OpenApi Specification](https://www.openapis.org/) standard.
