import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";
import { createPublicClient, http } from "viem";
import { createClient } from "@lifi/sdk";   // ← Tambahkan ini
import winston from "winston";

// Logger (simple)
export const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

// LI.FI Client (v4)
export const lifiClient = createClient({
  integrator: "agentic-arc",   // Ganti dengan nama agent kamu
});

// Circle Client
export const circleClient = initiateDeveloperControlledWalletsClient({
  apiKey: process.env.CIRCLE_API_KEY!,
  entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
});

export const publicClient = createPublicClient({
  chain: {
    id: 5042002,
    name: 'Arc Testnet',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
    rpcUrls: { default: { http: ['https://rpc.testnet.arc.network'] } },
  } as any,
  transport: http(process.env.RPC_URL || 'https://rpc.testnet.arc.network'),
});

export const WALLET_ADDRESS = process.env.WALLET_ADDRESS!;
export const CIRCLE_WALLET_ID = process.env.CIRCLE_WALLET_ID!;

export const LIFI_CONFIG = {
  integrator: "agentic-arc",
};
