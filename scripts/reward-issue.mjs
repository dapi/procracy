#!/usr/bin/env node
import { loadState, saveState, transfer } from './transfer.mjs';

const REWARD_AMOUNT = 10;

export function rewardIssue({ author, issueNumber, prNumber }, state) {
  if (!(author in state.balances)) {
    throw new Error(`account "${author}" does not exist`);
  }
  const reason = `Награда за issue #${issueNumber} (PR #${prNumber})`;
  return transfer({ from: 'treasury', to: author, amount: REWARD_AMOUNT, reason }, state);
}

function main() {
  const [author, issueNumber, prNumber] = process.argv.slice(2);

  if (!author || !issueNumber || !prNumber) {
    process.stderr.write('Usage: reward-issue.mjs <author> <issue_number> <pr_number>\n');
    process.exit(1);
  }

  const state = loadState();

  try {
    const tx = rewardIssue({ author, issueNumber, prNumber }, state);
    saveState(state);
    process.stdout.write(JSON.stringify(tx, null, 2) + '\n');
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  main();
}
