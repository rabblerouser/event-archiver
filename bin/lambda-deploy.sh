#!/bin/bash

set -e

echo 'REMOVING DEV DEPENDENCIES'
yarn --production

echo 'PACKAGING THE CODE'
zip -r event_archiver.zip index.js src node_modules/ -x __tests__

echo 'UPLOADING TO S3'
aws s3 cp event_archiver.zip s3://rabblerouser-artefacts/lambdas/event_archiver.zip
