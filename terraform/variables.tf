# Terraform Variables for ResearchNexus GCP Infrastructure

variable "project_id" {
  type        = string
  description = "Google Cloud Project ID"
  default     = "research-nexus-prod"
}

variable "region" {
  type        = string
  description = "Google Cloud Region for deployment"
  default     = "us-central1"
}

variable "app_name" {
  type        = string
  description = "Application identifier prefix"
  default     = "research-nexus"
}

variable "container_image" {
  type        = string
  description = "Artifact Registry container image URI"
  default     = "gcr.io/research-nexus-prod/nexus-engine:latest"
}

variable "alloydb_password" {
  type        = string
  description = "AlloyDB Root Admin User Password"
  sensitive   = true
  default     = "AlloyDBSecurePass2026!NexusAdmin"
}

variable "gemini_api_key" {
  type        = string
  description = "Google Gemini GenAI API Key for Server-Side Inference"
  sensitive   = true
  default     = ""
}
