import * as migration_20261018_161052_initial from './20261018_161052_initial';
import * as migration_20261018_170624_mfa_and_audit_immutable from './20261018_170624_mfa_and_audit_immutable';
import * as migration_20261019_072421_ui_proto_fields from './20261019_072421_ui_proto_fields';

export const migrations = [
  {
    up: migration_20261018_161052_initial.up,
    down: migration_20261018_161052_initial.down,
    name: '20261018_161052_initial',
  },
  {
    up: migration_20261018_170624_mfa_and_audit_immutable.up,
    down: migration_20261018_170624_mfa_and_audit_immutable.down,
    name: '20261018_170624_mfa_and_audit_immutable',
  },
  {
    up: migration_20261019_072421_ui_proto_fields.up,
    down: migration_20261019_072421_ui_proto_fields.down,
    name: '20261019_072421_ui_proto_fields'
  },
];
