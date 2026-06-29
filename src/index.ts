import express from "express";
import dotenv from "dotenv";

// Import dengan .js (wajib untuk ESM walaupun file asli .ts)
import { arbitrageSkill } from "./skills/arbitrage.js";
import { liquidityMonitor } from "./skills/liquidityMonitor.js";
import { crossBridge } from "./skills/crossBridge.js";
import { a2aHandler } from "./skills/a2aHandler.js";
import { riskManagement } from "./skills/riskManagement.js";

dotenv.config();

const app = express();
app.use(express.json());

const skills = {
  arbitrage: arbitrageSkill,
  liquidity_monitor: liquidityMonitor,
  cross_bridge: crossBridge,
  a2a_handler: a2aHandler,
  risk_management: riskManagement,
} as const;

// ===================== CLI MODE =====================
if (process.argv[2] === "run") {
  const skillName = process.argv[3] as keyof typeof skills;
  const paramsStr = process.argv[4] || "{}";
  
  let params;
  try {
    params = JSON.parse(paramsStr);
  } catch {
    params = {};
  }

  const skill = skills[skillName];
  if (!skill) {
    console.error(`❌ Skill "${skillName}" tidak ditemukan!`);
    console.log("Skill tersedia:", Object.keys(skills));
    process.exit(1);
  }

  console.log(`⚡ Menjalankan skill: ${skillName}`);
  skill.execute(params)
    .then(result => {
      console.dir(result, { depth: null });
      process.exit(0);
    })
    .catch(err => {
      console.error("Error executing skill:", err);
      process.exit(1);
    });
}

// ===================== HTTP SERVER =====================
app.post("/execute/:skill", async (req, res) => {
  const skillName = req.params.skill as keyof typeof skills;
  const skill = skills[skillName];

  if (!skill) {
    return res.status(404).json({ 
      success: false, 
      error: `Skill "${skillName}" not found`,
      available: Object.keys(skills)
    });
  }

  try {
    const result = await skill.execute(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      skill: skillName,
      error: error.message
    });
  }
});

app.get("/skills", (_, res) => {
  res.json(Object.keys(skills));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Arc Agent berjalan di http://localhost:${PORT}`);
  console.log(`Available skills →`, Object.keys(skills));
});
