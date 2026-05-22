require "jwt"

module JwtService
  SECRET_KEY = Rails.application.credentials.dig(:jwt, :secret_key) ||
               ENV.fetch("JWT_SECRET_KEY", Rails.application.secret_key_base)

  ALGORITHM = "HS256".freeze
  EXPIRATION = 30.days

  def self.encode(payload)
    payload = payload.merge(exp: EXPIRATION.from_now.to_i, iat: Time.now.to_i)
    JWT.encode(payload, SECRET_KEY, ALGORITHM)
  end

  def self.decode(token)
    decoded = JWT.decode(token, SECRET_KEY, true, algorithm: ALGORITHM)
    HashWithIndifferentAccess.new(decoded.first)
  rescue JWT::ExpiredSignature
    nil
  rescue JWT::DecodeError
    nil
  end
end
