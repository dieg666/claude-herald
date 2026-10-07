/**
 * The start of mastodon/mastodon Gemfile style with a group block that is never closed.
 */
export const BROKEN_GEMFILE = `source 'https://rubygems.org'

group :development, :test do
  gem 'rspec-rails', '~> 8.0'
  gem 'debug'
`
