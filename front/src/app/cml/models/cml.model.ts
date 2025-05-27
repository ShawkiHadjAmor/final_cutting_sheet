export interface Cml {
    id: number;
    article: string;
    dataJson: string;
    dataHash: string;
    createdAt: string;
    ordo: {
      id: number;
      dataJson: string;
      article: string;
      createdAt: string;
    };
  }