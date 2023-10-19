declare module 'vante-db' {
  type FieldType = StringConstructor | NumberConstructor | BooleanConstructor | ObjectConstructor | ArrayConstructor;

  interface FieldSchema {
    type: FieldType;
    default?: any;
  }

  interface CollectionSchema {
    [key: string]: FieldSchema;
  }

  interface QueryOptions {
    multi?: boolean;
    sort?: string | [string, number];
    skip?: number;
    limit?: number;
    dryRun?: boolean;
    upsert?: boolean;
  }

  interface UpdateFields {
    [key: string]: any;
  }

  interface VanteDatabaseMethods {
    [key: string]: (...args: any[]) => any;
  }

  interface VanteDatabaseModel {
    find: (filter: any, options?: QueryOptions) => Promise<any[]>;
    findOne: (filter: any) => Promise<any>;
    updateOne: (filter: any, update: any, options?: QueryOptions) => Promise<any>;
    updateMany: (filter: any, update: any, options?: QueryOptions) => Promise<any[]>;
    deleteOne: (filter: any) => Promise<any>;
    deleteMany: (filter: any) => Promise<any[]>;
    create: (data: any) => Promise<any>;
  }

  class VanteDatabase {
    constructor();

    fetchFiles(fileName: string, options?: { upsert?: boolean }): Promise<void>;

    getDefaultValueForType(type: FieldType): any;

    matchFilter(item: any, filter: any): boolean;

    sortData(data: any[], options: QueryOptions): any[];

    applyNested(target: any, keys: string[], value: any): void;

    compareWithOperator(obj: any, operator: string, newData: any): any;

    saveData(collectionName: string): Promise<void>;

    model(name: string, schema: CollectionSchema, methods?: VanteDatabaseMethods): VanteDatabaseModel;

    find(collectionName: string, filter: any, options?: QueryOptions): Promise<any | any[]>;

    processUpdateFields(update: UpdateFields): UpdateFields;

    update(collectionName: string, filter: any, update: any, options?: QueryOptions): Promise<any | any[]>;

    delete(collectionName: string, filter: any, options?: { multi?: boolean }): Promise<any | any[]>;

    create(collectionName: string, data: any): Promise<any>;

    generateUniqueId(): string;
  }

  const vanteDatabase: VanteDatabase;

  export = vanteDatabase;
}
