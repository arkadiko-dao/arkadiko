File.foreach('export_diko.csv') do |line|
  values = line.split(',')
  new_line = "#{Time.at(values[0].to_i / 1000)},#{values[1]}"
  File.write('export_diko_parsed.csv', new_line, mode: "a")
end
