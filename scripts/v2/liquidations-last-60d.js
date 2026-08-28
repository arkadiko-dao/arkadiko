#!/usr/bin/env node
/**
 * Super simple mainnet liquidation history (last ~60 days).
 *
 * What it prints:
 * - Liquidation txs: `liquidate-vault` calls on vault manager contracts
 * - Collateral added to liquidation pools: `add-rewards` calls on pool-liq contracts
 *
 * Hardcoded contracts (mainnet):
 * - Managers: arkadiko-vaults-manager-v1-1, arkadiko-vaults-manager-v1-2
 * - Pools:    arkadiko-vaults-pool-liq-v1-2, arkadiko-vaults-pool-liq-v1-3
 *
 * Run:
 *   node clarity/scripts/liquidations-last-60d.js
 */

/* eslint-disable no-console */

const API = "https://api.hiro.so";
const DEPLOYER = "SP2C2YFP12AJZB4MABJBAJ55XECVS7E4PMMZ89YZR";

const MANAGERS = [
  `${DEPLOYER}.arkadiko-vaults-manager-v1-1`,
  `${DEPLOYER}.arkadiko-vaults-manager-v1-2`,
];

const POOL_LIQS = [
  `${DEPLOYER}.arkadiko-vaults-pool-liq-v1-2`,
  `${DEPLOYER}.arkadiko-vaults-pool-liq-v1-3`,
];

// Adjust this number if you need a longer window.
const DAYS_LOOKBACK = 60;
const LIMIT = 50; // public API max for tx list

// Pool state replay (needed to compute stake share at liquidation time)
const POOL_REPLAY_FUNCTIONS = ["stake", "unstake", "migrate-pool-liq", "burn-usda"];
const TOP_STAKERS = 10;

// Matches pool-liq-v1-2 default fragments-per-token
const FRAGMENTS_PER_TOKEN_INITIAL = 100000000000000n; // 1e14

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildUrl(path, query) {
  const u = new URL(path.replace(/^\//, ""), API.endsWith("/") ? API : API + "/");
  for (const [k, v] of Object.entries(query || {})) {
    if (v === undefined || v === null) continue;
    u.searchParams.set(k, String(v));
  }
  return u.toString();
}

async function httpGetJson(url) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (res.ok) return res.json();
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const waitMs = Number.isFinite(retryAfter) ? Math.max(1000, retryAfter * 1000) : Math.min(60000, 1500 * 2 ** attempt);
      console.error(`429 rate-limited. Waiting ${Math.round(waitMs / 1000)}s...`);
      await sleep(waitMs);
      continue;
    }
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${url}\n${text.slice(0, 400)}`);
  }
  throw new Error(`429 retries exhausted for ${url}`);
}

function parseUintRepr(repr) {
  if (typeof repr !== "string" || !repr.startsWith("u")) return null;
  return BigInt(repr.slice(1));
}

function parsePrincipalRepr(repr) {
  if (typeof repr !== "string") return null;
  return repr.startsWith("'") ? repr.slice(1) : repr;
}

function format6(x) {
  const sign = x < 0n ? "-" : "";
  let v = x < 0n ? -x : x;
  const whole = v / 1000000n;
  const frac = v % 1000000n;
  return `${sign}${whole}.${frac.toString().padStart(6, "0")}`;
}

function txSortKey(tx) {
  return [
    Number(tx.burn_block_time ?? 0),
    Number(tx.block_height ?? 0),
    Number(tx.tx_index ?? 0),
    tx.tx_id ?? "",
  ];
}

function compareTx(a, b) {
  const ka = txSortKey(a);
  const kb = txSortKey(b);
  for (let i = 0; i < ka.length; i++) {
    if (ka[i] < kb[i]) return -1;
    if (ka[i] > kb[i]) return 1;
  }
  return 0;
}

async function fetchContractCalls(contractId, functionName, cutoffTimeSec) {
  // /extended/v1/tx is ordered newest -> oldest. We page forward until we pass the cutoff.
  let offset = 0;
  const out = [];

  while (true) {
    const page = await httpGetJson(
      buildUrl(`/extended/v1/tx`, {
        limit: LIMIT,
        offset,
        type: "contract_call",
        contract_id: contractId,
        function_name: functionName,
        unanchored: false,
      })
    );

    const results = page.results || [];
    if (results.length === 0) break;

    for (const tx of results) {
      if (typeof tx.burn_block_time === "number" && tx.burn_block_time < cutoffTimeSec) return out;
      out.push(tx);
    }

    offset += results.length;
    if (typeof page.total === "number" && offset >= page.total) break;
    await sleep(250);
  }

  return out;
}

async function fetchPoolReplayTxs(poolContract, cutoffTimeSec) {
  const buckets = [];
  for (const fn of POOL_REPLAY_FUNCTIONS) {
    const txs = await fetchContractCalls(poolContract, fn, cutoffTimeSec);
    buckets.push(...txs);
  }
  const ok = buckets.filter((t) => t.tx_status === "success" && t.tx_type === "contract_call");
  ok.sort(compareTx);
  return ok;
}

function getPoolFromRecipient(recipient) {
  // recipient is contract principal
  return POOL_LIQS.includes(recipient) ? recipient : null;
}

async function main() {
  const nowSec = Math.floor(Date.now() / 1000);
  const cutoffTimeSec = nowSec - DAYS_LOOKBACK * 24 * 60 * 60;
  console.error(`Cutoff: last ${DAYS_LOOKBACK} days (burn_block_time >= ${cutoffTimeSec}).`);

  /** @type {Array<{block:number, txid:string, manager:string, owner:string, token:string, burnBlockTime?:number}>} */
  const liquidations = [];

  /** @type {Map<string, bigint>} */
  const collateralTotals = new Map(); // asset_identifier => total amount

  /** @type {Map<string, Array<{assetId:string, amount:bigint, recipient:string}>>} */
  const collateralByTx = new Map(); // txid => [collateral transfers into pool-liq]

  for (const mgr of MANAGERS) {
    console.error(`Scanning liquidations in ${mgr}...`);
    const txs = await fetchContractCalls(mgr, "liquidate-vault", cutoffTimeSec);
    for (const tx of txs) {
      if (tx.tx_status !== "success") continue;
      if (tx.tx_type !== "contract_call") continue;
      const cc = tx.contract_call;
      if (!cc || cc.function_name !== "liquidate-vault") continue;

      // owner arg index 7, token arg index 8 (see contract signature)
      const owner = parsePrincipalRepr(cc.function_args?.[7]?.repr);
      const token = parsePrincipalRepr(cc.function_args?.[8]?.repr);
      if (!owner || !token) continue;
      liquidations.push({ block: tx.block_height, txid: tx.tx_id, manager: mgr, owner, token });
    }
  }

  for (const pool of POOL_LIQS) {
    // No-op: add-rewards is called as an inner contract-call from liquidate-vault,
    // so it will NOT show up as a separate transaction. We infer collateral added
    // by reading FT transfer events on the liquidation tx itself.
    void pool;
  }

  liquidations.sort((a, b) => a.block - b.block);

  // Fetch tx details for each liquidation and extract collateral transfers into pool-liq contracts.
  const poolSet = new Set(POOL_LIQS);
  console.error(`Fetching events for ${liquidations.length} liquidation txs...`);
  for (const l of liquidations) {
    const tx = await httpGetJson(buildUrl(`/extended/v1/tx/${l.txid}`, { event_limit: 100, event_offset: 0, unanchored: false }));
    l.burnBlockTime = Number(tx.burn_block_time ?? 0);
    const events = tx.events || [];
    const coll = [];
    for (const ev of events) {
      if (ev.event_type !== "fungible_token_asset") continue;
      const asset = ev.asset || {};
      if (asset.asset_event_type !== "transfer") continue;
      const recipient = asset.recipient;
      if (!poolSet.has(recipient)) continue;
      const assetId = asset.asset_id;
      const amount = BigInt(asset.amount);
      coll.push({ assetId, amount, recipient });
      collateralTotals.set(assetId, (collateralTotals.get(assetId) || 0n) + amount);
    }
    if (coll.length > 0) collateralByTx.set(l.txid, coll);
    await sleep(150);
  }

  // Pool replay: reconstruct top stakers at the moment of each liquidation.
  // We only replay pools that actually received collateral in this window.
  const poolsTouched = new Set();
  for (const coll of collateralByTx.values()) {
    for (const c of coll) poolsTouched.add(c.recipient);
  }

  /** @type {Map<string, Array<any>>} */
  const poolReplayTxs = new Map();
  for (const pool of poolsTouched) {
    console.error(`Fetching pool replay txs for ${pool}...`);
    poolReplayTxs.set(pool, await fetchPoolReplayTxs(pool, cutoffTimeSec));
  }

  /** @type {Map<string, {idx:number, fragmentsPerToken:bigint, fragmentsTotal:bigint, usdaBalance:bigint, stakers:Map<string,bigint>}>} */
  const poolState = new Map();
  for (const pool of poolsTouched) {
    poolState.set(pool, {
      idx: 0,
      fragmentsPerToken: FRAGMENTS_PER_TOKEN_INITIAL,
      fragmentsTotal: 0n,
      usdaBalance: 0n,
      stakers: new Map(),
    });
  }

  function applyPoolTx(state, tx) {
    const cc = tx.contract_call;
    const fn = cc.function_name;
    const args = cc.function_args || [];
    const txSender = tx.sender_address;

    if (fn === "stake") {
      const amount = parseUintRepr(args?.[1]?.repr);
      if (amount === null || !txSender) return;
      const frAdded = amount * state.fragmentsPerToken;
      state.stakers.set(txSender, (state.stakers.get(txSender) || 0n) + frAdded);
      state.fragmentsTotal += frAdded;
      state.usdaBalance += amount;
    } else if (fn === "unstake") {
      const amount = parseUintRepr(args?.[1]?.repr);
      if (amount === null || !txSender) return;
      const frRemoved = amount * state.fragmentsPerToken;
      state.stakers.set(txSender, (state.stakers.get(txSender) || 0n) - frRemoved);
      state.fragmentsTotal -= frRemoved;
      state.usdaBalance -= amount;
    } else if (fn === "migrate-pool-liq") {
      const staker = parsePrincipalRepr(args?.[0]?.repr);
      const amount = parseUintRepr(args?.[1]?.repr);
      if (!staker || amount === null) return;
      const frNew = amount * state.fragmentsPerToken;
      const prev = state.stakers.get(staker) || 0n;
      state.stakers.set(staker, frNew);
      state.fragmentsTotal = state.fragmentsTotal - prev + frNew;
      state.usdaBalance += amount;
    } else if (fn === "burn-usda") {
      const amount = parseUintRepr(args?.[0]?.repr);
      if (amount === null) return;
      const newBal = state.usdaBalance - amount;
      state.usdaBalance = newBal;
      state.fragmentsPerToken = newBal > 0n ? state.fragmentsTotal / newBal : state.fragmentsPerToken;
    }
  }

  function advancePoolStateTo(pool, burnBlockTime) {
    const state = poolState.get(pool);
    const txs = poolReplayTxs.get(pool) || [];
    while (state.idx < txs.length) {
      const tx = txs[state.idx];
      const t = Number(tx.burn_block_time ?? 0);
      if (t > burnBlockTime) break;
      applyPoolTx(state, tx);
      state.idx++;
    }
    return state;
  }

  console.log("LIQUIDATIONS (liquidate-vault calls)");
  console.log("block_height,tx_id,manager,owner,vault_token,collateral_asset_id,collateral_added_6dec,pool_liq,pool_fragments_total,top_stakers");
  for (const l of liquidations) {
    const coll = collateralByTx.get(l.txid) || [];
    if (coll.length === 0) {
      console.log(`${l.block},${l.txid},${l.manager},${l.owner},${l.token},,,,,""`);
    } else {
      for (const c of coll) {
        const pool = getPoolFromRecipient(c.recipient);
        const burnTime = l.burnBlockTime || 0;
        let fragmentsTotal = "";
        let top = "";
        if (pool && burnTime > 0) {
          const st = advancePoolStateTo(pool, burnTime);
          fragmentsTotal = st.fragmentsTotal.toString();

          const rows = [];
          for (const [staker, fr] of st.stakers.entries()) {
            if (fr <= 0n) continue;
            rows.push([staker, fr]);
          }
          rows.sort((a, b) => (a[1] === b[1] ? 0 : a[1] > b[1] ? -1 : 1));
          const topRows = rows.slice(0, TOP_STAKERS);
          top = topRows
            .map(([staker, fr]) => {
              const pct = st.fragmentsTotal > 0n ? Number((fr * 1000000n) / st.fragmentsTotal) / 10000 : 0; // 2dp
              const share = st.fragmentsTotal > 0n ? (c.amount * fr) / st.fragmentsTotal : 0n;
              return `${staker}:${pct.toFixed(2)}%:${format6(share)}`;
            })
            .join("|");
        }
        console.log(
          `${l.block},${l.txid},${l.manager},${l.owner},${l.token},${c.assetId},${format6(c.amount)},${c.recipient},${fragmentsTotal},"${top}"`
        );
      }
    }
  }

  console.log("");
  console.log("SUMMARY");
  console.log(`liquidation_count=${liquidations.length}`);
  console.log("collateral_added_totals:");
  for (const [assetId, amt] of [...collateralTotals.entries()].sort((x, y) => (x[1] === y[1] ? 0 : x[1] > y[1] ? -1 : 1))) {
    console.log(`- ${assetId}: ${format6(amt)}`);
  }
}

main().catch((e) => {
  console.error(e?.stack || String(e));
  process.exit(1);
});

