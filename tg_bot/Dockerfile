FROM python:3.12

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    RUN_MIGRATIONS=false

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt
COPY . .

RUN useradd --create-home --uid 10001 bot
USER bot

# The bot normally shares the backend's database, whose Alembic chain already contains every bot
# migration, so the bot's own migrations run only for a standalone database (RUN_MIGRATIONS=true).
CMD ["sh", "-c", "if [ \"$RUN_MIGRATIONS\" = true ]; then until alembic upgrade head; do echo 'Database is unavailable, retrying in 3s...'; sleep 3; done; fi; exec python -m bot.main"]
