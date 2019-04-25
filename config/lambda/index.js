const aws = require('aws-sdk');
aws.config.update({region:'sa-east-1'});
const ecs = new aws.ECS();

exports.handler = function(event, context, callback) {

    var taskDefinition = event.taskDefinitionName;

    ecs.describeTaskDefinition({taskDefinition: taskDefinition}, function(err, data) {
      if (err) {
        console.log(err, "404 Not Found");
      } else {
        callback(null, data.taskDefinition.revision);
      }
    });
}