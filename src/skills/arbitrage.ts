import type { SkillResult, AgentSkill } from "../types.js";
import { 
  logger, 
  WALLET_ADDRESS, 
  CIRCLE_WALLET_ID, 
  circleClient, 
  lifiClient 
} from "../lib/arcClient.js";

import { parseUnits } from "viem";
import { getQuote, getStepTransaction } from "@lifi/sdk";
import { riskManagement } from "./riskManagement.js";

export const arbitrageSkill: AgentSkill = {
  id: "arbitrage",
  name: "Smart Arbitrage (LI.FI + Intelligent Fallback)",
  description: "Arbitrage with LI.FI + strong simulation fallback",

  async execute(params: {
    amount?: string;
    tokenIn?: string;
    tokenOut?: string;
    execute?: boolean;
  }): Promise<SkillResult> {
    try {
      const amount = params.amount || "30";
      const tokenIn = params.tokenIn || "USDC";
      const tokenOut = params.tokenOut || "USDC";
      const shouldExecute = params.execute === true;

      logger.info(`🔍 Arbitrage: ${amount} ${tokenIn} → ${tokenOut}`);

      let quote = null;
      let lifiError: string | null = null;

      try {
        quote = await getQuote(lifiClient, {
          fromChain: 5042002,
          toChain: 5042002,
          fromToken: tokenIn,
          toToken: tokenOut,
          fromAmount: parseUnits(amount, 6).toString(),
          fromAddress: WALLET_ADDRESS,
          slippage: 1.2,
          integrator: "agentic-arc",
        });
        logger.info("✅ LI.FI Quote berhasil");
      } catch (err: any) {
        lifiError = err.message;
        logger.warn("LI.FI No Route → Using Simulation", { error: lifiError });
      }

      const estimatedProfit = quote
        ? (Number(quote.estimate?.toAmount || 0) / 1_000_000 - Number(amount))
        : Number(amount) * 0.012;

      const riskResult = await riskManagement.execute({ positionSize: amount });
      const riskScore = (riskResult as any).riskScore || 45;
      const isSafe = riskScore < 55 && estimatedProfit > 0.8;

      logger.info(`Risk Score: ${riskScore} | Safe: ${isSafe} | Profit: ${estimatedProfit.toFixed(3)}`);

      if (shouldExecute && isSafe && quote) {
        logger.info("🚀 Executing real transaction via LI.FI...");

        const step = quote.steps[0];
        const { transactionRequest } = await getStepTransaction(lifiClient, step);

        const txResponse = await circleClient.createContractExecutionTransaction({
          walletId: CIRCLE_WALLET_ID,
          blockchain: "ARC-TESTNET",
          contractAddress: transactionRequest.to,
          abiFunctionSignature: "execute(bytes)",
          abiParameters: [transactionRequest.data],
          fee: { type: "level", config: { feeLevel: "MEDIUM" } },
        } as any);

        // ================== FIX FINAL ==================
        const txId = 
          txResponse?.data?.id ?? 
          (txResponse as any)?.data?.id ?? 
          (txResponse as any)?.id ?? 
          (txResponse as any)?.transactionId ??
          "unknown";
        // ==============================================

        return {
          success: true,
          skill: "arbitrage",
          data: { 
            estimatedProfit: estimatedProfit.toFixed(3), 
            recommendation: "EXECUTED", 
            riskScore, 
            txId 
          },
          profit: estimatedProfit.toFixed(3),
          riskScore,
          txId,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        skill: "arbitrage",
        data: {
          amountIn: amount,
          estimatedProfit: estimatedProfit.toFixed(3),
          recommendation: isSafe ? "EXECUTE" : "MONITOR",
          riskScore,
          riskPassed: isSafe,
          route: quote ? "LI.FI" : "Simulation Fallback",
          lifiUsed: !!quote,
          lifiError,
        },
        profit: estimatedProfit.toFixed(3),
        riskScore,
        timestamp: new Date().toISOString(),
      };

    } catch (error: any) {
      logger.error("Critical error in arbitrage", { error: error.message });
      return {
        success: false,
        skill: "arbitrage",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
};
