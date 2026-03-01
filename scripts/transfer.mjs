import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BALANCES_PATH = join(__dirname, '..', 'bank', 'balances.json');
const TRANSACTIONS_PATH = join(__dirname, '..', 'bank', 'transactions.json');

export function loadState() {
  const balances = JSON.parse(readFileSync(BALANCES_PATH, 'utf8'));
  const transactions = JSON.parse(readFileSync(TRANSACTIONS_PATH, 'utf8'));
  return { balances, transactions };
}

export function saveState({ balances, transactions }) {
  writeFileSync(BALANCES_PATH, JSON.stringify(balances, null, 2) + '\n');
  writeFileSync(TRANSACTIONS_PATH, JSON.stringify(transactions, null, 2) + '\n');
}

export function transfer({ from, to, amount, reason }, state) {
  if (!amount || amount <= 0) {
    throw new Error('amount must be positive');
  }
  if (!(from in state.balances)) {
    throw new Error(`account "${from}" does not exist`);
  }
  if (from !== 'emission' && state.balances[from] - amount < 0) {
    throw new Error(`insufficient funds on "${from}"`);
  }

  const id = state.transactions.length > 0
    ? state.transactions[state.transactions.length - 1].id + 1
    : 1;

  const date = new Date().toISOString();
  const hash = createHash('sha256')
    .update(`${id}:${date}:${from}:${to}:${amount}:${reason}`)
    .digest('hex');

  const tx = { id, hash, date, from, to, amount, reason };

  state.balances[from] = (state.balances[from] || 0) - amount;
  state.balances[to] = (state.balances[to] || 0) + amount;
  state.transactions.push(tx);

  return tx;
}

export function emit({ amount, reason }, state) {
  return transfer({ from: 'emission', to: 'treasury', amount, reason }, state);
}

function main() {
  const command = process.argv[2];

  if (command === '--help' || command === '-h' || !command) {
    process.stdout.write(`Usage: transfer.mjs <command> [options]

Commands:
  transfer  Transfer merits between accounts
  emit      Emit merits from emission to treasury

Options:
  --from <account>    Source account (transfer only)
  --to <account>      Destination account (transfer only)
  --amount <number>   Amount of merits (required)
  --reason <text>     Reason for the transaction

Examples:
  node scripts/transfer.mjs transfer --from alice --to bob --amount 50 --reason "Payment"
  node scripts/transfer.mjs emit --amount 1000 --reason "Regular emission (tick 42)"
`);
    process.exit(0);
  }

  if (!['transfer', 'emit'].includes(command)) {
    process.stderr.write(`Unknown command: ${command}. Use --help for usage.\n`);
    process.exit(1);
  }

  const { values } = parseArgs({
    args: process.argv.slice(3),
    options: {
      from: { type: 'string' },
      to: { type: 'string' },
      amount: { type: 'string' },
      reason: { type: 'string' },
    },
  });

  const amount = Number(values.amount);
  if (isNaN(amount)) {
    process.stderr.write('Error: --amount is required and must be a number\n');
    process.exit(1);
  }

  const state = loadState();
  let tx;

  try {
    if (command === 'transfer') {
      if (!values.from || !values.to) {
        process.stderr.write('Error: --from and --to are required for transfer\n');
        process.exit(1);
      }
      tx = transfer({ from: values.from, to: values.to, amount, reason: values.reason || '' }, state);
    } else {
      tx = emit({ amount, reason: values.reason || '' }, state);
    }
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
  }

  saveState(state);
  process.stdout.write(JSON.stringify(tx, null, 2) + '\n');
}

// Run main only when executed directly
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  main();
}
