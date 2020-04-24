#!/bin/sh

npm run openApi:doc &
SPOT_SERVER_PID=$!

sleep 3

curl http://localhost:8080/contract-openapi3 -o src/HTTPServer/OpenApiBackend/spec.json

kill $SPOT_SERVER_PID || true
