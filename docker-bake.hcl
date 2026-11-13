# ==============================================================================
# Docker Buildx Bake Configuration - Dashboard XB (SMA Putra Nirmala)
# ==============================================================================
# Dokumentasi resmi: https://docs.docker.com/build/bake/
#
# Penggunaan:
#   - Build semua image sekaligus (paralel):
#       docker buildx bake
#
#   - Build hanya frontend:
#       docker buildx bake frontend
#
#   - Build hanya backend:
#       docker buildx bake backend
#
#   - Build dengan tag versi tertentu (misal v1.0.0):
#       TAG=v1.0.0 docker buildx bake
#
#   - Cetak rencana build (dry-run inspect):
#       docker buildx bake --print
# ==============================================================================

variable "TAG" {
  default = "latest"
}

variable "PLATFORMS" {
  default = ["linux/amd64"]
}

group "default" {
  targets = ["frontend", "backend"]
}

# ------------------------------------------------------------------------------
# Target: Frontend (React 19 + Vite + Tailwind CSS + PWA + Nginx)
# ------------------------------------------------------------------------------
target "frontend" {
  context    = "."
  dockerfile = "frontend/Dockerfile"
  platforms  = PLATFORMS
  tags       = [
    "dashboard-xb-frontend:${TAG}"
  ]
  labels = {
    "org.opencontainers.image.title"       = "Dashboard XB Frontend"
    "org.opencontainers.image.description" = "Frontend PWA Dashboard Jadwal Kelas XB SMA Putra Nirmala"
    "org.opencontainers.image.source"      = "https://github.com/Frandaken/Dashboard-XB"
  }
}

# ------------------------------------------------------------------------------
# Target: Backend (Node.js 20 Express API + Push Notifications + File Storage)
# ------------------------------------------------------------------------------
target "backend" {
  context    = "."
  dockerfile = "backend/Dockerfile"
  platforms  = PLATFORMS
  tags       = [
    "dashboard-xb-backend:${TAG}"
  ]
  labels = {
    "org.opencontainers.image.title"       = "Dashboard XB Backend"
    "org.opencontainers.image.description" = "Backend API Service Dashboard Jadwal Kelas XB SMA Putra Nirmala"
    "org.opencontainers.image.source"      = "https://github.com/Frandaken/Dashboard-XB"
  }
}
