require "rails_helper"

RSpec.describe JwtService do
  let(:payload) { { user_id: 42 } }

  describe ".encode" do
    it "returns a JWT string" do
      token = JwtService.encode(payload)
      expect(token).to be_a(String)
      expect(token.split(".").length).to eq(3)
    end
  end

  describe ".decode" do
    it "decodes a valid token and returns the payload" do
      token = JwtService.encode(payload)
      decoded = JwtService.decode(token)
      expect(decoded[:user_id]).to eq(42)
    end

    it "returns nil for an invalid token" do
      expect(JwtService.decode("invalid.token.here")).to be_nil
    end

    it "returns nil for an expired token" do
      token = JWT.encode(
        payload.merge(exp: 1.hour.ago.to_i),
        JwtService::SECRET_KEY,
        JwtService::ALGORITHM
      )
      expect(JwtService.decode(token)).to be_nil
    end
  end
end
