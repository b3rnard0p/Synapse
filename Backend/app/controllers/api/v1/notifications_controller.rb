module Api
  module V1
    class NotificationsController < ApplicationController
      # GET /api/v1/users/:user_id/notifications
      def index
        notifications = current_user.notifications
                                    .recent
                                    .limit(50)

        render json: {
          notifications: notifications.map { |n| notification_json(n) },
          unread_count: current_user.notifications.unread.count
        }, status: :ok
      end

      # PATCH /api/v1/users/:user_id/notifications/:id
      # Marks a notification as read
      def update
        notification = current_user.notifications.find(params[:id])
        notification.mark_as_read!
        render json: { message: "Notificação marcada como lida" }, status: :ok
      rescue ActiveRecord::RecordNotFound
        render_not_found("Notificação")
      end

      private

      def notification_json(notification)
        {
          id: notification.id,
          type: notification.notification_type,
          title: notification.title,
          body: notification.body,
          movie_id: notification.movie_id,
          read: notification.read?,
          created_at: notification.created_at.iso8601
        }
      end
    end
  end
end
