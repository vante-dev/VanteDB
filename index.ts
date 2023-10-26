declare module 'vantedb' {
  interface VanteDatabaseOptions {
    upsert?: boolean;
    multi?: boolean;
    sort?: string | [string, number];
    skip?: number;
    limit?: number;
    Cluster?: string;
  }

  interface VanteDatabaseMethods {
    find(filter: any, options?: VanteDatabaseOptions): Promise<any[]>;
    findOne(filter: any, options?: VanteDatabaseOptions): Promise<any | null>;
    updateOne(filter: any, update: any, options?: VanteDatabaseOptions): Promise<any | null>;
    updateMany(filter: any, update: any, options?: VanteDatabaseOptions): Promise<any[]>;
    deleteOne(filter: any, options?: VanteDatabaseOptions): Promise<any | null>;
    deleteMany(filter: any, options?: VanteDatabaseOptions): Promise<any[]>;
    create(data: any, options?: VanteDatabaseOptions): Promise<any>;
    set(Key: string, Value: any, Options?: VanteDatabaseOptions): Promise<any>;
    push(Key: string, Value: any, Options?: VanteDatabaseOptions): Promise<any>;
    pull(Key: string, Value: any, Options?: VanteDatabaseOptions): Promise<any>;
    get(Key: string, Options?: VanteDatabaseOptions): Promise<any>;
    has(Key: string, Options?: VanteDatabaseOptions): Promise<boolean>;
    all(Options?: VanteDatabaseOptions): Promise<any[]>;
    add(Key: string, Value: any, Options?: VanteDatabaseOptions): Promise<any>;
    take(Key: string, Value: any, Options?: VanteDatabaseOptions): Promise<any>;
    delete(Key: string, Options?: VanteDatabaseOptions): Promise<void>;
  }

  interface VanteDatabaseModel {
    find: VanteDatabaseMethods['find'];
    findOne: VanteDatabaseMethods['findOne'];
    updateOne: VanteDatabaseMethods['updateOne'];
    updateMany: VanteDatabaseMethods['updateMany'];
    deleteOne: VanteDatabaseMethods['deleteOne'];
    deleteMany: VanteDatabaseMethods['deleteMany'];
    create: VanteDatabaseMethods['create'];
    set: VanteDatabaseMethods['set'];
    push: VanteDatabaseMethods['push'];
    pull: VanteDatabaseMethods['pull'];
    get: VanteDatabaseMethods['get'];
    has: VanteDatabaseMethods['has'];
    all: VanteDatabaseMethods['all'];
    add: VanteDatabaseMethods['add'];
    take: VanteDatabaseMethods['take'];
    delete: VanteDatabaseMethods['delete'];
  }

  class VanteDatabase {
    model(schema: any, methods?: VanteDatabaseMethods): VanteDatabaseModel;
  }

  const vanteDB: VanteDatabase;
  export = vanteDB;
}
