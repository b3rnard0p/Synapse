require "httparty"

class TmdbService
  include HTTParty
  BASE_URL = "https://api.themoviedb.org/3".freeze
  IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500".freeze
  BACKDROP_BASE_URL = "https://image.tmdb.org/t/p/w1280".freeze

  def initialize
    @api_key = Rails.application.credentials.dig(:tmdb, :api_key) ||
               ENV.fetch("TMDB_API_KEY", nil)
  end

  # Upcoming movies (próximas estreias)
  def upcoming(page: 1, language: "pt-BR")
    response = get("/movie/upcoming", query: default_params(page:, language:))
    parse_movie_list(response)
  end

  # Now playing in theaters (em cartaz)
  def now_playing(page: 1, language: "pt-BR")
    response = get("/movie/now_playing", query: default_params(page:, language:))
    parse_movie_list(response)
  end

  # Search movies
  def search(query:, page: 1, language: "pt-BR")
    response = get("/search/movie", query: default_params(page:, language:, query:))
    parse_movie_list(response)
  end

  # Movie details
  def movie_details(tmdb_id, language: "pt-BR")
    params = default_params(language:).merge(append_to_response: "credits,videos")
    response = get("/movie/#{tmdb_id}", query: params)
    return nil unless response.success?

    parse_movie_detail(response.parsed_response)
  end

  # Available genres
  def genres(language: "pt-BR")
    response = get("/genre/movie/list", query: default_params(language:))
    return [] unless response.success?

    response.parsed_response.dig("genres") || []
  end

  # Full poster URL
  def self.poster_url(path, size: "w500")
    return nil if path.blank?

    "https://image.tmdb.org/t/p/#{size}#{path}"
  end

  # Full backdrop URL
  def self.backdrop_url(path)
    return nil if path.blank?

    "#{BACKDROP_BASE_URL}#{path}"
  end

  # YouTube trailer URL from videos
  def self.trailer_url(videos)
    return nil if videos.blank?

    trailer = videos.find { |v| v["type"] == "Trailer" && v["site"] == "YouTube" }
    trailer ||= videos.find { |v| v["site"] == "YouTube" }
    return nil unless trailer

    "https://www.youtube.com/watch?v=#{trailer["key"]}"
  end

  private

  def get(path, query: {})
    self.class.get("#{BASE_URL}#{path}", query:)
  end

  def default_params(page: 1, language: "pt-BR", **extra)
    { api_key: @api_key, page:, language: }.merge(extra)
  end

  def parse_movie_list(response)
    return { results: [], total_pages: 0, total_results: 0 } unless response.success?

    data = response.parsed_response
    {
      results: (data["results"] || []).map { |m| parse_movie_summary(m) },
      total_pages: data["total_pages"] || 0,
      total_results: data["total_results"] || 0
    }
  end

  def parse_movie_summary(movie)
    {
      tmdb_id: movie["id"],
      title: movie["title"],
      overview: movie["overview"],
      release_date: movie["release_date"],
      poster_url: self.class.poster_url(movie["poster_path"]),
      backdrop_url: self.class.backdrop_url(movie["backdrop_path"]),
      vote_average: movie["vote_average"],
      genre_ids: movie["genre_ids"] || []
    }
  end

  def parse_movie_detail(movie)
    credits = movie["credits"] || {}
    videos = (movie.dig("videos", "results") || [])

    {
      tmdb_id: movie["id"],
      title: movie["title"],
      overview: movie["overview"],
      release_date: movie["release_date"],
      poster_url: self.class.poster_url(movie["poster_path"]),
      backdrop_url: self.class.backdrop_url(movie["backdrop_path"]),
      vote_average: movie["vote_average"],
      runtime: movie["runtime"],
      genres: (movie["genres"] || []).map { |g| { id: g["id"], name: g["name"] } },
      cast: parse_cast(credits["cast"]),
      trailer_url: self.class.trailer_url(videos),
      tagline: movie["tagline"],
      status: movie["status"]
    }
  end

  def parse_cast(cast)
    return [] if cast.blank?

    cast.first(10).map do |member|
      {
        id: member["id"],
        name: member["name"],
        character: member["character"],
        profile_url: self.class.poster_url(member["profile_path"])
      }
    end
  end
end
