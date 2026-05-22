class GenrePreference < ApplicationRecord
  # Associations
  belongs_to :user

  # Validations
  validates :genre_id, presence: true
  validates :genre_name, presence: true
  validates :genre_id, uniqueness: { scope: :user_id, message: "Gênero já adicionado" }
end
