class PoxCalculator
  def self.calculate_yields(names: ['stacker'], file: 'vaults-pox-30.json', ustx_stacked: 2_592_560_705_148, ustx_yield: 8_261_229_000)
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

  def self.calculate_usda_yields(names: ['stacker'], file: 'vaults-pox-31.json', ustx_stacked: 6_242_840_272_010, usda_yield: 26_828_711_509)
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

  def self.build_clarity_list_tuples(names:, file: 'vaults-pox-31.json', yield_type: 'usda')
    if yield_type == 'usda'
      vaults = calculate_usda_yields(names: names, file: file)
    else
      vaults = calculate_yields(names: names, file: file)
    end
    vaults.each do |vault_id, value|
      puts "tx.tupleCV({ 'to': tx.uintCV(#{vault_id}), '#{yield_type}': tx.uintCV(#{value[:yield]}) }),"
    end
  end
end
