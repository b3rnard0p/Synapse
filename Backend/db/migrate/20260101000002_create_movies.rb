class CreateMovies < ActiveRecord::Migration[8.1]
  def change
    create_table :movies do |t|
      t.integer :tmdb_id,       null: false
      t.string  :title,         null: false
      t.text    :overview
      t.string  :release_date
      t.string  :poster_path
      t.string  :backdrop_path
      t.string  :trailer_url
      t.decimal :vote_average,  precision: 3, scale: 1
      t.text    :genres,        default: "[]"
      t.boolean :is_upcoming,   null: false, default: false

      t.timestamps
    end

    add_index :movies, :tmdb_id, unique: true
    add_index :movies, :is_upcoming
    add_index :movies, :release_date
  end
end
