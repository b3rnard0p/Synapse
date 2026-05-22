FactoryBot.define do
  factory :genre_preference do
    association :user
    genre_id   { 28 }
    genre_name { "Ação" }
  end

  factory :notification do
    association :user
    association :movie
    notification_type { "upcoming_release" }
    title { "🎬 Filme chegando!" }
    body  { "Garanta seu ingresso antecipado!" }
    read_at { nil }
  end

  factory :user_favorite do
    association :user
    association :movie
  end

  factory :checkin do
    association :user
    association :ticket
    checked_in_at { Time.current }
    points_earned { 50 }
  end
end
