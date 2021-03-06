#!/bin/bash -x
set -e

#########
### VARIABLE SECTION
### Edit variables below to alter the behaviour of the script
#########

# AWS Region to deploy to 
# see https://docs.aws.amazon.com/general/latest/gr/rande.html#regional-endpoints
AWS_REGION="us-east-1"

# EKS Config
EKS_CLUSTER_NAME="tcx-dlp-cluster"
KUBE_VERSION="1.18" # Kubernetes version to use
EKS_NODE_COUNT=3 # number of nodes to deploy
EKS_NODE_TYPE="t2.medium" # see https://aws.amazon.com/ec2/instance-types/

# Serverless Config
DEPLOY_STAGE="dev"
MEMORY_SIZE=1024 # Memory size for Lambda functions
TIMEOUT=6 # Timeout for Lambda functions
READ_UNITS=1 # Provisioned read units for DynamoDB
WRITE_UNITS=1 # Provisioned write units for DynamoDB
DELETION_POLICY="Delete" # DynamoDB Deletion Policy

#########
### LOGIC SECTION
#########

# Setup EKS cluster
function setupEKS () {
  echo "Creating EKS cluster with name \"EKS_CLUSTER_NAME\" in \"$AWS_REGION\"."
  # Create cluster
  eksctl create cluster \
    --name $EKS_CLUSTER_NAME \
    --version $KUBE_VERSION \
    --region $AWS_REGION \
    --nodes $EKS_NODE_COUNT \
    --node-type $EKS_NODE_TYPE 
}

# Install Ingress-Nginx
function installNginx () {
  echo "Installing nginx to the k8s cluster"
  # Install using AWS specific deploy script
  kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v0.44.0/deploy/static/provider/aws/deploy.yaml
  # Wait for controller to be ready
  kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s
}

# Install Presidio
function installPresidio () {
  # Run presidio chart using helm
  echo "Installing presidio to the k8s cluster"
  helm install presidio \
  presidio \
  --set ingress.enabled=true,ingress.class=nginx \
  --namespace presidio --create-namespace \
  --wait || true
  # Get external IP for cluster
  PRESIDIO_IP=$(
    kubectl get services \
    ingress-nginx-controller \
    --namespace ingress-nginx \
    --output jsonpath='{.status.loadBalancer.ingress[0].hostname}'
  )
  export PRESIDIO_ENDPOINT="http://$PRESIDIO_IP/presidio-presidio-analyzer/analyze"
  echo "Presidio endpoint: $PRESIDIO_ENDPOINT"
}

# Setup Lambda Functions and DynamoDB using Serverless
function deployServerless () {
  # add variables to environment so they can be read in serverless config
  export DEPLOY_STAGE
  export MEMORY_SIZE
  export TIMEOUT
  export READ_UNITS
  export WRITE_UNITS
  export DELETION_POLICY
  echo "Deploying AWS resources using Serverless"
  pushd ../
  npm install
  npm run build
  serverless deploy \
    --region $AWS_REGION \
    --stage $DEPLOY_STAGE
  popd
}

#########
### EXECUTION SECTION
#########

pushd "$(dirname "${BASH_SOURCE[0]}")"

setupEKS
installNginx
installPresidio
deployServerless

popd
