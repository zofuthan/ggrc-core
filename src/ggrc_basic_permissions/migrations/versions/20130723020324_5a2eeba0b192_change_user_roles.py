# Copyright (C) 2013 Google Inc., authors, and contributors <see AUTHORS file>
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
# Created By: dan@reciprocitylabs.com
# Maintained By: dan@reciprocitylabs.com

"""change-user-roles

Revision ID: 5a2eeba0b192
Revises: 24c924a01506
Create Date: 2013-07-23 02:03:24.978642

"""

# revision identifiers, used by Alembic.
revision = '5a2eeba0b192'
down_revision = '24c924a01506'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.execute('ALTER TABLE users_roles RENAME TO user_roles')
    op.add_column('user_roles', sa.Column('person_id', sa.Integer(), nullable=False))
    op.execute('DELETE FROM user_roles WHERE user_email NOT IN (SELECT email FROM people)')
    op.execute('UPDATE user_roles SET person_id = (SELECT id FROM people WHERE people.email = user_roles.user_email)')
    op.drop_column('user_roles', 'user_email')
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('user_roles', sa.Column(u'user_email', sa.String(length=128), nullable=False))
    op.execute('UPDATE user_roles SET user_email = (SELECT email FROM people WHERE people.id = user_roles.person_id)')
    op.drop_column('user_roles', 'person_id')
    op.execute('ALTER TABLE user_roles RENAME TO users_roles')
    ### end Alembic commands ###
