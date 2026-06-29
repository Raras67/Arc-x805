// src/types.ts
export type SkillResult = {
  success: boolean;
  skill?: string;
  data?: any;
  error?: string;
  txId?: string;
  profit?: string | number;
  riskScore?: number;
  recommendation?: string;
  timestamp?: string;
};

export type AgentSkill = {
  id: string;
  name: string;
  description: string;
  execute: (params: any) => Promise<SkillResult>;
};
