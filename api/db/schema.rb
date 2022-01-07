# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2022_01_07_085326) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "blockchains", force: :cascade do |t|
    t.bigint "last_block_height_imported"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "pools", force: :cascade do |t|
    t.string "token_x_name", null: false
    t.string "token_y_name", null: false
    t.string "token_x_address", null: false
    t.string "token_y_address", null: false
    t.string "swap_token_name", null: false
    t.string "swap_token_address", null: false
    t.bigint "tvl_token_x", default: 0, null: false
    t.bigint "tvl_token_y", default: 0, null: false
    t.datetime "tvl_updated_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "token_y_id"
    t.bigint "token_x_id"
    t.bigint "swap_token_id"
    t.bigint "balance_x"
    t.bigint "balance_y"
    t.bigint "shares_total"
    t.boolean "enabled"
    t.index ["swap_token_id"], name: "index_pools_on_swap_token_id"
    t.index ["token_x_id"], name: "index_pools_on_token_x_id"
    t.index ["token_y_id"], name: "index_pools_on_token_y_id"
  end

  create_table "swap_events", force: :cascade do |t|
    t.string "function_name", null: false
    t.string "transaction_id", null: false
    t.datetime "event_at", null: false
    t.string "sender", null: false
    t.bigint "pool_id", null: false
    t.bigint "token_x_amount", null: false
    t.bigint "token_y_amount", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["event_at"], name: "index_swap_events_on_event_at"
    t.index ["function_name"], name: "index_swap_events_on_function_name"
    t.index ["pool_id"], name: "index_swap_events_on_pool_id"
    t.index ["sender"], name: "index_swap_events_on_sender"
  end

  create_table "tokens", force: :cascade do |t|
    t.string "address", null: false
    t.string "name", null: false
    t.string "symbol", null: false
    t.bigint "total_supply", default: 0, null: false
    t.bigint "last_price", default: 0, null: false
    t.bigint "price_last_updated", default: 0, null: false
    t.bigint "total_staked", default: 0, null: false
    t.bigint "decimals", default: 6, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["address", "name"], name: "index_tokens_on_address_and_name"
    t.index ["symbol"], name: "index_tokens_on_symbol"
  end

  create_table "vault_events", force: :cascade do |t|
    t.string "function_name", null: false
    t.string "transaction_id", null: false
    t.datetime "event_at", null: false
    t.string "sender", null: false
    t.bigint "vault_id", null: false
    t.bigint "amount", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["event_at"], name: "index_vault_events_on_event_at"
    t.index ["function_name"], name: "index_vault_events_on_function_name"
    t.index ["sender"], name: "index_vault_events_on_sender"
    t.index ["vault_id"], name: "index_vault_events_on_vault_id"
  end

  create_table "vaults", force: :cascade do |t|
    t.bigint "vault_id", null: false
    t.bigint "collateral_amount", null: false
    t.bigint "debt", null: false
    t.boolean "stacking", default: false, null: false
    t.string "stacker_name"
    t.boolean "closed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["stacker_name"], name: "index_vaults_on_stacker_name"
    t.index ["vault_id"], name: "index_vaults_on_vault_id"
  end

  add_foreign_key "pools", "tokens", column: "swap_token_id"
  add_foreign_key "pools", "tokens", column: "token_x_id"
  add_foreign_key "pools", "tokens", column: "token_y_id"
end
