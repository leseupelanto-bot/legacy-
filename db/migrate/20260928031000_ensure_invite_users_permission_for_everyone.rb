# frozen_string_literal: true

class EnsureInviteUsersPermissionForEveryone < ActiveRecord::Migration[7.0]
  INVITE_USERS_PERMISSION = 1 << 16
  EVERYONE_ROLE_ID = -99

  def up
    safety_assured do
      execute <<~SQL.squish
        UPDATE user_roles
        SET permissions = permissions | 65536
        WHERE id = -99
      SQL
    end
  end

  def down
    # Intentionally left unchanged: this migration repairs the default
    # invite_users permission without removing permissions on rollback.
  end
end
