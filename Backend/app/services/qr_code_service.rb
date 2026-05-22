require "rqrcode"
require "base64"

class QrCodeService
  # Generates a QR Code as a base64 PNG string
  def self.generate(data)
    qr = RQRCode::QRCode.new(data, level: :m)

    # Generate SVG for lightweight rendering
    svg = qr.as_svg(
      offset: 0,
      color: "000",
      shape_rendering: "crispEdges",
      module_size: 6,
      standalone: true
    )

    Base64.strict_encode64(svg)
  end

  # Generate ticket QR Code payload
  def self.ticket_payload(ticket)
    {
      ticket_id: ticket.id,
      user_id: ticket.user_id,
      movie: ticket.movie.title,
      cinema: ticket.cinema_name,
      session: ticket.session_datetime.iso8601,
      discount: "#{ticket.discount_percent}%",
      generated_at: Time.current.iso8601
    }.to_json
  end

  # Generate and return the full QR code data for a ticket
  def self.generate_for_ticket(ticket)
    ticket_payload(ticket)
  end
end
