require "rails_helper"

RSpec.describe Movie, type: :model do
  describe "associations" do
    it { should have_many(:tickets).dependent(:destroy) }
    it { should have_many(:user_favorites).dependent(:destroy) }
    it { should have_many(:notifications).dependent(:destroy) }
  end

  describe "validations" do
    subject { build(:movie) }

    it { should validate_presence_of(:title) }
    it { should validate_presence_of(:tmdb_id) }
    it { should validate_uniqueness_of(:tmdb_id) }
  end

  describe "scopes" do
    let!(:upcoming_movie)  { create(:movie, is_upcoming: true, release_date: 10.days.from_now.to_s) }
    let!(:past_movie)      { create(:movie, is_upcoming: true, release_date: 2.days.ago.to_s) }
    let!(:playing_movie)   { create(:movie, :now_playing) }

    it ".upcoming returns movies releasing in the future" do
      expect(Movie.upcoming).to include(upcoming_movie)
      expect(Movie.upcoming).not_to include(past_movie)
    end

    it ".now_playing returns non-upcoming movies" do
      expect(Movie.now_playing).to include(playing_movie)
      expect(Movie.now_playing).not_to include(upcoming_movie)
    end
  end

  describe "#days_until_release" do
    it "returns positive days for future releases" do
      movie = build(:movie, release_date: 5.days.from_now.to_s)
      expect(movie.days_until_release).to be_between(4, 6)
    end

    it "returns nil when no release date" do
      movie = build(:movie, release_date: nil)
      expect(movie.days_until_release).to be_nil
    end
  end

  describe "#releasing_soon?" do
    it "returns true when releasing within 14 days" do
      movie = build(:movie, :releasing_soon)
      expect(movie.releasing_soon?).to be true
    end

    it "returns false when releasing after 14 days" do
      movie = build(:movie, release_date: 20.days.from_now.to_s, is_upcoming: true)
      expect(movie.releasing_soon?).to be false
    end
  end

  describe "#genres_list" do
    it "parses JSON genres" do
      movie = build(:movie, genres: '[{"id":28,"name":"Ação"}]')
      expect(movie.genres_list).to eq([ { "id" => 28, "name" => "Ação" } ])
    end

    it "returns empty array for invalid JSON" do
      movie = build(:movie, genres: "invalid")
      expect(movie.genres_list).to eq([])
    end
  end

  describe ".find_or_create_from_tmdb" do
    let(:tmdb_data) do
      {
        tmdb_id: 999999,
        title: "Test Movie",
        overview: "A test movie",
        release_date: "2026-06-01",
        poster_url: "https://example.com/poster.jpg",
        backdrop_url: "https://example.com/backdrop.jpg",
        vote_average: 7.5,
        trailer_url: "https://youtube.com/watch?v=abc",
        genres: [ { id: 28, name: "Ação" } ],
        is_upcoming: true
      }
    end

    it "creates a new movie from TMDB data" do
      expect { Movie.find_or_create_from_tmdb(tmdb_data) }.to change(Movie, :count).by(1)
    end

    it "does not duplicate when called twice" do
      Movie.find_or_create_from_tmdb(tmdb_data)
      expect { Movie.find_or_create_from_tmdb(tmdb_data) }.not_to change(Movie, :count)
    end
  end
end
