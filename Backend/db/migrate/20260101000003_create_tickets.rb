class CreateTickets < ActiveRecord::Migration[8.1]
  def change
    create_table :tickets do |t|
      t.references :user,              null: false, foreign_key: true
      t.references :movie,             null: false, foreign_key: true
      t.string     :cinema_name,       null: false
      t.datetime   :session_datetime,  null: false
      t.string     :seat
      t.decimal    :original_price,    precision: 8, scale: 2
      t.integer    :discount_percent,  null: false, default: 20
      t.text       :qr_code
      t.string     :status,            null: false, default: "confirmed"

      t.timestamps
    end

    add_index :tickets, :status
    add_index :tickets, :session_datetime
  end
end
