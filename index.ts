declare module "vantedb" {
    interface Document {
        [key: string]: any;
    }

    interface DatabaseOptions {
        Folder?: string;
        UpdateCheck?: boolean;
    }

    export class Database {
        constructor(options?: DatabaseOptions);

        model(Collection: string, Model: Record<string, any>): Promise<any>;

        create(Cluster: string, Collection: string, Data: Document): Promise<any>;

        find(
            Cluster: string,
            Collection: string,
            Query: Document,
            Options?: Record<string, any>
        ): Promise<Document[]>;

        findOne(
            Cluster: string,
            Collection: string,
            Query: Document,
            Options?: Record<string, any>
        ): Promise<Document | null>;

        update(
            Cluster: string,
            Collection: string,
            Update: Document,
            Options?: Record<string, any>
        ): Promise<any>;

        updateOne(
            Cluster: string,
            Collection: string,
            Query: Document,
            Update: Document,
            Options?: Record<string, any>
        ): Promise<Document>;

        delete(Cluster: string, Collection: string, Query: Document): Promise<any>;
        
        size(Cluster: string, Collection: string): Promise<Record<string, any>>;
    }
}
