#!/usr/bin/env node

/**
 * Bank integrity validator for PRs.
 * Validates transaction authorization and balance integrity.
 */

export function validatePR({ baseBalances, baseTransactions, prBalances, prTransactions, author, changedFiles }) {
  const errors = [];

  // Find max transaction id in base
  const maxBaseId = baseTransactions.reduce((max, t) => Math.max(max, t.id), 0);

  // New transactions added in this PR
  const newTransactions = prTransactions.filter(t => t.id > maxBaseId);

  for (const tx of newTransactions) {
    const type = classifyTransaction(tx);

    switch (type) {
      case 'transfer': {
        if (tx.from === tx.to) {
          errors.push(`tx ${tx.id}: самоперевод запрещён (${tx.from} → ${tx.to})`);
        }
        if (author !== tx.from) {
          errors.push(`tx ${tx.id}: автор PR (${author}) не совпадает с отправителем (${tx.from})`);
        }
        break;
      }
      case 'emission': {
        const hasLawChange = changedFiles.some(f => f.startsWith('laws/'));
        if (!hasLawChange) {
          errors.push(`tx ${tx.id}: эмиссия требует изменения в laws/`);
        }
        break;
      }
      case 'citizenship': {
        const hasCitizenshipFile = changedFiles.some(f => f === `citizenship/${tx.to}.md`);
        if (!hasCitizenshipFile) {
          errors.push(`tx ${tx.id}: начисление гражданства требует файла citizenship/${tx.to}.md`);
        }
        if (tx.amount !== 100) {
          errors.push(`tx ${tx.id}: начисление гражданства должно быть 100 merits, получено ${tx.amount}`);
        }
        break;
      }
      default: {
        errors.push(`tx ${tx.id}: запрещённый тип транзакции (${tx.from} → ${tx.to})`);
      }
    }
  }

  // Balance integrity checks
  const balances = prBalances;
  const sum = Object.values(balances).reduce((s, v) => s + v, 0);
  if (sum !== 0) {
    errors.push(`сумма балансов != 0 (${sum})`);
  }

  for (const [account, balance] of Object.entries(balances)) {
    if (account === 'emission') {
      if (balance > 0) {
        errors.push(`emission баланс должен быть ≤ 0 (${balance})`);
      }
    } else if (account === 'treasury') {
      if (balance < 0) {
        errors.push(`treasury баланс должен быть ≥ 0 (${balance})`);
      }
    } else {
      if (balance < 0) {
        errors.push(`баланс ${account} отрицательный (${balance})`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

function classifyTransaction(tx) {
  if (tx.from === 'emission' && tx.to === 'treasury') return 'emission';
  if (tx.from === 'treasury' && tx.to !== 'emission') return 'citizenship';
  if (tx.from !== 'emission' && tx.from !== 'treasury') return 'transfer';
  return 'unknown';
}

// CLI entrypoint
if (process.argv[1] && process.argv[1].endsWith('check-bank.mjs') && process.argv.length > 2) {
  const fs = await import('node:fs');
  const path = await import('node:path');

  const [,, baseDir, prDir, author, ...changedFiles] = process.argv;

  const readJSON = (dir, file) => JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));

  const result = validatePR({
    baseBalances: readJSON(baseDir, 'balances.json'),
    baseTransactions: readJSON(baseDir, 'transactions.json'),
    prBalances: readJSON(prDir, 'balances.json'),
    prTransactions: readJSON(prDir, 'transactions.json'),
    author,
    changedFiles,
  });

  if (!result.ok) {
    console.error('Bank validation failed:');
    result.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  } else {
    console.log('Bank validation passed.');
  }
}
