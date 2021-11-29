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
    SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-swap-v2-1
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
      update(last_block_height_imported: starting_block)
      starting_block += 1
    end
  end

  def import_vaults(offset:)
    url = "#{STACKS_MAINNET_NODE_URL}/extended/v1/address/SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-freddie-v1-1/transactions?limit=50&offset=#{offset}"
    puts url
    response = HTTParty.get(url)&.parsed_response['results']
    vaults = {}

    while offset >= 0
      response.reverse.each do |res|
        next if res['contract_call'].nil?
        next unless res['tx_status'] == 'success'

        function_name = res['contract_call']['function_name']
        args = res['contract_call']['function_args']
        if function_name == 'collateralize-and-mint'
          vault_created = HTTParty.get("https://stacks-node-api.mainnet.stacks.co/extended/v1/tx/#{res['tx_id']}").parsed_response
          params = vault_created['events'][-1]['contract_log']['value']['repr']
          id = params.split("(id ")[1].split(")")[0].gsub('u', '')
          vaults[id] = {
            'collateral_amount': args[0]['repr'].gsub('u', '').to_i,
            'debt': args[1]['repr'].gsub('u', '').to_i,
            'stacking': args[2]['repr'].split('(stack-pox ')[1] == "true))",
            'stacker_name': params.split('(stacker-name ')[1].split(') (updated-at-block-height')[0]
          }
          puts vaults[id] if id == '2'
        elsif function_name == 'deposit'
          id = args[0]['repr'].gsub('u', '')
          next unless vaults[id]
          next if res['block_height'] > 35965
          vaults[id]['collateral_amount'.to_sym] += res['post_conditions'][0]['amount'].to_i
        elsif function_name == 'withdraw'
          id = args[0]['repr'].gsub('u', '')
          next unless vaults[id]
          next if res['block_height'] > 35965
          vaults[id]['collateral_amount'.to_sym] -= args[1]['repr'].gsub('u', '').to_i
        elsif function_name == 'burn'
        elsif function_name == 'mint'
        elsif function_name == 'toggle-stacking'
          id = args[0]['repr'].gsub('u', '')
          next unless vaults[id]
          next if res['block_height'] > 35965
          # vaults[id]['stacking'.to_sym] = !vaults[id]['stacking'.to_sym]
          # NOTHING TO DO HERE YET
        elsif function_name == 'stack-collateral'
          id = args[0]['repr'].gsub('u', '')
          next unless vaults[id]
          vaults[id]['stacking'.to_sym] = true
          vaults[id]['stack_block_height'.to_sym] = res['block_height']
        elsif function_name == 'close-vault'
          id = args[0]['repr'].gsub('u', '')
          vaults = vaults.except(id)
        else
          puts "Function not recognised"
        end
      end

      offset -= 50
      url = "#{STACKS_MAINNET_NODE_URL}/extended/v1/address/SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-freddie-v1-1/transactions?limit=50&offset=#{offset}"
      response = HTTParty.get(url)&.parsed_response['results']
    end

    offset = 100
    url = "https://stacks-node-api.mainnet.stacks.co/extended/v1/address/SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-stacker-v1-1/transactions?limit=50&offset=#{offset}"
    puts url
    response = HTTParty.get(url)&.parsed_response['results']
    while offset >= 0
      response.reverse.each do |res|
        next if res['contract_call'].nil?
        next unless res['tx_status'] == 'success'
        function_name = res['contract_call']['function_name']
        args = res['contract_call']['function_args']
        if function_name == 'enable-vault-withdrawals'
          id = args[0]['repr'].gsub('u', '')
          next if vaults[id]['stack_block_height'.to_sym] && vaults[id]['stack_block_height'.to_sym] > res['block_height']

          vaults[id]['stacking'.to_sym] = !vaults[id]['stacking'.to_sym]
        else
          puts function_name.inspect
        end
      end
      
      offset -= 50
      url = "#{STACKS_MAINNET_NODE_URL}/extended/v1/address/SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-freddie-v1-1/transactions?limit=50&offset=#{offset}"
      response = HTTParty.get(url)&.parsed_response['results']
    end

    vaults
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
    event = pool.swap_events.find_or_initialize_by(
      transaction_id: result['tx_id']
    )
    return unless event.new_record?

    event.update(
      function_name: function_name,
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
