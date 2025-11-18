// Common interfaces and types

export interface ITimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface IBaseDocument extends ITimestamps {
  _id: string;
}
