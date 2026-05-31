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
    params = default_params(language:).merge(append_to_response: "credits,videos,watch/providers,similar")
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

  # Discover movies by genres
  def discover_by_genres(genre_ids, page: 1, language: "pt-BR")
    return { results: [], total_pages: 0, total_results: 0 } if genre_ids.empty?

    genres_str = genre_ids.join(",")
    response = get("/discover/movie", query: default_params(page:, language:, with_genres: genres_str))
    parse_movie_list(response)
  end

  # Person details (Actor/Crew)
  def person_details(person_id, language: "pt-BR")
    params = default_params(language:).merge(append_to_response: "movie_credits")
    response = get("/person/#{person_id}", query: params)
    return nil unless response.success?

    parse_person_detail(response.parsed_response)
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
    
    # Watch Providers (prioritize BR, fallback to US)
    providers_data = movie.dig("watch/providers", "results") || {}
    country_providers = providers_data["BR"] || providers_data["US"] || {}
    flatrate = country_providers["flatrate"] || []
    
    watch_providers = flatrate.map do |p|
      {
        provider_id: p["provider_id"],
        provider_name: p["provider_name"],
        logo_url: self.class.poster_url(p["logo_path"], size: "w92")
      }
    end

    # Similar movies
    similar_movies = (movie.dig("similar", "results") || []).map { |m| parse_movie_summary(m) }

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
      status: movie["status"],
      watch_providers: watch_providers,
      similar: similar_movies
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

  def parse_person_detail(person)
    movie_credits = (person.dig("movie_credits", "cast") || [])
      .sort_by { |m| m["popularity"] || 0 }
      .reverse
      .map { |m| parse_movie_summary(m) }
      .reject { |m| m[:poster_url].nil? } # Filter out movies without posters for cleaner UI

    {
      id: person["id"],
      name: person["name"],
      biography: person["biography"],
      birthday: person["birthday"],
      place_of_birth: person["place_of_birth"],
      known_for_department: person["known_for_department"],
      profile_url: self.class.poster_url(person["profile_path"], size: "h632"),
      movies: movie_credits
    }
  end
end
