from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    example: str = "test"

    model_config = SettingsConfigDict( # pyright: ignore[reportUnannotatedClassAttribute]
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()
