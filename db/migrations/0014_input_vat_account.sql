INSERT INTO `accounts` (`code`, `name`, `type`, `normal_balance`)
SELECT '1301', 'PPN Masukan', 'Asset', 'Debit'
WHERE NOT EXISTS (
  SELECT 1 FROM `accounts` WHERE `code` = '1301'
);
