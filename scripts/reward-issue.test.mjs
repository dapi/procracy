import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { rewardIssue } from './reward-issue.mjs';

function makeState(balances = {}, transactions = []) {
  return {
    balances: { emission: -10000, treasury: 10000, ...balances },
    transactions: [...transactions],
  };
}

describe('rewardIssue', () => {
  let state;

  beforeEach(() => {
    state = makeState({ alice: 50 });
  });

  it('transfers 10 merits from treasury to author', () => {
    const tx = rewardIssue({ author: 'alice', issueNumber: '7', prNumber: '12' }, state);
    assert.equal(tx.amount, 10);
    assert.equal(tx.from, 'treasury');
    assert.equal(tx.to, 'alice');
    assert.equal(state.balances.alice, 60);
    assert.equal(state.balances.treasury, 9990);
  });

  it('includes issue and PR number in reason', () => {
    const tx = rewardIssue({ author: 'alice', issueNumber: '42', prNumber: '99' }, state);
    assert.ok(tx.reason.includes('#42'));
    assert.ok(tx.reason.includes('#99'));
  });

  it('fails when author account does not exist', () => {
    assert.throws(
      () => rewardIssue({ author: 'nobody', issueNumber: '1', prNumber: '2' }, state),
      /does not exist/
    );
  });

  it('fails when treasury has insufficient funds', () => {
    state.balances.treasury = 5;
    assert.throws(
      () => rewardIssue({ author: 'alice', issueNumber: '1', prNumber: '2' }, state),
      /insufficient funds/
    );
  });

  it('creates account for new citizen via transfer', () => {
    state.balances.bob = 0;
    const tx = rewardIssue({ author: 'bob', issueNumber: '3', prNumber: '4' }, state);
    assert.equal(state.balances.bob, 10);
  });
});
