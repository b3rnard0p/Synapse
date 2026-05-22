class Ticket < ApplicationRecord
  STATUSES = %w[pending confirmed used expired].freeze
  DISCOUNT_PERCENT = 20

  # Associations
  belongs_to :user
  belongs_to :movie
  has_one :checkin, dependent: :destroy

  # Validations
  validates :cinema_name, presence: true
  validates :session_datetime, presence: true
  validates :status, inclusion: { in: STATUSES }
  validates :discount_percent, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }

  # Callbacks
  before_create :generate_qr_code
  after_create :schedule_session_reminder

  # Scopes
  scope :active, -> { where(status: %w[pending confirmed]) }
  scope :upcoming, -> { where("session_datetime > ?", Time.current).order(:session_datetime) }
  scope :past, -> { where("session_datetime < ?", Time.current) }
  scope :used, -> { where(status: "used") }

  # State machine methods
  def confirm!
    update!(status: "confirmed")
  end

  def mark_used!
    update!(status: "used")
  end

  def expire!
    update!(status: "expired")
  end

  def checked_in?
    checkin.present?
  end

  def can_checkin?
    confirmed? && session_datetime_today? && !checked_in?
  end

  def confirmed?
    status == "confirmed"
  end

  def session_datetime_today?
    session_datetime.to_date == Date.today
  end

  def discounted_price
    return original_price if original_price.nil?

    original_price * (1 - discount_percent / 100.0)
  end

  private

  def generate_qr_code
    self.qr_code = QrCodeService.generate_for_ticket(self)
  rescue StandardError => e
    Rails.logger.error("[Ticket] QR Code generation failed: #{e.message}")
    self.qr_code = nil
  end

  def schedule_session_reminder
    return unless session_datetime.future?

    remind_at = session_datetime.beginning_of_day
    SessionReminderJob.set(wait_until: remind_at).perform_later(id)
  end
end
