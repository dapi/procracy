import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validatePR } from './check-bank.mjs';

const BASE_BALANCES = { emission: -10000, treasury: 9900, alice: 100 };
const BASE_TRANSACTIONS = [
  { id: 1, from: 'emission', to: 'treasury', amount: 10000 },
  { id: 2, from: 'treasury', to: 'alice', amount: 100 },
];

function makePR(overrides) {
  return {
    baseBalances: BASE_BALANCES,
    baseTransactions: BASE_TRANSACTIONS,
    prBalances: BASE_BALANCES,
    prTransactions: BASE_TRANSACTIONS,
    author: 'alice',
    changedFiles: ['bank/balances.json', 'bank/transactions.json'],
    ...overrides,
  };
}

describe('validatePR', () => {
  it('valid transfer user → user', () => {
    const result = validatePR(makePR({
      prBalances: { emission: -10000, treasury: 9900, alice: 50, bob: 50 },
      prTransactions: [
        ...BASE_TRANSACTIONS,
        { id: 3, from: 'alice', to: 'bob', amount: 50 },
      ],
      author: 'alice',
    }));
    assert.equal(result.ok, true);
    assert.deepEqual(result.errors, []);
  });

  it('valid emission with law change', () => {
    const result = validatePR(makePR({
      prBalances: { emission: -15000, treasury: 14900, alice: 100 },
      prTransactions: [
        ...BASE_TRANSACTIONS,
        { id: 3, from: 'emission', to: 'treasury', amount: 5000 },
      ],
      changedFiles: ['bank/balances.json', 'bank/transactions.json', 'laws/007-new.md'],
    }));
    assert.equal(result.ok, true);
  });

  it('valid citizenship grant (100 merits + citizenship file)', () => {
    const result = validatePR(makePR({
      prBalances: { emission: -10000, treasury: 9800, alice: 100, bob: 100 },
      prTransactions: [
        ...BASE_TRANSACTIONS,
        { id: 3, from: 'treasury', to: 'bob', amount: 100 },
      ],
      changedFiles: ['bank/balances.json', 'bank/transactions.json', 'citizenship/bob.md'],
    }));
    assert.equal(result.ok, true);
  });

  it('error: author != from', () => {
    const result = validatePR(makePR({
      prBalances: { emission: -10000, treasury: 9900, alice: 50, bob: 50 },
      prTransactions: [
        ...BASE_TRANSACTIONS,
        { id: 3, from: 'alice', to: 'bob', amount: 50 },
      ],
      author: 'eve',
    }));
    assert.equal(result.ok, false);
    assert.ok(result.errors.some(e => e.includes('автор PR')));
  });

  it('error: self-transfer', () => {
    const result = validatePR(makePR({
      prTransactions: [
        ...BASE_TRANSACTIONS,
        { id: 3, from: 'alice', to: 'alice', amount: 10 },
      ],
      author: 'alice',
    }));
    assert.equal(result.ok, false);
    assert.ok(result.errors.some(e => e.includes('самоперевод')));
  });

  it('error: emission without laws/ change', () => {
    const result = validatePR(makePR({
      prBalances: { emission: -15000, treasury: 14900, alice: 100 },
      prTransactions: [
        ...BASE_TRANSACTIONS,
        { id: 3, from: 'emission', to: 'treasury', amount: 5000 },
      ],
      changedFiles: ['bank/balances.json', 'bank/transactions.json'],
    }));
    assert.equal(result.ok, false);
    assert.ok(result.errors.some(e => e.includes('эмиссия')));
  });

  it('error: treasury → user without citizenship file', () => {
    const result = validatePR(makePR({
      prBalances: { emission: -10000, treasury: 9800, alice: 100, bob: 100 },
      prTransactions: [
        ...BASE_TRANSACTIONS,
        { id: 3, from: 'treasury', to: 'bob', amount: 100 },
      ],
      changedFiles: ['bank/balances.json', 'bank/transactions.json'],
    }));
    assert.equal(result.ok, false);
    assert.ok(result.errors.some(e => e.includes('citizenship/bob.md')));
  });

  it('error: sum of balances != 0', () => {
    const result = validatePR(makePR({
      prBalances: { emission: -10000, treasury: 9900, alice: 200 },
    }));
    assert.equal(result.ok, false);
    assert.ok(result.errors.some(e => e.includes('сумма балансов')));
  });

  it('error: negative citizen balance', () => {
    const result = validatePR(makePR({
      prBalances: { emission: -10000, treasury: 10100, alice: -100 },
    }));
    assert.equal(result.ok, false);
    assert.ok(result.errors.some(e => e.includes('отрицательный')));
  });
});
