FactoryBot.define do
  factory :movie do
    sequence(:tmdb_id) { |n| 1_000_000 + n }
    title         { Faker::Movie.title }
    overview      { Faker::Lorem.paragraph }
    release_date  { Faker::Date.forward(days: 30).to_s }
    poster_path   { "https://image.tmdb.org/t/p/w500/sample_poster.jpg" }
    backdrop_path { "https://image.tmdb.org/t/p/w1280/sample_backdrop.jpg" }
    vote_average  { Faker::Number.decimal(l_digits: 1, r_digits: 1) }
    genres        { [ { id: 28, name: "Ação" } ].to_json }
    is_upcoming   { true }

    trait :now_playing do
      is_upcoming  { false }
      release_date { Faker::Date.backward(days: 10).to_s }
    end

    trait :releasing_soon do
      is_upcoming  { true }
      release_date { 5.days.from_now.to_date.to_s }
    end
  end
end
