class PoxCalculator
  def calculate_yields(name: 'stacker', file: 'vaults-pox-20.json', ustx_stacked: 12_622_260_119_595, ustx_yield: 45_524_528_400)
    file = File.open("files/#{file}")
    data = JSON.load(file)
    vaults = {}
    
    data.each do |vault|
      next unless vault['stacker-name']['value'] == name
      next if vault['stacked-tokens']['value'] == 0

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
end
