export interface ProgramDTO {
    id: number;
    name: string;
    imagePath?: string;
    extractionRule?: string;
  }
  
  export interface CuttingSheetDTO {
    id: number;
    article: string;
    program?: ProgramDTO;
    indice: string;
    type: string;
    hasSerialNumber: boolean;
    operationsJson: string;
    customOperationIds: number[];
    revisionHistory: string;
    createdBy?: string;
    createdAt: string;
  }