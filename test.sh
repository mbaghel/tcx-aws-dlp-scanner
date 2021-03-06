#!/bin/bash -x
set -e

pushd "$(dirname "${BASH_SOURCE[0]}")"

# Serverless Config
PRESIDIO_ENDPOINT="http://fakeuri.fake/analyze"
DEPLOY_STAGE="dev"
MEMORY_SIZE=512
TIMEOUT=6
READ_UNITS=2
WRITE_UNITS=2
DELETION_POLICY="Delete"

export PRESIDIO_ENDPOINT
export MEMORY_SIZE
export TIMEOUT
export READ_UNITS
export WRITE_UNITS
export DELETION_POLICY

serverless deploy \
  --region 'us-east-1' \
  --stage $DEPLOY_STAGE
popd