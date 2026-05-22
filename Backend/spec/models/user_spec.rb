require "rails_helper"

RSpec.describe User, type: :model do
  describe "associations" do
    it { should have_many(:tickets).dependent(:destroy) }
    it { should have_many(:checkins).dependent(:destroy) }
    it { should have_many(:user_favorites).dependent(:destroy) }
    it { should have_many(:favorite_movies).through(:user_favorites) }
    it { should have_many(:notifications).dependent(:destroy) }
    it { should have_many(:genre_preferences).dependent(:destroy) }
  end

  describe "validations" do
    subject { build(:user) }

    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:email).case_insensitive }
    it { should validate_numericality_of(:points_balance).is_greater_than_or_equal_to(0) }

    it "validates email format" do
      user = build(:user, email: "not-an-email")
      expect(user).not_to be_valid
      expect(user.errors[:email]).to be_present
    end
  end

  describe "#add_points!" do
    let(:user) { create(:user, points_balance: 0) }

    it "increments the points balance" do
      expect { user.add_points!(50) }.to change { user.reload.points_balance }.from(0).to(50)
    end

    it "accumulates multiple additions" do
      user.add_points!(50)
      user.add_points!(100)
      expect(user.reload.points_balance).to eq(150)
    end
  end

  describe "#redeem_points!" do
    let(:user) { create(:user, points_balance: 100) }

    it "decrements the points balance" do
      expect { user.redeem_points!(50) }.to change { user.reload.points_balance }.from(100).to(50)
    end

    it "raises an error when insufficient points" do
      expect { user.redeem_points!(200) }.to raise_error(RuntimeError, /insuficientes/)
    end
  end

  describe "#preferences_hash" do
    it "returns an empty hash for nil preferences" do
      user = build(:user, preferences: nil)
      expect(user.preferences_hash).to eq({})
    end

    it "parses JSON string preferences" do
      user = build(:user, preferences: '{"theme":"dark"}')
      expect(user.preferences_hash).to eq({ "theme" => "dark" })
    end
  end

  describe "email normalization" do
    it "downcases the email" do
      user = create(:user, email: "TEST@SYNAPSE.APP")
      expect(user.email).to eq("test@synapse.app")
    end
  end

  describe "scopes" do
    let!(:active_user) { create(:user, active: true) }
    let!(:inactive_user) { create(:user, active: false) }
    let!(:user_with_token) { create(:user, :with_push_token) }

    it ".active returns only active users" do
      expect(User.active).to include(active_user)
      expect(User.active).not_to include(inactive_user)
    end

    it ".with_push_token returns users with push tokens" do
      expect(User.with_push_token).to include(user_with_token)
      expect(User.with_push_token).not_to include(active_user)
    end
  end
end
