resource "aws_elasticache_cluster" "redis-prd" {
  cluster_id           = "redis-cluster-prd"
  engine               = "redis"
  node_type            = "cache.t2.small"
  num_cache_nodes      = 1
  parameter_group_name = "${aws_elasticache_parameter_group.redis-prd-parameter.name}"
  engine_version       = "5.0.3"
  port                 = 6379
}

resource "aws_elasticache_subnet_group" "redis-prd" {
  name       = "${aws_elasticache_cluster.redis-prd.cluster_id}"
  subnet_ids = ["${var.elasticache_subnet_a}", "${var.elasticache_subnet_b}"]
}

resource "aws_elasticache_parameter_group" "redis-prd-parameter" {
  name   = "cache-params"
  family = "redis5.0"

  parameter {
    name  = "activerehashing"
    value = "yes"
  }
}

resource "aws_elasticache_replication_group" "redis-replication" {
  automatic_failover_enabled    = true
  availability_zones            = ["sa-east-1a", "sa-east-1c"]
  replication_group_id          = "redis-replic-group"
  replication_group_description = "Grupo de Replicas do Redis, multi AZ"
  node_type                     = "cache.t2.small"
  number_cache_clusters         = 2
  parameter_group_name          = "${aws_elasticache_parameter_group.redis-prd-parameter.name}"
  port                          = 6379

  lifecycle {
    ignore_changes = ["number_cache_clusters"]
  }
}

resource "aws_elasticache_cluster" "replica" {
  count = 1

  cluster_id           = "${aws_elasticache_cluster.redis-prd.id}"
  replication_group_id = "${aws_elasticache_replication_group.redis-replication.id}"
}