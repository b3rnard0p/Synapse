class SessionReminderJob < ApplicationJob
  queue_as :default

  # Called on the day of the session to remind the user
  def perform(ticket_id)
    ticket = Ticket.includes(:movie, :user).find_by(id: ticket_id)
    return unless ticket
    return if ticket.used? || ticket.expired?

    NotificationDispatchJob.perform_later(
      ticket.user_id,
      "session_reminder",
      ticket.movie_id
    )

    Rails.logger.info("[SessionReminderJob] Reminder sent for ticket #{ticket_id}")
  end
end
