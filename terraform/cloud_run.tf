# Cloud Run v2 Service with VPC Access Connector to AlloyDB

resource "google_cloud_run_v2_service" "nexus_service" {
  name     = "${var.app_name}-api"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    scaling {
      min_instance_count = 1
      max_instance_count = 50
    }

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    containers {
      image = var.container_image

      resources {
        limits = {
          cpu    = "4"
          memory = "8Gi"
        }
      }

      env {
        name  = "ENVIRONMENT"
        value = "production"
      }
      env {
        name  = "DATABASE_URL"
        value = "postgresql+asyncpg://postgres:${var.alloydb_password}@${google_alloydb_instance.nexus_primary.ip_address}:5432/research_nexus"
      }
      env {
        name  = "GEMINI_API_KEY"
        value = var.gemini_api_key
      }

      ports {
        container_port = 8000
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 8000
        }
        initial_delay_seconds = 5
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 8000
        }
        period_seconds = 15
      }
    }
  }

  depends_on = [
    google_alloydb_instance.nexus_primary,
    google_vpc_access_connector.connector
  ]
}

# Allow public unauthenticated invocation to the frontend/API
resource "google_cloud_run_service_iam_member" "public_access" {
  location = google_cloud_run_v2_service.nexus_service.location
  project  = var.project_id
  service  = google_cloud_run_v2_service.nexus_service.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
