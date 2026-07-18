"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { loadLaunches, type LaunchRecord } from "@/lib/launches";
import { readSolMission } from "@/lib/meteora/trade";
import { readEvmMission } from "@/lib/evm/launch";
import { readUniswapMission } from "@/lib/evm/uniswap";

export interface LiveLaunch {
  record: LaunchRecord;
  /** null while loading, "error" if the chain read failed */
  live:
    | null
    | "error"
    | {
        progressPct: number;
        graduated: boolean;
        priceLabel: string;
        reserveLabel: string; // raised so far (or pool liquidity for AMM venues)
        unit: "SOL" | "ETH";
        /** AMM venue (Uniswap) — no graduation curve, reserveLabel is liquidity */
        amm?: boolean;
      };
}

/**
 * Real launches from this browser's registry, hydrated with live curve
 * state from chain. The single data source for every mission listing.
 */
export function useLiveLaunches() {
  const { connection } = useConnection();
  const [launches, setLaunches] = useState<LiveLaunch[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const records = loadLaunches();
    setLaunches(records.map((record) => ({ record, live: null })));
    setLoaded(true);

    records.forEach(async (record) => {
      let live: LiveLaunch["live"] = "error";
      try {
        if (record.chain === "SOLANA") {
          const s = await readSolMission(connection, record.address);
          if (s) {
            live = {
              progressPct: s.progressPct,
              graduated: s.graduated,
              priceLabel: `${s.priceSol.toExponential(2)} SOL`,
              reserveLabel: `${s.quoteReserveSol.toFixed(3)} / ${s.graduationSol.toFixed(1)} SOL`,
              unit: "SOL",
            };
          }
        } else if (record.venue === "uniswap") {
          const s = await readUniswapMission(record.address);
          live = {
            progressPct: 100,
            graduated: false,
            priceLabel: `${s.priceEth.toExponential(2)} ETH`,
            reserveLabel: `${s.liquidityEth.toFixed(4)} ETH LIQ`,
            unit: "ETH",
            amm: true,
          };
        } else {
          const s = await readEvmMission(record.address);
          live = {
            progressPct: s.progressPct,
            graduated: s.graduated,
            priceLabel: `${s.priceEth.toExponential(2)} ETH`,
            reserveLabel: `${s.realEth.toFixed(4)} / ${s.graduationEth.toFixed(3)} ETH`,
            unit: "ETH",
          };
        }
      } catch {
        live = "error";
      }
      setLaunches((prev) =>
        prev.map((l) => (l.record.id === record.id ? { ...l, live } : l)),
      );
    });
  }, [connection]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { launches, loaded, refresh };
}
