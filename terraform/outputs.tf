# Terraform Output Outputs for ResearchNexus

output "cloud_run_url" {
  description = "Public URL of the deployed ResearchNexus service"
  value       = google_cloud_run_v2_service.nexus_service.uri
}

output "alloydb_primary_ip" {
  description = "Internal Private IP address of AlloyDB Primary Instance"
  value       = google_alloydb_instance.nexus_primary.ip_address
}

output "vpc_connector_name" {
  description = "Serverless VPC Access Connector Name"
  value       = google_vpc_access_connector.connector.name
}
