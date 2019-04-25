#!/bin/bash 
printf '{"apiVersion":"1.0","awsService":"ecs","serviceEvent":"taskdefinition","serviceJob":"get-latest-version","taskDefinitionName" : "%s"}' $1 > taskinfo.json 
TASK_LATEST_REVISION=$(curl -s -d "@taskinfo.json" -H "Content-Type: application/json" -X POST $LAMBDA_API_LATEST_TASK_VERSION) 
TASK_NEWEST_REVISION=$(($TASK_LATEST_REVISION+1)) 
printf '{"version":1,"Resources":[{"TargetService":{"Type":"AWS::ECS::Service","Properties":{"TaskDefinition":"arn:aws:ecs:sa-east-1:631771749190:task-definition/%s:%s","LoadBalancerInfo":{"ContainerName":"%s","ContainerPort":%s}}}}]}' $1 $TASK_NEWEST_REVISION $2 $3 > appspec.json 
CLOUDWATCH_LOG_GROUP
sed -i "s/CLOUDWATCH_LOG_GROUP_TEMPLATE/$CLOUDWATCH_LOG_GROUP/g" task-definition.json 
sed -i "s/DEFAULT_REGION_TEMPLATE/$AWS_DEFAULT_REGION/g" task-definition.json 
sed -i "s/ACCOUNT_ID_TEMPLATE/$ACCOUNT_ID/g" task-definition.json 
sed -i "s/HOST_PORT_TEMPLATE/$HOST_PORT/g" task-definition.json 
sed -i "s/TASK_DEFINITION_NAME_TEMPLATE/$TASK_DEFINITION_NAME/g" task-definition.json 
sed -i "s/CONTAINER_PORT_TEMPLATE/$CONTAINER_PORT/g" task-definition.json 
sed -i "s/REPOSITORY_IMAGE_NAME_TEMPLATE/$REPOSITORY_IMAGE_NAME/g" task-definition.json 
sed -i "s/IMAGE_TAG_TEMPLATE/$IMAGE_TAG/g" task-definition.json 
sed -i "s/CONTAINER_NAME_TEMPLATE/$CONTAINER_NAME/g" task-definition.json 