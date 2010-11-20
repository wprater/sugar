require File.expand_path('../boot', __FILE__)

require 'rails/all'

# If you have a Gemfile, require the gems listed there, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(:default, Rails.env) if defined?(Bundler)

module Sugar
	class Application < Rails::Application
		# Settings in config/environments/* take precedence over those specified here.
		# Application configuration should go into files in config/initializers
		# -- all .rb files in that directory are automatically loaded.

		# Custom directories with classes and modules you want to be autoloadable.
    config.autoload_paths += %W( #{config.root}/lib )
    %w(observers mailers middleware).each do |dir|
      config.autoload_paths << "#{config.root}/app/#{dir}"
    end

		# Only load the plugins named here, in the order given (default is alphabetical).
		# :all can be used as a placeholder for all plugins not explicitly named.
		# config.plugins = [ :exception_notification, :ssl_requirement, :all ]

		# Activate observers that should always be running.
		config.active_record.observers = :post_observer

		# Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
		# Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
		config.time_zone = 'UTC'

		# The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
		# config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}').to_s]
		# config.i18n.default_locale = :de

		# JavaScript files you want as :defaults (application.js is always included).
		# config.action_view.javascript_expansions[:defaults] = %w(jquery rails)

		# Configure the default encoding used in templates for Ruby 1.9.
		config.encoding = "utf-8"

		# Configure sensitive parameters which will be filtered from the log file.
		config.filter_parameters += [:password, :drawing]
		
    require 'config_store'
    config_store = ConfigStore.new("#{ENV['HOME']}/Development/.s3") unless 'production' == ENV['RACK_ENV']
    CarrierWave.configure do |config|
      config.s3_access_key_id     = ENV['S3_KEY'] || config_store['s3_access_key_id']
      config.s3_secret_access_key = ENV['S3_SECRET'] || config_store['s3_secret_access_key']
      config.s3_bucket            = ENV['S3_BUCKET'] || 'thecannalyst'
      config.s3_headers           = { 'Expires' => "#{(Time.now + 60*60*24*365).httpdate}" }
    end

	end
end

require Rails.root.join('lib/sugar.rb')