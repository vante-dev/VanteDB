const packageJson = require("../package.json");
const JsonProvider = require('./Operation/Json');
const path = require("path");

/**
 * A class representing a DatabaseManager.
 */
class DatabaseManager {
    /**
     * Create a new DatabaseManager instance.
     * @param {string} storageType - The type of storage to use (e.g., 'Json').
     * @param {object} options - Options for the database operation.
     * @throws {Error} If an unsupported storage type is provided.
     */
    constructor(storageType, options) {
        /**
         * The type of storage being used.
         * @type {string}
         */
        this.storageType = storageType;

        /**
         * Options for the database operation.
         * @type {object}
         */
        this.options = options;

        if (this.storageType === 'Json') {
            /**
             * The database operation instance.
             * @type {JsonProvider}
             */
            this.operation = new JsonProvider(this.options.Folder ?? 'VanteDB');
        } else {
            throw new Error(`Unsupported storage type: ${this.storageType}`);
        }

        if (!packageJson.development) {
            // Check for updates to the Vante Database module
            fetch("https://registry.npmjs.org/vantedb/latest")
                .then(async (res) => {
                    const data = await res.json();
                    if (packageJson.version !== data.version) {
                        console.warn(`[VanteDB] You are using an outdated version of Vante Database. Please update the module using 'npm update vantedb'. For support or help, join our Discord server: https://discord.gg/luppux`);
                    }
                })
                .catch((error) => {
                    console.error(`[VanteDB] Error checking for updates: ${error.message}`);
                });
        }
    };

    /**
    * Create a new record in the database.
    * @param {string} folderID - The folder where the record should be stored.
    * @param {string} fileID - The name of the record file.
    * @param {any} data - The data to be stored in the record.
    * @throws {TypeError} If folderID, fileID, or data is missing.
    */
    async create(folderID, fileID, data) {
        if (!folderID) {
            throw new TypeError('[VanteDB] Please provide a folder name.');
        }
        if (!fileID) {
            throw new TypeError('[VanteDB] Please provide a file name.');
        }
        if (!data) {
            throw new TypeError('[VanteDB] Please provide data.');
        }

        return await this.operation.create(folderID, fileID, data);
    };

    /**
    * Create/Update a new record in the database.
    * @param {string} folderID - The folder where the record should be stored.
    * @param {string} fileID - The name of the record file.
    * @param {any} data - The data to be stored in the record.
    * @throws {TypeError} If folderID, fileID, or data is missing.
    */
    async set(folderID, fileID, data) {
        if (!folderID) {
            throw new TypeError('[VanteDB] Please provide a folder name.');
        }
        if (!fileID) {
            throw new TypeError('[VanteDB] Please provide a file name.');
        }
        if (!data) {
            throw new TypeError('[VanteDB] Please provide data.');
        }

        return await this.operation.set(folderID, fileID, data);
    }
    /**
     * Get a file from a specified folder.
     * @param {string} folderID - The ID of the folder.
     * @param {string} fileID - The ID of the file to retrieve.
     * @throws {TypeError} If `folderID` or `fileID` is not provided.
     */
    async read(folderID, fileID, query) {
        if (!folderID) {
            throw new TypeError('[VanteDB] Please provide a folder name.');
        }

        if (!fileID) {
            throw new TypeError('[VanteDB] Please provide a file name.');
        }
        return await this.operation.get(folderID, fileID, query);
    };

    /**
    * Updates a record in the database.
    *
    * @param {string} folderID - The folder where the record should be stored.
    * @param {string} fileID - The name of the record file.
    * @param {any} query - The query to identify the record to be updated.
    * @param {any} updatedData - The data to be stored in the updated record.
    * @throws {TypeError} If folderID, fileID, or updatedData is missing.
    */
    async update(folderID, fileID, query, updatedData, options) {
        if (!folderID) {
            throw new TypeError('[VanteDB] Please provide a folder name.');
        }
        if (!fileID) {
            throw new TypeError('[VanteDB] Please provide a file name.');
        }

        if (!query) {
            throw new TypeError('[VanteDB] Please provide a query so i can identify the record.');
        }

        if (!updatedData) {
            throw new TypeError('[VanteDB] Please provide updated data.');
        }

        return await this.operation.update(folderID, fileID, query, updatedData, options);
    };

    /**
    * Deletes a record in the database.
    *
    * @param {string} folderID - The folder where the record should be stored.
    * @param {string} fileID - The name of the record file.
    * @param {any} query - The query to identify the record to be deleted.
    * @throws {TypeError} If folderID, fileID is missing.
    */
    async delete(folderID, fileID, query) {
        if (!folderID) {
            throw new TypeError('[VanteDB] Please provide a folder name.');
        }
        if (!fileID) {
            throw new TypeError('[VanteDB] Please provide a file name.');
        }

        if (!query) {
            throw new TypeError('[VanteDB] Please provide a query so i can identify the record.');
        }

        return await this.operation.delete(folderID, fileID, query);
    };

    /**
    * Finds a record in the database.
    *
    * @param {string} folderID - The folder where the record should be looked at.
    * @param {string} fileID - The name of the record file.
    * @param {any} query - The query to identify the record to be foundt.
    * @throws {TypeError} If folderID, fileID is missing.
    */
    async find(folderID, fileID, query) {
        if (!folderID) {
            throw new TypeError('[VanteDB] Please provide a folder name.');
        }
        if (!fileID) {
            throw new TypeError('[VanteDB] Please provide a file name.');
        }

        if (!query) {
            throw new TypeError('[VanteDB] Please provide a query so i can identify the record.');
        }

        return await this.operation.find(folderID, fileID, query);
    };

    /**
    * Update All record in the database.
    *
    * @param {string} folderID - The folder where the record should be looked at.
    * @param {string} fileID - The name of the record file.
    * @param {any} query - The query to identify the record to be updated.
    * @param {any} upsert - The data to be stored in the upserted record.
    * @throws {TypeError} If folderID, fileID is missing.
    */
    async updateMany(folderID, fileID, query, data, options) {
        if (!folderID) {
            throw new TypeError('[VanteDB] Please provide a folder name.');
        }
        if (!fileID) {
            throw new TypeError('[VanteDB] Please provide a file name.');
        }

        if (!query) {
            throw new TypeError('[VanteDB] Please provide a query so i can identify the record.');
        }

        if (!data) {
            throw new TypeError('[VanteDB] Please provide update data.');
        }

        return await this.operation.updateMany(folderID, fileID, query, data, options);
    };


    /**
    * Deletes multiple records from a specific folder and file based on a query.
    *
    * @param {string} folderID - The ID of the folder where the records are stored.
    * @param {string} fileID - The ID of the file within the folder.
    * @param {Object} query - The query used to identify the records to be deleted.
    * @throws {TypeError} If `folderID`, `fileID`, or `query` is not provided.
    */
    async deleteMany(folderID, fileID, query) {
        if (!folderID) {
            throw new TypeError('[VanteDB] Please provide a folder name.');
        }
        if (!fileID) {
            throw new TypeError('[VanteDB] Please provide a file name.');
        }

        if (!query) {
            throw new TypeError('[VanteDB] Please provide a query so I can identify the record.');
        }

        return await this.operation.deleteMany(folderID, fileID, query);
    };
};

module.exports = DatabaseManager;
