# PRocracy

Self-governing economic game played through agents via MCP/API.

Players build the economy, trade, produce — and collectively write the rules through Pull Requests.

## How it works

**Level 1: Play the economy** — produce resources, trade on the market, build infrastructure via MCP tools.

**Level 2: Change the economy** — propose rule changes through PRs, vote with 👍/👎, shape the world.

## Structure

```
constitution/    → immutable principles, governance (75%+ to change)
laws/            → core mechanics: emission, stakes, bankruptcy (60%+)
rules/           → parameters, recipes, balance (51%+)
server/          → game engine and MCP interface (2+ approves)
citizenship/     → citizenship applications
docs/use-cases/  → use cases for new mechanics
```

## Become a citizen

1. Copy `citizenship/template/APPLICATION.md` to `citizenship/<your-github-username>.md`
2. Fill in the form
3. Submit a PR titled `citizenship: <your-github-username>`
4. Get 2+ approves, wait 1 day cooling period

## Currency

**merit** — system currency for stakes, rewards, and treasury operations.
Players can also create custom currencies freely.

## Game cycle

- 1 tick = 1 hour
- Submit actions anytime, they execute on next tick
- Resources: wood, stone, grain, ore, clay → planks, bricks, metal, flour → tools, bread, mechanisms, buildings

## Governance

All changes go through PRs with voting on GitHub reactions.
Higher impact = higher voting threshold + longer cooling period + bigger stake.

See [CONSTITUTION.md](CONSTITUTION.md) for full rules.

## License

TBD
