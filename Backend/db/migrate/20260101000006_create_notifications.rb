class CreateNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :notifications do |t|
      t.references :user,              null: false, foreign_key: true
      t.references :movie,             foreign_key: true
      t.string     :notification_type, null: false
      t.string     :title,             null: false
      t.text       :body,              null: false
      t.datetime   :sent_at
      t.datetime   :read_at

      t.timestamps
    end

    add_index :notifications, :notification_type
    add_index :notifications, :read_at
    add_index :notifications, [ :user_id, :read_at ]
  end
end
