
import { GoogleGenAI } from "@google/genai";
import { Asset, Currency, InvestmentPath } from "../types";

export const analyzePortfolio = async (
  assets: Asset[],
  currencies: Currency[],
  paths: InvestmentPath[]
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const portfolioSummary = assets.map(asset => {
    const currency = currencies.find(c => c.code === asset.currencyCode);
    const path = paths.find(p => p.id === asset.pathId);
    return `资产: ${asset.name}, 路径: ${path?.name}, 金额: ${asset.amount} ${asset.currencyCode}, 预期收益率: ${asset.annualYield}%`;
  }).join('\n');

  const prompt = `
    作为一位世界级的理财顾问，请分析以下投资组合：
    
    ${portfolioSummary}
    
    请提供：
    1. 组合的风险评估。
    2. 对当前人民币、港币、美元配置比例的看法。
    3. 3条具体的优化建议，以平衡保值与增值需求。
    4. 对未来6-12个月多元化配置的展望。
    
    请用专业、简洁且富有洞察力的中文回答。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "暂时无法生成分析，请检查网络连接或稍后再试。";
  }
};
