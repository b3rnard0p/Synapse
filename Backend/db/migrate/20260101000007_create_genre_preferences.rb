class CreateGenrePreferences < ActiveRecord::Migration[8.1]
  def change
    create_table :genre_preferences do |t|
      t.references :user,       null: false, foreign_key: true
      t.integer    :genre_id,   null: false
      t.string     :genre_name, null: false

      t.timestamps
    end

    add_index :genre_preferences, [ :user_id, :genre_id ], unique: true
  end
end
