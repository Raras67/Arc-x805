// api/agent.ts
import type { SkillResult } from '../src/types.js';

export default async function handler(req: any, res: any) {
  const { skill, params: paramsStr } = req.query;

  if (!skill) {
    return res.status(400).json({
      success: false,
      error: "Parameter 'skill' diperlukan",
      availableSkills: ['arbitrage', 'liquidity_monitor', 'cross_bridge', 'a2a_handler', 'risk_management']
    });
  }

  try {
    // Dynamic import langsung dari src (Vercel akan compile otomatis)
    const skillPath = `../src/skills/${skill}.ts`;
    const skillModule = await import(skillPath);

    const functionName = Object.keys(skillModule)[0];
    const params = paramsStr ? JSON.parse(paramsStr) : {};

    const result: SkillResult = await skillModule[functionName].execute(params);

    return res.status(200).json(result);

  } catch (error: any) {
    console.error(`Error running skill ${skill}:`, error);
    return res.status(500).json({
      success: false,
      skill,
      error: error.message || 'Internal server error'
    });
  }
}
