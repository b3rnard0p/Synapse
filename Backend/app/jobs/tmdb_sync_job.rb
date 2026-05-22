class TmdbSyncJob < ApplicationJob
  queue_as :default

  # Syncs upcoming and now-playing movies from TMDB into the local DB
  # and dispatches notifications to users with matching genre preferences
  def perform
    Rails.logger.info("[TmdbSyncJob] Starting TMDB sync...")
    service = TmdbService.new

    sync_upcoming(service)
    sync_now_playing(service)

    Rails.logger.info("[TmdbSyncJob] Sync completed.")
  rescue StandardError => e
    Rails.logger.error("[TmdbSyncJob] Error: #{e.message}")
    raise
  end

  private

  def sync_upcoming(service)
    result = service.upcoming
    (result[:results] || []).each do |movie_data|
      movie_data[:is_upcoming] = true
      movie = Movie.find_or_create_from_tmdb(movie_data)
      notify_interested_users(movie) if movie.releasing_soon?
    end
  end

  def sync_now_playing(service)
    result = service.now_playing
    (result[:results] || []).each do |movie_data|
      movie_data[:is_upcoming] = false
      Movie.find_or_create_from_tmdb(movie_data)
    end
  end

  def notify_interested_users(movie)
    genre_ids = movie.genres_list.map { |g| g.is_a?(Hash) ? g["id"] || g[:id] : g }.compact

    users_to_notify = User.joins(:genre_preferences)
                          .where(genre_preferences: { genre_id: genre_ids })
                          .with_push_token
                          .distinct

    users_to_notify.find_each do |user|
      NotificationDispatchJob.perform_later(user.id, "upcoming_release", movie.id)
    end
  end
end
