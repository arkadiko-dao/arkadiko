class PoxCalculator
  def self.calculate_yields(names:, file:, ustx_stacked:, ustx_yield:)
    file = File.open("files/#{file}")
    data = JSON.load(file)
    vaults = {}
    
    data.each do |vault|
      next unless names.include?(vault['stacker-name']['value'])
      next if vault['stacked-tokens']['value'] == 0
      next if vault['id']['value'] == 0 # || vault['id']['value'] > 1860

      collateral = vault['collateral']['value']
      stacked = vault['stacked-tokens']['value']
      ratio = collateral / ustx_stacked.to_f
      vaults[vault['id']['value']] = {
        'collateral': collateral,
        'stacked': stacked,
        'ratio': ratio,
        'yield': (ratio * ustx_yield).round(0)
      }
    end

    vaults
  end

  def self.calculate_usda_yields(names:, file:, ustx_stacked:, usda_yield:)
    file = File.open("files/#{file}")
    data = JSON.load(file)
    vaults = {}

    data.each do |vault|
      next unless names.include?(vault['stacker-name']['value'])
      next if vault['stacked-tokens']['value'] == 0
      next if vault['id']['value'] == 0

      collateral = vault['collateral']['value']
      stacked = vault['stacked-tokens']['value']
      ratio = collateral / ustx_stacked.to_f
      vaults[vault['id']['value']] = {
        'collateral': collateral,
        'stacked': stacked,
        'ratio': ratio,
        'yield': (ratio * usda_yield).round(0)
      }
    end

    vaults
  end

  def self.calculate_liqs
    total_amount = 0
    stacked_amount = 0
    total_sold = 0
    offset = 0
    data = HTTParty.get("https://stacks-node-api.stacks.co/extended/v1/address/SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-auction-engine-v4-1/transactions?limit=50&offset=#{offset}&unanchored=true")
    results = data.parsed_response['results']
    while results.length > 0
      results.each do |d|
        txid = d['tx_id']
        tx = HTTParty.get("https://stacks-node-api.mainnet.stacks.co/extended/v1/tx/#{txid}")
        next if tx.parsed_response.nil? || tx.parsed_response['events'].length.zero?
        begin
          collateral_amount = tx.parsed_response['events'][0]['contract_log']['value']['repr'].split("(collateral u")[1].split(") ")[0]
          stck_amount = tx.parsed_response['events'][0]['contract_log']['value']['repr'].split("(stacked-tokens u")[1].split(") ")[0]
          tx_sold = tx.parsed_response['events'][15]['contract_log']['value']['repr'].split("(total-collateral-sold u")[1].split(") ")[0]
          total_amount += collateral_amount.to_i
          stacked_amount += stck_amount.to_i
          total_sold += tx_sold.to_i
        rescue
          begin
            # either we had to mint some DIKO or it was a non-stacking vault
            next if tx.parsed_response['events'][7]['contract_log']['value']['repr'].split('(collateral-token "STX")').length > 0
          rescue
            begin
              collateral_amount = tx.parsed_response['events'][2]['contract_log']['value']['repr'].split("(collateral u")[1].split(") ")[0]
              stck_amount = tx.parsed_response['events'][2]['contract_log']['value']['repr'].split("(stacked-tokens u")[1].split(") ")[0]
              tx_sold = tx.parsed_response['events'][17]['contract_log']['value']['repr'].split("(total-collateral-sold u")[1].split(") ")[0]
              total_amount += collateral_amount.to_i
              stacked_amount += stck_amount.to_i
              total_sold += tx_sold.to_i
            rescue
              puts "Failed TX with id #{txid}"
            end
          end
        end
        sleep(1)
      end

      puts "Total Collateral: #{total_amount}"
      puts "Stacked Collateral: #{stacked_amount}"
      puts "Total Collateral Sold: #{total_sold}"
      offset += 50

      data = HTTParty.get("https://stacks-node-api.stacks.co/extended/v1/address/SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR.arkadiko-auction-engine-v4-1/transactions?limit=50&offset=#{offset}&unanchored=true")
      results = data.parsed_response['results']
    end
  end

  def self.build_clarity_list_tuples(names:, file: 'vaults-pox-36.json', yield_type: 'ustx', ustx_stacked: 6_819_684_758_593, yield_earned: 21_896_722_900)
    if yield_type == 'usda'
      vaults = calculate_usda_yields(names: names, file: file, ustx_stacked: ustx_stacked, usda_yield: yield_earned)
    else
      vaults = calculate_yields(names: names, file: file, ustx_stacked: ustx_stacked, ustx_yield: yield_earned)
    end
    vaults.each do |vault_id, value|
      puts "tx.tupleCV({ 'to': tx.uintCV(#{vault_id}), '#{yield_type}': tx.uintCV(#{value[:yield]}) }),"
    end
  end
end
