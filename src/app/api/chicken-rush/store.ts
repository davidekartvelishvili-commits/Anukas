const rounds = new Map<string, { trapMap: number[]; difficulty: string; betAmount: number; currentRow: number; cashedOut: boolean; multiplier: number }>();

setInterval(() => { if (rounds.size > 1000) rounds.clear(); }, 300000);

export { rounds };
