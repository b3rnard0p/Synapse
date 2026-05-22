# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_01_01_000007) do
  create_table "checkins", force: :cascade do |t|
    t.datetime "checked_in_at", default: -> { "CURRENT_TIMESTAMP" }, null: false
    t.datetime "created_at", null: false
    t.integer "points_earned", default: 0, null: false
    t.integer "ticket_id", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["ticket_id"], name: "index_checkins_on_ticket_id", unique: true
    t.index ["user_id"], name: "index_checkins_on_user_id"
  end

  create_table "genre_preferences", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "genre_id", null: false
    t.string "genre_name", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["user_id", "genre_id"], name: "index_genre_preferences_on_user_id_and_genre_id", unique: true
    t.index ["user_id"], name: "index_genre_preferences_on_user_id"
  end

  create_table "movies", force: :cascade do |t|
    t.string "backdrop_path"
    t.datetime "created_at", null: false
    t.text "genres", default: "[]"
    t.boolean "is_upcoming", default: false, null: false
    t.text "overview"
    t.string "poster_path"
    t.string "release_date"
    t.string "title", null: false
    t.integer "tmdb_id", null: false
    t.string "trailer_url"
    t.datetime "updated_at", null: false
    t.decimal "vote_average", precision: 3, scale: 1
    t.index ["is_upcoming"], name: "index_movies_on_is_upcoming"
    t.index ["release_date"], name: "index_movies_on_release_date"
    t.index ["tmdb_id"], name: "index_movies_on_tmdb_id", unique: true
  end

  create_table "notifications", force: :cascade do |t|
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.integer "movie_id"
    t.string "notification_type", null: false
    t.datetime "read_at"
    t.datetime "sent_at"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["movie_id"], name: "index_notifications_on_movie_id"
    t.index ["notification_type"], name: "index_notifications_on_notification_type"
    t.index ["read_at"], name: "index_notifications_on_read_at"
    t.index ["user_id", "read_at"], name: "index_notifications_on_user_id_and_read_at"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "tickets", force: :cascade do |t|
    t.string "cinema_name", null: false
    t.datetime "created_at", null: false
    t.integer "discount_percent", default: 20, null: false
    t.integer "movie_id", null: false
    t.decimal "original_price", precision: 8, scale: 2
    t.text "qr_code"
    t.string "seat"
    t.datetime "session_datetime", null: false
    t.string "status", default: "confirmed", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["movie_id"], name: "index_tickets_on_movie_id"
    t.index ["session_datetime"], name: "index_tickets_on_session_datetime"
    t.index ["status"], name: "index_tickets_on_status"
    t.index ["user_id"], name: "index_tickets_on_user_id"
  end

  create_table "user_favorites", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.integer "movie_id", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["movie_id"], name: "index_user_favorites_on_movie_id"
    t.index ["user_id", "movie_id"], name: "index_user_favorites_on_user_id_and_movie_id", unique: true
    t.index ["user_id"], name: "index_user_favorites_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.string "avatar_url"
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "google_uid"
    t.string "name", null: false
    t.integer "points_balance", default: 0, null: false
    t.text "preferences", default: "{}"
    t.string "push_token"
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["google_uid"], name: "index_users_on_google_uid", unique: true
  end

  add_foreign_key "checkins", "tickets"
  add_foreign_key "checkins", "users"
  add_foreign_key "genre_preferences", "users"
  add_foreign_key "notifications", "movies"
  add_foreign_key "notifications", "users"
  add_foreign_key "tickets", "movies"
  add_foreign_key "tickets", "users"
  add_foreign_key "user_favorites", "movies"
  add_foreign_key "user_favorites", "users"
end
