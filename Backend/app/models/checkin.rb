class Checkin < ApplicationRecord
  POINTS_EARNED = 50

  # Associations
  belongs_to :user
  belongs_to :ticket

  # Validations
  validates :ticket_id, uniqueness: { message: "Check-in já realizado para este ingresso" }
  validate :ticket_must_be_confirmable

  # Callbacks
  after_create :award_points

  private

  def ticket_must_be_confirmable
    return unless ticket

    unless ticket.can_checkin?
      errors.add(:ticket, "não está disponível para check-in")
    end
  end

  def award_points
    self.update_column(:points_earned, POINTS_EARNED)
    user.add_points!(POINTS_EARNED, reason: "Check-in: #{ticket.movie.title}")
    ticket.mark_used!
  end
end
