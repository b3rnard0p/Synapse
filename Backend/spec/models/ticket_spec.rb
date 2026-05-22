require "rails_helper"

RSpec.describe Ticket, type: :model do
  describe "associations" do
    it { should belong_to(:user) }
    it { should belong_to(:movie) }
    it { should have_one(:checkin).dependent(:destroy) }
  end

  describe "validations" do
    subject { build(:ticket) }

    it { should validate_presence_of(:cinema_name) }
    it { should validate_presence_of(:session_datetime) }
    it { should validate_inclusion_of(:status).in_array(Ticket::STATUSES) }
  end

  describe "#discounted_price" do
    let(:ticket) { build(:ticket, original_price: 50.00, discount_percent: 20) }

    it "applies the discount correctly" do
      expect(ticket.discounted_price).to eq(40.00)
    end
  end

  describe "#can_checkin?" do
    context "when ticket is confirmed and session is today" do
      let(:ticket) { build(:ticket, :today, status: "confirmed") }

      it "returns true when not checked in" do
        allow(ticket).to receive(:checked_in?).and_return(false)
        expect(ticket.can_checkin?).to be true
      end

      it "returns false when already checked in" do
        allow(ticket).to receive(:checked_in?).and_return(true)
        expect(ticket.can_checkin?).to be false
      end
    end

    context "when ticket is not for today" do
      let(:ticket) { build(:ticket, :upcoming, status: "confirmed") }

      it "returns false" do
        allow(ticket).to receive(:checked_in?).and_return(false)
        expect(ticket.can_checkin?).to be false
      end
    end

    context "when ticket is not confirmed" do
      let(:ticket) { build(:ticket, status: "used") }

      it "returns false" do
        expect(ticket.can_checkin?).to be false
      end
    end
  end

  describe "status transitions" do
    let(:ticket) { create(:ticket, status: "confirmed") }

    it "#confirm! sets status to confirmed" do
      ticket.update!(status: "pending")
      ticket.confirm!
      expect(ticket.reload.status).to eq("confirmed")
    end

    it "#mark_used! sets status to used" do
      ticket.mark_used!
      expect(ticket.reload.status).to eq("used")
    end

    it "#expire! sets status to expired" do
      ticket.expire!
      expect(ticket.reload.status).to eq("expired")
    end
  end
end
