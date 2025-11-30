# Use Python 3.13 as required by pyproject.toml
FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Place executables in the environment at the front of the path
ENV PATH="/app/.venv/bin:$PATH"

# Compile bytecode
# https://docs.astral.sh/uv/guides/integration/docker/#compiling-bytecode
ENV UV_COMPILE_BYTECODE=1

# uv Cache
# https://docs.astral.sh/uv/guides/integration/docker/#caching
ENV UV_LINK_MODE=copy

# Install dependencies
# Using --mount=type=cache allows sharing the uv cache across builds
# Using --mount=type=bind allows reading files without copying them into layers
# --no-install-project skips installing the project itself, just dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-project --no-cache

# Copy the rest of the application
ADD . /app

# Install the project and sync
# This step installs the project itself and any remaining dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-cache

# Expose the port
EXPOSE 8000

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Set entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

# Command to run the application
# We use the executable directly since PATH is set
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
