FactoryBot.define do
  factory :ticket do
    association :user
    association :movie
    cinema_name      { "Cinemark #{Faker::Address.city}" }
    session_datetime { 3.days.from_now }
    original_price   { 35.00 }
    discount_percent { 20 }
    status           { "confirmed" }
    qr_code          { nil }

    trait :upcoming do
      session_datetime { 3.days.from_now }
      status { "confirmed" }
    end

    trait :past do
      session_datetime { 2.days.ago }
      status { "used" }
    end

    trait :today do
      session_datetime { Time.current }
      status { "confirmed" }
    end
  end
end
