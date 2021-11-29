# lib/tasks/scheduler.rake
task scan_transactions: :environment do
  Blockchain.first&.scan_transactions
end
