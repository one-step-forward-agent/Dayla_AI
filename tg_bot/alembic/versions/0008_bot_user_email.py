"""add users.email so the schema matches a database shared with the Focus Day backend"""
from alembic import op
import sqlalchemy as sa


revision = "bot_0008_user_email"
down_revision = "0007_conversation_messages"
branch_labels = None
depends_on = None


def upgrade():
    if "email" not in {column["name"] for column in sa.inspect(op.get_bind()).get_columns("users")}:
        op.add_column("users", sa.Column("email", sa.String(320), nullable=True))


def downgrade():
    op.drop_column("users", "email")
