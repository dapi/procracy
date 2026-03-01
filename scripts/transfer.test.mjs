import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { transfer, emit } from './transfer.mjs';

function makeState(balances = {}, transactions = []) {
  return {
    balances: { emission: -10000, treasury: 10000, ...balances },
    transactions: [...transactions],
  };
}

describe('transfer', () => {
  let state;

  beforeEach(() => {
    state = makeState({ alice: 100, bob: 50 });
  });

  it('transfers between accounts', () => {
    const tx = transfer({ from: 'alice', to: 'bob', amount: 30, reason: 'test' }, state);
    assert.equal(state.balances.alice, 70);
    assert.equal(state.balances.bob, 80);
    assert.equal(tx.amount, 30);
    assert.equal(tx.from, 'alice');
    assert.equal(tx.to, 'bob');
    assert.equal(tx.reason, 'test');
    assert.equal(tx.id, 1);
    assert.ok(tx.date);
    assert.ok(tx.hash);
    assert.equal(tx.hash.length, 64);
  });

  it('produces unique hashes for different transactions', () => {
    const tx1 = transfer({ from: 'alice', to: 'bob', amount: 10, reason: 'a' }, state);
    const tx2 = transfer({ from: 'alice', to: 'bob', amount: 10, reason: 'b' }, state);
    assert.notEqual(tx1.hash, tx2.hash);
  });

  it('fails on insufficient funds', () => {
    assert.throws(
      () => transfer({ from: 'alice', to: 'bob', amount: 200, reason: '' }, state),
      /insufficient funds/
    );
  });

  it('fails on non-positive amount', () => {
    assert.throws(
      () => transfer({ from: 'alice', to: 'bob', amount: 0, reason: '' }, state),
      /amount must be positive/
    );
    assert.throws(
      () => transfer({ from: 'alice', to: 'bob', amount: -5, reason: '' }, state),
      /amount must be positive/
    );
  });

  it('fails on non-existent from account', () => {
    assert.throws(
      () => transfer({ from: 'nobody', to: 'bob', amount: 10, reason: '' }, state),
      /does not exist/
    );
  });

  it('creates new to account', () => {
    const tx = transfer({ from: 'alice', to: 'charlie', amount: 10, reason: '' }, state);
    assert.equal(state.balances.charlie, 10);
    assert.equal(state.balances.alice, 90);
  });

  it('increments transaction id sequentially', () => {
    state.transactions = [{ id: 5 }];
    const tx = transfer({ from: 'alice', to: 'bob', amount: 1, reason: '' }, state);
    assert.equal(tx.id, 6);
  });
});

describe('emit', () => {
  it('emits from emission to treasury', () => {
    const state = makeState();
    const tx = emit({ amount: 500, reason: 'tick' }, state);
    assert.equal(tx.from, 'emission');
    assert.equal(tx.to, 'treasury');
    assert.equal(state.balances.emission, -10500);
    assert.equal(state.balances.treasury, 10500);
  });
});

describe('integrity', () => {
  it('sum of all balances remains 0', () => {
    const state = makeState({ alice: 100, bob: 50 });
    // adjust emission to make sum 0
    state.balances.emission = -(state.balances.treasury + state.balances.alice + state.balances.bob);

    transfer({ from: 'alice', to: 'bob', amount: 30, reason: '' }, state);
    emit({ amount: 200, reason: '' }, state);
    transfer({ from: 'treasury', to: 'alice', amount: 50, reason: '' }, state);

    const sum = Object.values(state.balances).reduce((a, b) => a + b, 0);
    assert.equal(sum, 0);
  });
});
