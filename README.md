# Topcoder X - DLP scanning AWS implementation

## Prerequisites

The app is deployed on AWS and has the following prerequisites (other than node and npm):

* [Helm 3](https://helm.sh/docs/intro/install/) installed and working on the local machine. available on $PATH.
* [AWS CLI](https://aws.amazon.com/cli/) installed, available on $PATH and [configured](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html) for administrator access.
* [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/) installed and available on $PATH.
* [eksctl](https://eksctl.io/introduction/#installation) installed and available on $PATH.
* [Serverless CLI](https://www.serverless.com/framework/docs/getting-started/) installed and set up by running:
```sh
serverless
``` 

## Deployment

A customizable script is included to automate the deployment process:
```sh
./deployment/deploy.sh
```

### Manual Deployment

1. Launch the EKS cluster
   ```sh
   eksctl create cluster \
     --name tcx-dlp-cluster \
     --nodes 3 \
     --node-type "t2.medium" 
   ```
2. Install Ingress-Nginx
   ```sh
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v0.44.0/deploy/static/provider/aws/deploy.yaml
   ```
3. Install Presidio
   ```sh
   helm install presidio \
     deployment/presidio \
     --set ingress.enabled=true,ingress.class=nginx \
     --namespace presidio --create-namespace
   ```
4. Store Presidio endpoint in an environment variable
   ```sh
   PRESIDIO_IP=$(kubectl get services \
     ingress-nginx-controller \
     --namespace ingress-nginx \
     --output jsonpath='{.status.loadBalancer.ingress[0].hostname}')
   export PRESIDIO_ENDPOINT="http://$PRESIDIO_IP/presidio-presidio-analyzer/analyze"
   ```
5. Deploy Serverless service
   ```sh
   # Install dependencies
   npm i
   # Compile typescript files
   npm run build
   # Deploy service
   serverless deploy
   ```


## Customization

Several variables can be set in the deploy script.
The serverless.yaml file can also be edited directly.


## Troubleshooting

### UnsupportedAvailabilityZoneException when creating eks cluster:
  This is common in us-east-1 region. Copy the suggested zones from error message and add to *--zones* flag for eksctl:
  [see note here](https://eksctl.io/usage/creating-and-managing-clusters/#creating-a-cluster)

### Status Code 500 error immediately after deploying service:
  Sometime AWS takes a few minutes to attach IAM policy to Lambda functions. Please wait 5 minutes and try again.

### Status Code 500 error on POST method:
  Ensure PRESIDIO_ENDPOINT has been set in environment or in serverless.yaml. Endpoint is only set automatically when using deploy script. 


## Cleanup
You can follow these steps to delete your AWS resources:
1. Remove Serverless service
   ```sh
   serverless remove
   ```
2. Uninstall Presidio
   ```sh
   helm uninstall presidio --namespace presidio
   ```
3. Uninstall ingress-nginx
   ```sh
   kubectl delete -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v0.44.0/deploy/static/provider/aws/deploy.yaml
   ```
4. Delete cluster
   ```sh
   eksctl delete cluster --name='cluster-name'
   ```