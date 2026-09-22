from fastapi import APIRouter

from traffiq.api.routes.health import health_router

router = APIRouter()

router.include_router(health_router)
