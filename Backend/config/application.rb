require_relative "boot"

require "rails"

# API-only: only load the frameworks needed for a JSON API
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "action_dispatch/railtie"

Bundler.require(*Rails.groups)

module Backend
  class Application < Rails::Application
    config.load_defaults 8.1

    # API-only mode: serve JSON responses for React Native client
    config.api_only = true

    # Autoload lib directory
    config.autoload_lib(ignore: %w[assets tasks])

    # Default locale
    config.i18n.default_locale = :"pt-BR"

    # Time zone
    config.time_zone = "America/Sao_Paulo"

    # Allow requests from React Native (Expo)
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins "*"
        resource "*",
          headers: :any,
          methods: [ :get, :post, :put, :patch, :delete, :options, :head ],
          expose: [ "Authorization" ]
      end
    end
  end
end
