class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string  :name,           null: false
      t.string  :email,          null: false
      t.string  :google_uid
      t.string  :avatar_url
      t.integer :points_balance, null: false, default: 0
      t.text    :preferences,    default: "{}"
      t.string  :push_token
      t.boolean :active,         null: false, default: true

      t.timestamps
    end

    add_index :users, :email,      unique: true
    add_index :users, :google_uid, unique: true
  end
end
