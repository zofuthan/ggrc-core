
"""Require object ownership for delete in ObjectEditor role.

Revision ID: 4838619603a
Revises: 169eef85896d
Create Date: 2013-10-24 15:05:58.124479

"""

# revision identifiers, used by Alembic.
revision = '4838619603a'
down_revision = '169eef85896d'

import json
import sqlalchemy as sa
from alembic import op
from datetime import datetime
from sqlalchemy.sql import table, column

roles_table = table('roles',
    column('id', sa.Integer),
    column('name', sa.String),
    column('permissions_json', sa.Text),
    column('description', sa.Text),
    column('modified_by_id', sa.Integer),
    column('created_at', sa.DateTime),
    column('updated_at', sa.DateTime),
    column('context_id', sa.Integer),
    )

basic_objects_editable = [
    'Categorization',
    'Category',
    'Control',
    'ControlControl',
    'ControlSection',
    'Cycle',
    'DataAsset',
    'Directive',
      'Contract',
      'Policy',
      'Regulation',
    'DirectiveControl',
    'Document',
    'Facility',
    'Help',
    'Market',
    'Objective',
    'ObjectiveControl',
    'ObjectControl',
    'ObjectDocument',
    'ObjectObjective',
    'ObjectPerson',
    'ObjectSection',
    'Option',
    'OrgGroup',
    'PopulationSample',
    'Product',
    'ProgramControl',
    'ProgramDirective',
    'Project',
    'Relationship',
    'RelationshipType',
    'Section',
    'SectionObjective',
    'SystemOrProcess',
      'System',
      'Process',
    'SystemControl',
    'SystemSystem',
    ]

basic_objects_readable = list(basic_objects_editable)
basic_objects_readable.extend([
    'ObjectOwner',
    'Person',
    'Program',
    'Role',
    #'UserRole', ?? why?
    ])

basic_objects_creatable = list(basic_objects_editable)
basic_objects_creatable.extend([
    'Person',
    ])

basic_objects_updateable = list(basic_objects_editable)
basic_objects_updateable.extend([
    'Person',
    ])

ownable = set([
    'Category', 'Control', 'DataAsset', 'Directive', 'Document', 'Facility',
    'Help', 'Market', 'Objective', 'Option', 'OrgGroup', 'Product',
    'Project', 'Section', 'System',
    ])

def deletable_entry(typename):
  if typename in ownable:
    return {
        'type': typename,
        'condition': 'contains',
        'terms': {
          'value': '$logged_in_user',
          'list_property': 'owners',
          },
        }
  else:
    return typename

def upgrade():
  do_permission_update(map(deletable_entry, basic_objects_editable))

def do_permission_update(basic_objects_deletable):
  op.execute(roles_table.update()\
      .where(roles_table.c.name == 'Reader')\
      .values(permissions_json=json.dumps({
            'read':   basic_objects_readable,
            })))
  op.execute(roles_table.update()\
      .where(roles_table.c.name == 'ObjectEditor')\
      .values(permissions_json=json.dumps({
            'create': basic_objects_creatable,
            'read':   basic_objects_readable,
            'update': basic_objects_updateable,
            'delete': basic_objects_deletable,
            })))

def downgrade():
  do_permission_update(list(basic_objects_editable))
