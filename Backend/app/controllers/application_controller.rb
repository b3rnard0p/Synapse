class ApplicationController < ActionController::API
  include ActionController::HttpAuthentication::Token::ControllerMethods

  before_action :authenticate_user!

  private

  def authenticate_user!
    token = extract_token_from_header
    return render_unauthorized unless token

    decoded = JwtService.decode(token)
    return render_unauthorized unless decoded

    @current_user = User.find_by(id: decoded[:user_id])
    render_unauthorized unless @current_user
  end

  def current_user
    @current_user
  end

  def extract_token_from_header
    header = request.headers["Authorization"]
    return nil unless header&.start_with?("Bearer ")

    header.split(" ").last
  end

  def render_unauthorized
    render json: { error: "Não autorizado" }, status: :unauthorized
  end

  def render_not_found(resource = "Recurso")
    render json: { error: "#{resource} não encontrado" }, status: :not_found
  end

  def render_unprocessable(errors)
    render json: { errors: errors }, status: :unprocessable_entity
  end
end
