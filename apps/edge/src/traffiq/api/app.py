from fastapi import FastAPI

from traffiq.api.router import router

app = FastAPI(
    title="TraffIQ Edge",
    version="0.1.0",
)

app.include_router(router)
