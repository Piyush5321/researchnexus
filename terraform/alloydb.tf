# AlloyDB Cluster & Primary Instance with pgvector & ScaNN acceleration

resource "google_alloydb_cluster" "nexus_cluster" {
  cluster_id = "${var.app_name}-cluster"
  location   = var.region
  network_config {
    network = google_compute_network.nexus_vpc.id
  }

  initial_user {
    password = var.alloydb_password
  }

  depends_on = [google_service_networking_connection.vpc_connection]
}

resource "google_alloydb_instance" "nexus_primary" {
  cluster       = google_alloydb_cluster.nexus_cluster.name
  instance_id   = "${var.app_name}-primary"
  instance_type = "PRIMARY"

  machine_config {
    cpu_count = 4
  }

  database_flags = {
    "alloydb.enable_pgaudit"          = "on"
    "password_encryption"             = "scram-sha-256"
    "track_activities"                = "on"
    "alloydb.enable_google_ml_integration" = "on"
  }

  depends_on = [google_alloydb_cluster.nexus_cluster]
}
