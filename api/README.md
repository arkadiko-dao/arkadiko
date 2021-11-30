# README

# Installation

1. Install Ruby 2.6.6
2. Install Rails
3. Bundler etc yaddie yaddie yaddie
4. Install Postgres Mac app
5. Create the database and run the migrations: `rails db:create && rails db:migrate`
5. Run `rails s -b 127.0.0.1`
6. Run the commands in `seeds.rb` in a rails console
7. Run `Blockchain.first.scan_transactions`. THIS TAKES HOURS AND SCANS ALL ARKADIKO SWAP MAINNET CONTRACTS. I'll check if I can make an easy to import SQL dump or something.
8. Run `yarn` and `yarn dev` in `analytics-web` folder
9. You should see the app on localhost:9000.

# Deploy to Heroku

Run `git subtree push --prefix api heroku master` from the root directory of the git repo.
