# frozen_string_literal: true

# This file seeds the development database with initial data.
# Run: rails db:seed

puts "🌱 Seeding database..."

# ── Genres (TMDB genre IDs)
GENRES = [
  { id: 28,    name: "Ação" },
  { id: 12,    name: "Aventura" },
  { id: 16,    name: "Animação" },
  { id: 35,    name: "Comédia" },
  { id: 80,    name: "Crime" },
  { id: 18,    name: "Drama" },
  { id: 10751, name: "Família" },
  { id: 14,    name: "Fantasia" },
  { id: 27,    name: "Terror" },
  { id: 9648,  name: "Mistério" },
  { id: 10749, name: "Romance" },
  { id: 878,   name: "Ficção Científica" },
  { id: 53,    name: "Suspense" }
].freeze

# ── Demo User
demo_user = User.find_or_create_by!(email: "demo@synapse.app") do |u|
  u.name = "Cinéfilo Demo"
  u.google_uid = "demo_google_uid_123"
  u.avatar_url = "https://i.pravatar.cc/300?img=12"
  u.points_balance = 150
  u.active = true
end
puts "✅ Demo user: #{demo_user.email}"

# ── Genre preferences for demo user
demo_user.genre_preferences.destroy_all
[
  { id: 28, name: "Ação" },
  { id: 878, name: "Ficção Científica" },
  { id: 27, name: "Terror" }
].each do |genre|
  demo_user.genre_preferences.find_or_create_by!(genre_id: genre[:id]) do |gp|
    gp.genre_name = genre[:name]
  end
end
puts "✅ Genre preferences set"

# ── Sample Movies (will be replaced by TMDB sync in production)
movie1 = Movie.find_or_create_by!(tmdb_id: 1197306) do |m|
  m.title        = "A Minecraft Movie"
  m.overview     = "Quatro inadaptados estão mergulhados num mundo de blocos cúbicos estranho."
  m.release_date = "2025-04-02"
  m.poster_path  = "https://image.tmdb.org/t/p/w500/qoFnhqtNJtIXg0IQJD3SfLqnc8P.jpg"
  m.backdrop_path = "https://image.tmdb.org/t/p/w1280/4MC0AgWCmkUTSIWJxHy9iiTFouF.jpg"
  m.vote_average = 7.4
  m.genres       = [ { id: 12, name: "Aventura" }, { id: 35, name: "Comédia" } ].to_json
  m.is_upcoming  = false
end

movie2 = Movie.find_or_create_by!(tmdb_id: 986056) do |m|
  m.title        = "Thunderbolts*"
  m.overview     = "Um grupo de super-heróis improváveis ​​se reúnem em uma missão perigosa."
  m.release_date = "2025-05-02"
  m.poster_path  = "https://image.tmdb.org/t/p/w500/m9EtP01PFqmKSFJCmqPFQfW3lqg.jpg"
  m.backdrop_path = "https://image.tmdb.org/t/p/w1280/xJq3VNMvHCiGNPDHQJjXeKKGfJh.jpg"
  m.vote_average = 7.1
  m.genres       = [ { id: 28, name: "Ação" }, { id: 12, name: "Aventura" } ].to_json
  m.is_upcoming  = false
end
puts "✅ Sample movies created"

# ── Sample Ticket for demo user
ticket = Ticket.find_or_initialize_by(user: demo_user, movie: movie1) do |t|
  t.cinema_name      = "Cinemark Paulista"
  t.session_datetime = Time.current + 3.days
  t.original_price   = 35.00
  t.discount_percent = 20
  t.status           = "confirmed"
end
ticket.save!
puts "✅ Sample ticket created"

# ── Sample Notification
Notification.find_or_create_by!(user: demo_user, movie: movie2, notification_type: "upcoming_release") do |n|
  n.title = "🎬 Thunderbolts* está chegando!"
  n.body  = "Garanta seu ingresso antecipado com 20% de desconto. Estreia em breve!"
end
puts "✅ Sample notification created"

puts "\n🎉 Seed completed successfully!"
puts "   Demo user: demo@synapse.app"
puts "   Points balance: #{demo_user.reload.points_balance}"
