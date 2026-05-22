class NotificationDispatchJob < ApplicationJob
  queue_as :notifications

  MESSAGES = {
    "upcoming_release" => {
      title: ->(movie) { "🎬 #{movie.title} está chegando!" },
      body:  ->(movie) { "Garanta seu ingresso antecipado com #{Ticket::DISCOUNT_PERCENT}% de desconto. Estreia em #{movie.days_until_release} dias!" }
    },
    "purchase_confirmation" => {
      title: ->(movie) { "✅ Ingresso confirmado!" },
      body:  ->(movie) { "Seu ingresso para #{movie.title} está garantido. Boa sessão!" }
    },
    "session_reminder" => {
      title: ->(movie) { "🍿 Hoje é dia de cinema!" },
      body:  ->(movie) { "Você tem uma sessão de #{movie.title} hoje. Não se esqueça!" }
    },
    "reward_earned" => {
      title: ->(_movie) { "🏆 Recompensa disponível!" },
      body:  ->(_movie) { "Você acumulou pontos suficientes para resgatar uma recompensa!" }
    }
  }.freeze

  def perform(user_id, notification_type, movie_id = nil)
    user  = User.find_by(id: user_id)
    movie = movie_id ? Movie.find_by(id: movie_id) : nil

    return unless user

    messages = MESSAGES[notification_type]
    return unless messages

    Notification.create!(
      user: user,
      movie: movie,
      notification_type: notification_type,
      title: messages[:title].call(movie || OpenStruct.new(title: "Synapse")),
      body: messages[:body].call(movie || OpenStruct.new(title: "Synapse", days_until_release: 0))
    )

    Rails.logger.info("[NotificationDispatchJob] Notification sent to user #{user_id}: #{notification_type}")
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error("[NotificationDispatchJob] Failed: #{e.message}")
  end
end
