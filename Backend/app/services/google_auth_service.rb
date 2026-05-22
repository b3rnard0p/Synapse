require "httparty"

class GoogleAuthService
  GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo".freeze
  GOOGLE_USERINFO_URL   = "https://www.googleapis.com/oauth2/v3/userinfo".freeze

  attr_reader :error

  def initialize(id_token)
    @id_token = id_token
  end

  # Verify the Google ID token and return user info hash
  # Returns nil and sets @error if verification fails
  def verify!
    response = HTTParty.get(GOOGLE_TOKEN_INFO_URL, query: { id_token: @id_token })

    unless response.success?
      @error = "Token Google inválido"
      return nil
    end

    data = response.parsed_response
    unless valid_audience?(data["aud"])
      @error = "Token não pertence a este aplicativo"
      return nil
    end

    {
      google_uid: data["sub"],
      email: data["email"],
      name: data["name"],
      avatar_url: data["picture"],
      email_verified: data["email_verified"] == "true"
    }
  rescue StandardError => e
    @error = "Erro ao verificar token: #{e.message}"
    nil
  end

  private

  def valid_audience?(aud)
    client_id = Rails.application.credentials.dig(:google, :client_id) ||
                ENV.fetch("GOOGLE_CLIENT_ID", nil)
    return true if client_id.nil? # Allow in dev without config

    aud == client_id
  end
end
