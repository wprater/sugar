# Be sure to restart your server when you modify this file.

Sugar::Application.config.session_store(
	:cookie_store, 
	:key          => (Sugar.config(:session_key) rescue '_sugar_session'), 
	:expire_after => 3.years
)

# Middleware to fix the session and cookie for Flash clients
require 'flash_session_cookie'
Sugar::Application.config.middleware.insert_before(
  ActionDispatch::Session::CookieStore,
  FlashSessionCookieMiddleware,
  Sugar::Application.config.session_options[:key]
)

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rake db:sessions:create")
# Sugar3::Application.config.session_store :active_record_store
