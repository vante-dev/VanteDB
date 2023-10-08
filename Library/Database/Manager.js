const JsonProvider = require('./Providers/Json');
const VantePackage = require("../../Package.json");

/**
 * Represents a Vante Database instance.
 * @class
 */
class Database {
    /**
     * Create a new instance of the Vante Database.
     * @constructor
     * @param {Object} [options] - The options for configuring the database.
     * @param {string} [options.Folder='VanteDB'] - The folder where database files will be stored.
     * @param {boolean} [options.UpdateCheck=true] - Whether to check for updates on initialization.
     */
    constructor(options = { Folder: 'VanteDB', UpdateCheck: true }) {
        /**
         * The folder where database files will be stored.
         * @type {string}
         */
        this.folder = options.Folder;

        /**
         * The data operation provider.
         * @type {JsonProvider}
         */
        this.operation = new JsonProvider(this.folder);

        if (options.UpdateCheck) {
            // Check for updates when enabled
            fetch("https://registry.npmjs.org/vantedb/latest").then(async (res) => {
                const data = await res.json();
                if (VantePackage.version !== data.version) {
                    console.warn(`[VanteDB] You are using an outdated version of Vante Database. Please update the module using 'npm update vantedb'. For support or help, join our Discord server: https://discord.gg/luppux`);
                }
            }).catch((error) => {
                console.error(`[VanteDB] Error checking for updates: ${error.message}`);
            });
        }
    }

    /**
     * Define a model for a collection.
     * @async
     * @param {string} Collection - The name of the collection to define the model for.
     * @param {Object} Model - The model schema for the collection.
     * @returns {Promise} A promise that resolves when the model is defined.
     * @throws {Error} Throws an error if required parameters are missing.
     */
    async model(Collection, Model) {
        if (!Collection || !Model) {
            throw new Error('Missing required parameters: Collection, Model');
        }

        return this.operation.model(Collection, Model, { Type: 'Create' });
    }

    /**
     * Create new documents in a collection.
     * @async
     * @param {string} Cluster - The cluster name.
     * @param {string} Collection - The name of the collection to create documents in.
     * @param {Array|Object} Data - The data to be added to the collection.
     * @returns {Promise} A promise that resolves when documents are created.
     * @throws {Error} Throws an error if required parameters are missing.
     */
    async create(Cluster, Collection, Data) {
        if (!Cluster || !Collection || !Data) {
            throw new Error('Missing required parameters: Cluster, Collection, Data');
        }

        return this.operation.create(Cluster, Collection, Data);
    }

    /**
     * Find documents in a collection that match the specified query.
     * @async
     * @param {string} Cluster - The cluster name.
     * @param {string} Collection - The name of the collection to search in.
     * @param {Object} Query - The query to filter documents.
     * @param {Object} Options - Additional options for the find operation.
     * @returns {Promise} A promise that resolves with the matching documents.
     * @throws {Error} Throws an error if required parameters are missing.
     */
    async find(Cluster, Collection, Query, Options) {
        if (!Cluster || !Collection || !Query) {
            throw new Error('Missing required parameters: Cluster, Collection, Query');
        }

        return this.operation.find(Cluster, Collection, Query, Options);
    }

    /**
     * Find a single document in a collection that matches the specified query.
     * @async
     * @param {string} Cluster - The cluster name.
     * @param {string} Collection - The name of the collection to search in.
     * @param {Object} Query - The query to find a document.
     * @param {Object} Options - Additional options for the find operation.
     * @returns {Promise} A promise that resolves with the matching document.
     * @throws {Error} Throws an error if required parameters are missing.
     */
    async findOne(Cluster, Collection, Query, Options) {
        if (!Cluster || !Collection || !Query) {
            throw new Error('Missing required parameters: Cluster, Collection, Query');
        }

        return this.operation.findOne(Cluster, Collection, Query, Options);
    }

    /**
     * Update documents in a collection that match the specified query.
     * @async
     * @param {string} Cluster - The cluster name.
     * @param {string} Collection - The name of the collection to update documents in.
     * @param {Object} Update - The update operation to apply to matching documents.
     * @param {Object} Options - Additional options for the update operation.
     * @returns {Promise} A promise that resolves when documents are updated.
     * @throws {Error} Throws an error if required parameters are missing.
     */
    async update(Cluster, Collection, Update, Options) {
        if (!Cluster || !Collection || !Update) {
            throw new Error('Missing required parameters: Cluster, Collection, Update');
        }

        return this.operation.update(Cluster, Collection, Update, Options);
    }

    /**
     * Update a single document in a collection that matches the specified query.
     * @async
     * @param {string} Cluster - The cluster name.
     * @param {string} Collection - The name of the collection to update documents in.
     * @param {Object} Query - The query to find the document to update.
     * @param {Object} Update - The update operation to apply to the document.
     * @param {Object} Options - Additional options for the update operation.
     * @returns {Promise} A promise that resolves when the document is updated.
     * @throws {Error} Throws an error if required parameters are missing.
     */
    async updateOne(Cluster, Collection, Query, Update, Options) {
        if (!Cluster || !Collection || !Query || !Update) {
            throw new Error('Missing required parameters: Cluster, Collection, Query, Update');
        }

        return this.operation.updateOne(Cluster, Collection, Query, Update, Options);
    }

    /**
     * Delete documents in a collection that match the specified query.
     * @async
     * @param {string} Cluster - The cluster name.
     * @param {string} Collection - The name of the collection to delete documents from.
     * @param {Object} Query - The query to filter documents for deletion.
     * @returns {Promise} A promise that resolves when documents are deleted.
     */
    async delete(Cluster, Collection, Query) {
        return this.operation.delete(Cluster, Collection, Query);
    }

    /**
     * Get the size of a collection.
     * @async
     * @param {string} Cluster - The cluster name.
     * @param {string} Collection - The name of the collection to get the size of.
     * @returns {Promise} A promise that resolves with the size of the collection.
     */
    async size(Cluster, Collection) {
        return this.operation.size(Cluster, Collection);
    }
}

module.exports = Database;
