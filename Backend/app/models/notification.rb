class Notification < ApplicationRecord
  TYPES = %w[upcoming_release purchase_confirmation session_reminder reward_earned].freeze

  # Associations
  belongs_to :user
  belongs_to :movie, optional: true

  # Validations
  validates :notification_type, inclusion: { in: TYPES }
  validates :title, presence: true
  validates :body, presence: true

  # Scopes
  scope :unread, -> { where(read_at: nil) }
  scope :read, -> { where.not(read_at: nil) }
  scope :recent, -> { order(created_at: :desc) }

  # Instance methods
  def mark_as_read!
    update!(read_at: Time.current) if read_at.nil?
  end

  def read?
    read_at.present?
  end
end
