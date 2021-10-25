# == Schema Information
#
# Table name: blockchains
#
#  id                         :bigint           not null, primary key
#  last_block_height_imported :bigint
#  created_at                 :datetime         not null
#  updated_at                 :datetime         not null
#
class Blockchain < ApplicationRecord
  SUPPORTED_CONTRACT_IDS = %w[
    SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-swap-v1-1
  ].freeze
  STACKS_MAINNET_NODE_URL = 'https://stacks-node-api.mainnet.stacks.co'.freeze

  def scan_transaction(tx_id)
    result = HTTParty.get("#{STACKS_MAINNET_NODE_URL}/extended/v1/tx/#{tx_id}")&.parsed_response
    scan_result(result, false)
  end

  def scan_transactions
    response = HTTParty.get("#{STACKS_MAINNET_NODE_URL}/v2/info")&.parsed_response
    tip_height = response['stacks_tip_height']
    return if tip_height <= last_block_height_imported

    rescan_blocks(last_block_height_imported + 1)
    update(last_block_height_imported: tip_height)
  end

  def rescan_blocks(starting_block)
    response = HTTParty.get("#{STACKS_MAINNET_NODE_URL}/v2/info")&.parsed_response
    tip_height = response['stacks_tip_height']

    while starting_block <= tip_height
      puts "Scanning block #{starting_block}"
      response = HTTParty.get("#{STACKS_MAINNET_NODE_URL}/extended/v1/block/by_height/#{starting_block}")&.parsed_response
      response['txs'].each do |tx_id|
        scan_transaction(tx_id)
      end
      starting_block += 1
    end
  end

  def scan_result(result, enforce_block_height)
    return if enforce_block_height && result['block_height'] > last_block_height_imported
    return if %w[coinbase token_transfer].include?(result['tx_type'])
    return if result['contract_call'].nil?

    id = result['contract_call']['contract_id']
    return unless Blockchain::SUPPORTED_CONTRACT_IDS.include?(id)
    return unless result['tx_status'] == 'success'

    puts 'Arkadiko transaction found'
    function_name = result['contract_call']['function_name']

    contract_address = id.split('.')[0]
    contract_name = id.split('.')[1]
    puts "Found transaction to #{function_name} / #{result['tx_id']}"

    token_x = result['contract_call']['function_args'][0]['repr']
    token_y = result['contract_call']['function_args'][1]['repr']
    token_x_address = token_x.split('.')[0]
    token_x_name = token_x.split('.')[1]
    token_y_address = token_y.split('.')[0]
    token_y_name = token_y.split('.')[1]
    pool = Pool.find_by(
      token_x_address: token_x_address,
      token_y_address: token_y_address,
      token_x_name: token_x_name,
      token_y_name: token_y_name
    )
    return if pool.nil?

    if ['swap-x-for-y', 'swap-y-for-x', 'reduce-position'].include?(function_name)
      res = result['tx_result']['repr'].gsub('(ok (list ', '').gsub('))', '').gsub('u', '').split(' ')
      tvl_token_x = res[0].to_i
      tvl_token_y = res[1].to_i
    else
      tvl_token_x = result['contract_call']['function_args'][3]['repr'].gsub('u', '').to_i
      tvl_token_y = result['contract_call']['function_args'][4]['repr'].gsub('u', '').to_i
    end
    pool.swap_events.create!(
      function_name: function_name,
      transaction_id: result['tx_id'],
      event_at: result['parent_burn_block_time_iso'],
      sender: result['sender_address'],
      token_x_amount: tvl_token_x,
      token_y_amount: tvl_token_y
    )
    case function_name
    when 'add-to-position'
      pool.update(
        tvl_token_x: pool.tvl_token_x + tvl_token_x,
        tvl_token_y: pool.tvl_token_y + tvl_token_y,
        tvl_updated_at: result['parent_burn_block_time_iso']
      )
    when 'reduce-position'
      pool.update(
        tvl_token_x: pool.tvl_token_x - tvl_token_x,
        tvl_token_y: pool.tvl_token_y - tvl_token_y,
        tvl_updated_at: result['parent_burn_block_time_iso']
      )
    end
  end
end
