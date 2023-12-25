export type Token = {
  price: {
    ton: number;
    usd: number;
  };
  delta: number;
  logoUrl: string;
  symbol: string;
  chartUrl: string;
};

export type Project = {
  name: string;
  logoUrl: string;
  uaw: number;
  uawDelta: number;
  chartUrl: string;
};
