#!/bin/bash
set -e

docker login -u "$DOCKER_USER" -p "$DOCKER_PASSWORD"

docker build -t rabblerouser/event-archiver .
docker push rabblerouser/event-archiver
