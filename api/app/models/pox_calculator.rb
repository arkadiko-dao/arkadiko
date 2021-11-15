class PoxCalculator
  def calculate_yields(name: 'stacker', file: 'vaults-pox-20.json', ustx_stacked: 12_622_260_119_595, ustx_yield: 41_666_000_000)
    file = File.open("files/#{file}")
    data = JSON.load(file)
    vaults = {}
    
    data.each do |vault|
      next unless vault['stacker-name']['value'] == name
      next if vault['stacked-tokens']['value'] == 0

      stacked = vault['stacked-tokens']['value']
      ratio = stacked / ustx_stacked.to_f
      vaults[vault['id']['value']] = {
        'collateral': vault['collateral']['value'],
        'stacked': stacked,
        'yield': (ratio * ustx_yield).round(0)
      }
    end

    vaults
  end
end
