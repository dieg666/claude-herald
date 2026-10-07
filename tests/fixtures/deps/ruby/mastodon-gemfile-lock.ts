/**
 * mastodon/mastodon Gemfile.lock, specs trimmed to the gems the tests read.
 */
export const MASTODON_GEMFILE_LOCK = `GIT
  remote: https://github.com/mastodon/webpush.git
  revision: 9631ac63045cfabddacc69fc06e919b4c13eb913
  ref: 9631ac63045cfabddacc69fc06e919b4c13eb913
  specs:
    webpush (1.1.0)
      hkdf (~> 0.2)
      jwt (~> 2.0)

GEM
  remote: https://rubygems.org/
  specs:
    aws-sdk-s3 (1.233.1)
      aws-sdk-core (~> 3, >= 3.256.0)
      aws-sdk-kms (~> 1)
      aws-sigv4 (~> 1.5)
    debug (1.11.1)
      irb (~> 1.10)
      reline (>= 0.3.8)
    devise (5.0.4)
      bcrypt (~> 3.0)
      orm_adapter (~> 0.1)
      railties (>= 7.0)
      responders
      warden (~> 1.2.3)
    devise_pam_authenticatable2 (9.2.0)
      devise (>= 4.0.0)
      rpam2 (~> 4.0)
    nokogiri (1.19.4)
      mini_portile2 (~> 2.8.2)
      racc (~> 1.4)
    pg (1.6.3)
    propshaft (1.3.2)
      actionpack (>= 7.0.0)
      activesupport (>= 7.0.0)
      rack
    puma (8.0.2)
      nio4r (~> 2.0)
    rails (8.1.4)
      actioncable (= 8.1.4)
      actionmailbox (= 8.1.4)
      actionmailer (= 8.1.4)
      actionpack (= 8.1.4)
      actiontext (= 8.1.4)
      actionview (= 8.1.4)
      activejob (= 8.1.4)
      activemodel (= 8.1.4)
      activerecord (= 8.1.4)
      activestorage (= 8.1.4)
      activesupport (= 8.1.4)
      bundler (>= 1.15.0)
      railties (= 8.1.4)
    rspec-rails (8.0.4)
      actionpack (>= 7.2)
      activesupport (>= 7.2)
      railties (>= 7.2)
      rspec-core (>= 3.13.0, < 5.0.0)
      rspec-expectations (>= 3.13.0, < 5.0.0)
      rspec-mocks (>= 3.13.0, < 5.0.0)
      rspec-support (>= 3.13.0, < 5.0.0)
    rubocop (1.91.0)
      json (>= 2.3)
      language_server-protocol (~> 3.17.0.2)
      lint_roller (~> 1.1.0)
      parallel (>= 1.10)
      parser (>= 3.3.0.2)
      rainbow (>= 2.2.2, < 4.0)
      regexp_parser (>= 2.9.3, < 3.0)
      rubocop-ast (>= 1.49.0, < 2.0)
      ruby-progressbar (~> 1.7)
      unicode-display_width (>= 2.4.0, < 4.0)
    thor (1.5.0)

PLATFORMS
  ruby

DEPENDENCIES
  aws-sdk-s3 (~> 1.123)
  debug (~> 1.8)
  devise
  devise_pam_authenticatable2 (~> 9.2)
  nokogiri (~> 1.15)
  pg (~> 1.5)
  propshaft
  puma
  rails (~> 8.1.0)
  rspec-rails (~> 8.0)
  rubocop
  thor (~> 1.2)
  webpush!

RUBY VERSION
  ruby 4.0.7

BUNDLED WITH
  4.0.22
`
