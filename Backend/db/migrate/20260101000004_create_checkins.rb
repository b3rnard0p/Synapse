class CreateCheckins < ActiveRecord::Migration[8.1]
  def change
    create_table :checkins do |t|
      t.references :user,   null: false, foreign_key: true
      t.references :ticket, null: false, foreign_key: true, index: { unique: true }
      t.datetime   :checked_in_at, null: false, default: -> { "CURRENT_TIMESTAMP" }
      t.integer    :points_earned, null: false, default: 0

      t.timestamps
    end
  end
end
