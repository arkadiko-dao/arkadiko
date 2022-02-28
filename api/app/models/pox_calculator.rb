class PoxCalculator
  def self.calculate_yields(names: ['stacker'], file: 'vaults-pox-26.json', ustx_stacked: 1_807_039_448_224, ustx_yield: 8_044_455_200)
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

  def self.build_clarity_list_tuples(names:, file: 'vaults-pox-26.json')
    vaults = calculate_yields(names: names, file: file)
    vaults.each do |vault_id, value|
      puts "tx.tupleCV({ 'to': tx.uintCV(#{vault_id}), 'ustx': tx.uintCV(#{value[:yield]}) }),"
    end
  end
end
