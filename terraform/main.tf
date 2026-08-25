# Terraform Provider & Backend Configuration for Google Cloud Platform

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.20.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required Google Cloud APIs
resource "google_project_service" "services" {
  for_each = toset([
    "alloydb.googleapis.com",
    "compute.googleapis.com",
    "run.googleapis.com",
    "vpcaccess.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com"
  ])
  project            = var.project_id
  service            = each.key
  disable_on_destroy = false
}

# VPC Network and Subnets
resource "google_compute_network" "nexus_vpc" {
  name                    = "${var.app_name}-vpc"
  auto_create_subnetworks = false
  depends_on              = [google_project_service.services]
}

resource "google_compute_subnetwork" "nexus_subnet" {
  name          = "${var.app_name}-subnet-${var.region}"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.nexus_vpc.id
}

# Private Service Connection for AlloyDB VPC Peering
resource "google_compute_global_address" "private_ip_alloc" {
  name          = "${var.app_name}-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.nexus_vpc.id
}

resource "google_service_networking_connection" "vpc_connection" {
  network                 = google_compute_network.nexus_vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_alloc.name]
}

# Serverless VPC Access Connector for Cloud Run to communicate with AlloyDB
resource "google_vpc_access_connector" "connector" {
  name          = "${var.app_name}-vpc-conn"
  region        = var.region
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.nexus_vpc.name
  depends_on    = [google_project_service.services]
}
