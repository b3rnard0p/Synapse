class User < ApplicationRecord
  has_secure_password :password, validations: false

  # Associations
  has_many :tickets, dependent: :destroy
  has_many :checkins, dependent: :destroy
  has_many :user_favorites, dependent: :destroy
  has_many :favorite_movies, through: :user_favorites, source: :movie
  has_many :notifications, dependent: :destroy
  has_many :genre_preferences, dependent: :destroy

  # Validations
  validates :email, presence: true, uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true
  validates :points_balance, numericality: { greater_than_or_equal_to: 0 }

  # Normalize email
  normalizes :email, with: ->(e) { e.strip.downcase }

  # Scopes
  scope :active, -> { where(active: true) }
  scope :with_push_token, -> { where.not(push_token: nil) }

  # Instance methods
  def add_points!(amount, reason: nil)
    increment!(:points_balance, amount)
    Rails.logger.info("[Points] User #{id} earned #{amount} points. Reason: #{reason}")
  end

  def redeem_points!(amount)
    raise "Pontos insuficientes" if points_balance < amount

    decrement!(:points_balance, amount)
  end

  def preferences_hash
    preferences.is_a?(String) ? JSON.parse(preferences) : (preferences || {})
  rescue JSON::ParserError
    {}
  end

  def genre_ids
    genre_preferences.pluck(:genre_id)
  end
end
