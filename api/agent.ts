// api/agent.ts
import { lifiClient, circleClient, logger, WALLET_ADDRESS, CIRCLE_WALLET_ID } from '../dist/lib/arcClient.js';

export default async function handler(req: any, res: any) {
  const { skill, params } = req.query;

  if (!skill) {
    return res.status(400).json({ 
      success: false, 
      error: "Parameter 'skill' diperlukan",
      availableSkills: ['arbitrage', 'liquidity_monitor', 'cross_bridge', 'a2a_handler', 'risk_management']
    });
  }

  try {
    // Dynamic import skill
    const skillPath = `../dist/skills/${skill}.js`;
    const skillModule = await import(skillPath);
    
    // Ambil nama function (contoh: arbitrageSkill)
    const functionName = Object.keys(skillModule)[0];
    const result = await skillModule[functionName].execute(
      typeof params === 'string' ? JSON.parse(params) : params || {}
    );

    res.status(200).json(result);
  } catch (error: any) {
    logger.error(`Error running skill ${skill}`, error);
    res.status(500).json({
      success: false,
      skill,
      error: error.message
    });
  }
}
