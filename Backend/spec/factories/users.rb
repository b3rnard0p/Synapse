FactoryBot.define do
  factory :user do
    name          { Faker::Name.full_name }
    email         { Faker::Internet.unique.email }
    google_uid    { Faker::Alphanumeric.unique.alphanumeric(number: 21) }
    avatar_url    { Faker::Internet.url }
    points_balance { 0 }
    active        { true }

    trait :with_points do
      points_balance { 200 }
    end

    trait :with_push_token do
      push_token { "ExponentPushToken[#{Faker::Alphanumeric.alphanumeric(number: 22)}]" }
    end

    trait :with_genre_preferences do
      after(:create) do |user|
        create(:genre_preference, user: user, genre_id: 28,  genre_name: "Ação")
        create(:genre_preference, user: user, genre_id: 878, genre_name: "Ficção Científica")
      end
    end
  end
end
