import { Contract, JsonRpcProvider } from "ethers";

/** Robinhood Chain mainnet — where Pons-launched tokens live. */
export const ROBINHOOD_RPC = "https://rpc.mainnet.chain.robinhood.com";

const ERC20 = ["function name() view returns (string)", "function symbol() view returns (string)"];

/** Read a token's name/symbol straight from Robinhood Chain. */
export async function readRobinhoodToken(address: string): Promise<{ name: string; symbol: string }> {
  const c = new Contract(address, ERC20, new JsonRpcProvider(ROBINHOOD_RPC));
  try {
    const [name, symbol] = await Promise.all([c.name(), c.symbol()]);
    return { name: String(name), symbol: String(symbol) };
  } catch {
    throw new Error("No token found at that address on Sepolia or Robinhood Chain");
  }
}
