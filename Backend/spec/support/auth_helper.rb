module AuthHelper
  def auth_headers(user)
    token = JwtService.encode(user_id: user.id)
    { "Authorization" => "Bearer #{token}", "Content-Type" => "application/json" }
  end
end

RSpec.configure do |config|
  config.include AuthHelper, type: :request
end
