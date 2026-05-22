class Movie < ApplicationRecord
  # Associations
  has_many :tickets, dependent: :destroy
  has_many :user_favorites, dependent: :destroy
  has_many :favorited_by_users, through: :user_favorites, source: :user
  has_many :notifications, dependent: :destroy

  # Validations
  validates :tmdb_id, presence: true, uniqueness: true
  validates :title, presence: true

  # Scopes
  scope :upcoming, -> { where(is_upcoming: true).where("release_date >= ?", Date.today).order(:release_date) }
  scope :now_playing, -> { where(is_upcoming: false).order(vote_average: :desc) }
  scope :by_genre, ->(genre_id) { where("genre_ids LIKE ?", "%#{genre_id}%") }
  scope :recent, -> { order(created_at: :desc) }

  # Instance methods
  def genres_list
    parsed = genres.is_a?(String) ? JSON.parse(genres) : (genres || [])
    parsed.is_a?(Array) ? parsed : []
  rescue JSON::ParserError
    []
  end

  def days_until_release
    return nil unless release_date

    (release_date.to_date - Date.today).to_i
  end

  def releasing_soon?
    return false unless release_date

    days_until_release.between?(1, 14)
  end

  def poster_url_full
    TmdbService.poster_url(poster_path)
  end

  def backdrop_url_full
    TmdbService.backdrop_url(backdrop_path)
  end

  # Class methods
  def self.find_or_create_from_tmdb(tmdb_data)
    find_or_initialize_by(tmdb_id: tmdb_data[:tmdb_id]).tap do |movie|
      movie.assign_attributes(
        title: tmdb_data[:title],
        overview: tmdb_data[:overview],
        release_date: tmdb_data[:release_date],
        poster_path: tmdb_data[:poster_url],
        backdrop_path: tmdb_data[:backdrop_url],
        vote_average: tmdb_data[:vote_average],
        trailer_url: tmdb_data[:trailer_url],
        genres: tmdb_data[:genres].to_json,
        is_upcoming: tmdb_data.fetch(:is_upcoming, false)
      )
      movie.save!
    end
  end
end
