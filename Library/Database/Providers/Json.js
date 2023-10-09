const fs = require('fs').promises;
const path = require('path');

class VanteDatabase {
    constructor(Folder) {
        this.basePath = path.join(Folder);
    }

    async model(Collection, Model, Options = { Type: 'Create' }) {
        try {
            if (Options.Type === 'Create') {
                const collectionPath = path.join(this.basePath, '-Models');
                const collectionFilePath = path.join(collectionPath, `${Collection}.json`);
                await fs.mkdir(collectionPath, { recursive: true });
                await fs.writeFile(collectionFilePath, JSON.stringify(Model, null, 2));
                return true;
            } else if (Options.Type === 'Find') {
                const collectionPath = path.join(this.basePath, '-Models');
                const collectionFilePath = path.join(collectionPath, `${Collection}.json`);
                try {
                    const data = await fs.readFile(collectionFilePath, 'utf-8');
                    return JSON.parse(data);
                } catch (error) {
                    if (error.code === 'ENOENT') {
                        return false;
                    }
                    throw error;
                }
            } else {
                throw new Error('Invalid Options.Type. Use "Create" or "Find".');
            }
        } catch (error) {
            throw new Error(`Model operation failed: ${error.message}`);
        }
    }

    validateData(Data, Model) {
        const errors = [];

        for (const key in Data) {
            if (!(key in Model)) {
                errors.push({ key, message: `${key}: ${Data[key]}` });
                continue;
            }

            const expectedType = Model[key].Type;
            const actualValue = Data[key];
            const actualType = typeof actualValue;

            if (expectedType === 'Array' || expectedType === 'Object') {
                continue;
            }

            if (actualValue === null || actualValue === undefined) {
                if (expectedType !== 'Object') {
                    errors.push({ key, message: `${key}: has an incorrect type.` });
                }
            } else if (`${actualType}`.toLowerCase() !== `${expectedType}`.toLowerCase()) {
                errors.push({ key, message: `${key}: has an incorrect type.` });
            }
        }

        return errors.length === 0 ? { status: true } : { status: false, errors };
    }

    async fetchFiles(folderName, fileName, options = { upsert: false }) {
        const guildDirectory = path.join(this.basePath, folderName);
        const moduleFile = path.join(guildDirectory, fileName + '.json');

        async function ensureDirectoryExists(directoryPath) {
            try {
                await fs.mkdir(directoryPath, { recursive: true });
            } catch (error) {
                throw new Error(`Error creating directory: ${error.message}`);
            }
        }

        async function ensureFileExists(filePath, data = '[]') {
            try {
                await fs.access(filePath);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    await fs.writeFile(filePath, data);
                } else {
                    throw new Error(`Error accessing file: ${error.message}`);
                }
            }
        }

        try {
            if (options.upsert) {
                await ensureDirectoryExists(this.basePath);
                await ensureDirectoryExists(guildDirectory);
                await ensureFileExists(moduleFile, '[]');
            } else {
                if (!(await fs.access(moduleFile).catch((error) => error.code === 'ENOENT'))) {
                    return moduleFile;
                }
                return null;
            }

            return moduleFile;
        } catch (error) {
            throw new Error(`Error fetching files: ${error.message}`);
        }
    }

    async write(Cluster, Collection, data) {
        try {
            const moduleFile = await this.fetchFiles(Cluster, Collection, { upsert: true });
            await fs.writeFile(moduleFile, JSON.stringify(data, null, 2));
        } catch (error) {
            throw new Error(`Error writing data: ${error.message}`);
        }
    }

    async read(Cluster, Collection) {
        try {
            const moduleFile = await this.fetchFiles(Cluster, Collection, { upsert: false });

            if (moduleFile) {
                const fileData = await fs.readFile(moduleFile, 'utf8');
                return JSON.parse(fileData);
            } else {
                return null;
            }
        } catch (error) {
            throw new Error(`Error reading data: ${error.message}`);
        }
    }

    async create(Cluster, Collection, Data) {
        try {
            const model = await this.read('-Models', Collection);
            if (!model) {
                throw new Error(`Collection model for '${Collection}' does not exist. Create a model first.`);
            }

            const isValidData = this.validateData(Data, model);
            if (!isValidData.status) {
                throw new Error(`Data does not match the model for '${Collection}'. (${isValidData.errors[0].message})`);
            }
            const existingData = await this.read(Cluster, Collection) || [];

            for (const key in model) {
                if (!(key in Data)) {
                    Data[key] = model[key].Default;
                }
            }

            existingData.push(Data);
            await this.write(Cluster, Collection, existingData);

            return true;
        } catch (error) {
            throw new Error(`Error creating data: ${error.message}`);
        }
    }

    async find(Cluster, Collection, query = {}, options = {}) {
        try {
            const model = await this.read('-Models', Collection);
            if (!model) {
                throw new Error(`Collection model for '${Collection}' does not exist. Create a model first.`);
            }

            const data = await this.read(Cluster, Collection) || [];

            for (const key in query) {
                if (!(key in model)) {
                    throw new Error(`Query field '${key}' is not defined in the '${Collection}' model.`);
                }
            }

            if (!data) {
                return null;
            }

            function deepValue(obj, path) {
                const paths = path.split('.');
                let current = obj;

                for (const key of paths) {
                    if (current[key] === undefined) {
                        return undefined;
                    }
                    current = current[key];
                }

                return current;
            }

            const filteredData = data.filter((item) => {
                for (const key in query) {
                    if (item[key] !== query[key]) {
                        return false;
                    }
                }
                return true;
            });

            if (options.sort) {
                const [field, order = 1] = options.sort;
                filteredData.sort((a, b) => {
                    const valA = deepValue(a, field);
                    const valB = deepValue(b, field);
                    return (valA - valB) * order;
                });
            }

            if (options.limit) {
                filteredData.splice(options.limit);
            }

            if (options.skip) {
                filteredData.splice(0, options.skip);
            }

            return filteredData;
        } catch (error) {
            throw new Error(`Error finding data: ${error.message}`);
        }
    }

    async findOne(Cluster, Collection, query = {}, options = { upsert: false }) {
        try {
            const model = await this.read('-Models', Collection);
    
            if (!model) {
                throw new Error(`Collection model for '${Collection}' does not exist. Create a model first.`);
            }
    
            const data = await this.read(Cluster, Collection) || [];
    
            for (const key in query) {
                if (!(key in model)) {
                    throw new Error(`Query field '${key}' is not defined in the '${Collection}' model.`);
                }
            }
    
            const matchingDocument = data.find((item) => {
                for (const key in query) {
                    if (item[key] !== query[key]) {
                        return false;
                    }
                }
                return true;
            });
    
            if (!matchingDocument && options.upsert) {
                const defaults = Object.keys(model).filter(key => model[key].hasOwnProperty('Default')).reduce((acc, key) => { acc[key] = model[key].Default; return acc; }, {});
                newDocument = { ...defaults, ...query };
                data.push(newDocument);
                await this.write(Cluster, Collection, data);
                return newDocument;
            }
    
            return matchingDocument || null;
        } catch (error) {
            throw new Error(`Error finding one document: ${error.message}`);
        }
    }
    

    async update(Cluster, Collection, query, update) {
        try {
            await this.fetchFiles(Cluster, Collection, { upsert: false });
            const modelFile = await this.fetchFiles('-Models', Collection, { upsert: false });

            if (!modelFile) {
                throw new Error(`Collection model for '${Collection}' does not exist. Create a model first.`);
            }

            const model = await this.read('-Models', Collection);
            const data = await this.read(Cluster, Collection) || [];

            for (const key in query) {
                if (!(key in model)) {
                    throw new Error(`Query field '${key}' is not defined in the '${Collection}' model.`);
                }
            }

            const matchingDocuments = data.filter((item) => {
                for (const key in query) {
                    if (query[key] !== item[key]) {
                        return false;
                    }
                }
                return true;
            });

            if (matchingDocuments.length === 0) {
                return false;
            }

            for (const matchingDocument of matchingDocuments) {
                for (const operator in update) {
                    if (operator === '$set') {
                        const setFields = update[operator];
                        for (const field in setFields) {
                            if (field.includes('.')) {
                                const fieldParts = field.split('.');
                                let currentObject = matchingDocument;
                                for (let i = 0; i < fieldParts.length - 1; i++) {
                                    const part = fieldParts[i];
                                    if (!currentObject[part]) {
                                        currentObject[part] = {};
                                    }
                                    currentObject = currentObject[part];
                                }

                                const nestedField = fieldParts[fieldParts.length - 1];
                                currentObject[nestedField] = setFields[field];
                            } else {
                                matchingDocument[field] = setFields[field];
                            }
                        }
                    } else if (operator === '$inc') {
                        const incOperators = update[operator];
                        for (const field in incOperators) {
                            const value = incOperators[field];
                            if (field.includes('.')) {
                                const fieldParts = field.split('.');
                                let currentObject = matchingDocument;
                                for (let i = 0; i < fieldParts.length - 1; i++) {
                                    const part = fieldParts[i];
                                    if (!currentObject[part]) {
                                        currentObject[part] = {};
                                    }
                                    currentObject = currentObject[part];
                                }

                                const nestedField = fieldParts[fieldParts.length - 1];
                                if (typeof currentObject[nestedField] === 'number') {
                                    currentObject[nestedField] += value;
                                } else {
                                    currentObject[nestedField] = value;
                                }
                            } else {
                                if (typeof matchingDocument[field] === 'number') {
                                    matchingDocument[field] += value;
                                }
                            }
                        }
                    } else if (operator === '$push') {
                        const pushFields = update[operator];
                        for (const field in pushFields) {
                            if (!Array.isArray(matchingDocument[field])) {
                                matchingDocument[field] = [];
                            }
                            matchingDocument[field].push(pushFields[field]);
                        }
                    } else if (operator === '$pull') {
                        const pullFields = update[operator];
                        for (const field in pullFields) {
                            if (Array.isArray(matchingDocument[field])) {
                                matchingDocument[field] = matchingDocument[field].filter((value) => value !== pullFields[field]);
                            }
                        }
                    }
                }
            }

            await this.write(Cluster, Collection, data);

            return true;
        } catch (error) {
            throw new Error(`Error updating documents: ${error.message}`);
        }
    }

    async updateOne(Cluster, Collection, query, update, options = {}) {
        try {
            await this.fetchFiles(Cluster, Collection, { upsert: false });
            const modelFile = await this.fetchFiles('-Models', Collection, { upsert: false });

            if (!modelFile) {
                throw new Error(`Collection model for '${Collection}' does not exist. Create a model first.`);
            }

            const model = await this.read('-Models', Collection);
            const data = await this.read(Cluster, Collection) || [];

            for (const key in query) {
                if (!(key in model)) {
                    throw new Error(`Query field '${key}' is not defined in the '${Collection}' model.`);
                }
            }

            let matchingDocument = data.find((item) => {
                for (const key in query) {
                    if (query[key] !== item[key]) {
                        return false;
                    }
                }
                return true;
            });

            if (!matchingDocument) {
                if (options.upsert) {
                    const defaults = Object.keys(model).filter(key => model[key].hasOwnProperty('Default')).reduce((acc, key) => { acc[key] = model[key].Default; return acc; }, {});
                    matchingDocument = { ...defaults, ...query };
                    data.push(matchingDocument);
                } else {
                    if (options.new) {
                        return null;
                    }
                    return false;
                }
            }

            for (const operator in update) {
                if (operator === '$set') {
                    const setFields = update[operator];
                    for (const field in setFields) {
                        if (field.includes('.')) {
                            const fieldParts = field.split('.');
                            let currentObject = matchingDocument;
                            for (let i = 0; i < fieldParts.length - 1; i++) {
                                const part = fieldParts[i];
                                if (!currentObject[part]) {
                                    currentObject[part] = {};
                                }
                                currentObject = currentObject[part];
                            }

                            const nestedField = fieldParts[fieldParts.length - 1];
                            currentObject[nestedField] = setFields[field];
                        } else {
                            matchingDocument[field] = setFields[field];
                        }
                    }
                } else if (operator === '$inc') {
                    const incOperators = update[operator];
                    for (const field in incOperators) {
                        const value = incOperators[field];
                        if (field.includes('.')) {
                            const fieldParts = field.split('.');
                            let currentObject = matchingDocument;
                            for (let i = 0; i < fieldParts.length - 1; i++) {
                                const part = fieldParts[i];
                                if (!currentObject[part]) {
                                    currentObject[part] = {};
                                }
                                currentObject = currentObject[part];
                            }

                            const nestedField = fieldParts[fieldParts.length - 1];
                            if (typeof currentObject[nestedField] === 'number') {
                                currentObject[nestedField] += value;
                            } else {
                                currentObject[nestedField] = value;
                            }
                        } else {
                            if (typeof matchingDocument[field] === 'number') {
                                matchingDocument[field] += value;
                            } else {
                                matchingDocument[field] = value;
                            }
                        }
                    }
                } else if (operator === '$push') {
                    const pushFields = update[operator];
                    for (const field in pushFields) {
                        if (!Array.isArray(matchingDocument[field])) {
                            matchingDocument[field] = [];
                        }
                        matchingDocument[field].push(pushFields[field]);
                    }
                } else if (operator === '$pull') {
                    const pullFields = update[operator];
                    for (const field in pullFields) {
                        if (Array.isArray(matchingDocument[field])) {
                            matchingDocument[field] = matchingDocument[field].filter((value) => value !== pullFields[field]);
                        }
                    }
                }
            }

            await this.write(Cluster, Collection, data);

            if (options.new) {
                return matchingDocument;
            }
            return true;
        } catch (error) {
            throw new Error(`Error updating document: ${error.message}`);
        }
    }

    async delete(Cluster, Collection, query) {
        try {
            const clusterFilePath = path.join(this.basePath, Cluster);
            const collectionFilePath = path.join(clusterFilePath, `${Collection}.json`);

            if (query) {
                const data = await this.read(Cluster, Collection) || [];
                const filteredData = data.filter((item) => {
                    for (const key in query) {
                        if (query[key] !== item[key]) {
                            return true;
                        }
                    }
                    return false;
                });

                await this.write(Cluster, Collection, filteredData);
            } else if (Collection) {
                await fs.unlink(collectionFilePath);
            } else if (Cluster) {
                await fs.rm(clusterFilePath, { recursive: true });
            }

            return true;
        } catch (error) {
            throw new Error(`Error deleting data: ${error.message}`);
        }
    }

    async size(Cluster, Collection) {
        try {
            if (!Cluster) {
                throw new Error('Cluster name is required.');
            }

            async function getDirectorySize(directoryPath) {
                const files = await fs.readdir(directoryPath);
                let totalSize = 0;

                for (const file of files) {
                    const filePath = path.join(directoryPath, file);
                    const stats = await fs.stat(filePath);

                    if (stats.isFile()) {
                        totalSize += stats.size;
                    } else if (stats.isDirectory()) {
                        totalSize += await getDirectorySize(filePath);
                    }
                }

                return totalSize;
            }

            async function getDocumentsSize(directoryPath) {
                try {
                    const files = await fs.readdir(directoryPath);
                    let totalArrayLength = 0;

                    for (const file of files) {
                        if (file.endsWith('.json')) {
                            const filePath = path.join(directoryPath, file);
                            const fileContent = await fs.readFile(filePath, 'utf8');
                            const jsonData = JSON.parse(fileContent);
                            totalArrayLength += jsonData.length;
                        }
                    }

                    return totalArrayLength;
                } catch (error) {
                    throw new Error(`Error reading directory: ${error.message}`);
                }
            }

            function formatSize(sizeInBytes) {
                const KB = sizeInBytes / 1024;
                const MB = KB / 1024;

                if (MB >= 1) {
                    return `${MB.toFixed(2)} MB`;
                } else if (KB >= 1) {
                    return `${KB.toFixed(2)} KB`;
                } else {
                    return `${sizeInBytes} bytes`;
                }
            }

            if (!Collection) {
                const clusterPath = path.join(this.basePath, Cluster);
                const clusterSize = await getDirectorySize(clusterPath);

                return { size: formatSize(clusterSize), documents: await getDocumentsSize(clusterPath) };
            } else {
                const collectionFilePath = path.join(this.basePath, Cluster, `${Collection}.json`);
                const stats = await fs.stat(collectionFilePath);

                const collectionContent = await fs.readFile(collectionFilePath, 'utf8');
                const jsonData = JSON.parse(collectionContent);

                return { size: formatSize(stats.size), documents: jsonData.length };
            }
        } catch (error) {
            throw new Error(`Error getting data size: ${error.message}`);
        }
    }
}

module.exports = VanteDatabase;
