const { writeFile, access, mkdir } = require('fs').promises;
const { readFileSync } = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

class VanteDatabase {
    constructor() {
        this.collections = {};
        this.basePath = path.join('Database');
    }

    async fetchFiles(fileName, options = { upsert: false }) {
      const guildDirectory = path.join(this.basePath);
      const moduleFile = path.join(guildDirectory, fileName + '.json');
  
      async function ensureDirectoryExists(directoryPath) {
        try {
          await mkdir(directoryPath, { recursive: true });
        } catch (error) {
          throw new Error(`Error creating directory: ${error.message}`);
        }
      }
  
      async function ensureFileExists(filePath, data = '[]') {
        try {
          await access(filePath);
        } catch (error) {
          if (error.code === 'ENOENT') {
            await writeFile(filePath, data);
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
        } else {}
      } catch (error) {
        throw new Error(`Error fetching files: ${error.message}`);
      }
    }

    getDefaultValueForType(type) {
        switch (type) {
          case String:
            return '';
          case Number:
            return 0;
          case Boolean:
            return false;
          case Object:
            return {};
          case Array:
            return [];
          default:
            return null;
        }
    }

    matchFilter(item, filter) {
      const operators = {
        $and: (item, filters) => filters.every(subFilter => this.matchFilter(item, subFilter)),
        $or: (item, filters) => filters.some(subFilter => this.matchFilter(item, subFilter)),
        $nor: (item, filters) => filters.every(subFilter => !this.matchFilter(item, subFilter)),
        $gt: (value, target) => value > target,
        $gte: (value, target) => value >= target,
        $lt: (value, target) => value < target,
        $lte: (value, target) => value <= target,
        $eq: (value, target) => value === target,
        $ne: (value, target) => value !== target,
        $in: (value, target) => target.includes(value),
        $nin: (value, target) => !target.includes(value),
        $regex: (value, target) => new RegExp(target).test(value),
      };
    
      if (filter && typeof filter === 'object') {
        return Object.entries(filter).every(([key, value]) => {
          if (key.startsWith('$')) {
            const operator = operators[key];
            if (operator) {
              return operator(item, value);
            }
          } else {
            return item[key] === value;
          }
        });
      }
    
      return item === filter;
    }

    sortData(data, options) {
      const { sort } = options;
    
      function getNestedFieldValue(obj, path) {
        const keys = path.split('.');
        let value = obj;
    
        for (const key of keys) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
          } else {
            return undefined;
          }
        }
    
        return value;
      }
    
      if (!sort) {
        return data;
      }
    
      const [field, order] = Array.isArray(sort) ? sort : [sort, 1];
      const sortOrder = order === -1 ? -1 : 1;
    
      const compareValues = (a, b) => {
        if (a < b) {
          return -1 * sortOrder;
        }
        if (a > b) {
          return 1 * sortOrder;
        }
        return 0;
      };
    
      return [...data].sort((a, b) => compareValues(getNestedFieldValue(a, field), getNestedFieldValue(b, field)));
    }
    

    applyNested(target, keys, value) {
        const lastKey = keys.pop();
        let currentObj = target;
      
        keys.forEach(key => {
          if (!currentObj[key] || typeof currentObj[key] !== 'object') {
            currentObj[key] = {};
          }
          currentObj = currentObj[key];
        });
      
        currentObj[lastKey] = value;
    };

    compareWithOperator = (obj, operator, newData) => {
        const operators = {
          $set: (target, data) => {
            Object.keys(data).forEach(key => {
              const keys = key.split('.');
              if (keys.length > 1) {
                this.applyNested(target, keys, data[key]);
              } else {
                target[key] = data[key];
              }
            });
            return target;
          },
          $unset: (target, fields) => {
            fields.forEach(field => {
              const keys = field.split('.');
              if (keys.length === 1) {
                delete target[field];
              } else {
                const lastKey = keys.pop();
                let currentObj = target;
                keys.forEach(key => {
                  if (currentObj[key] && typeof currentObj[key] === 'object') {
                    currentObj = currentObj[key];
                  } else {
                    return;
                  }
                });
                delete currentObj[lastKey];
              }
            });
            return target;
          },
          $inc: (target, data) => {
            Object.keys(data).forEach(key => {
              const keys = key.split('.');
              let currentObj = target;
      
              for (let i = 0; i < keys.length - 1; i++) {
                const nestedKey = keys[i];
                currentObj[nestedKey] = currentObj[nestedKey] || {};
                currentObj = currentObj[nestedKey];
              }
      
              const lastKey = keys[keys.length - 1];
      
              if (keys.length > 1) {
                currentObj[lastKey] = (currentObj[lastKey] || 0) + data[key];
              } else {
                target[key] = (target[key] || 0) + data[key];
              }
            });
      
            return target;
          },
          $exists: (target, fields) => {
            fields.forEach(field => {
              const keys = field.split('.');
              let currentObj = target;
              keys.forEach(key => {
                if (!currentObj[key]) {
                  throw new Error(`Field '${field}' does not exist in the document.`);
                }
                currentObj = currentObj[key];
              });
            });
            return target;
          },
          $push: (target, data) => {
            Object.keys(data).forEach(key => {
              const keys = key.split('.');
              const values = Array.isArray(data[key]) ? data[key] : [data[key]];
      
              if (keys.length > 1) {
                this.applyNested(target, keys, (currentObj) => {
                  currentObj[keys[keys.length - 1]] = Array.isArray(currentObj[keys[keys.length - 1]])
                    ? [...(currentObj[keys[keys.length - 1]] || []), ...values]
                    : values;
                });
              } else {
                target[key] = Array.isArray(target[key]) ? [...target[key], ...values] : values;
              }
            });
            return target;
          },
      
          $pull: (target, data) => {
            Object.keys(data).forEach(key => {
              const keys = key.split('.');
              const values = Array.isArray(data[key]) ? data[key] : [data[key]];
      
              if (keys.length > 1) {
                this.applyNested(target, keys, (currentObj) => {
                  if (Array.isArray(currentObj[keys[keys.length - 1]])) {
                    currentObj[keys[keys.length - 1]] = currentObj[keys[keys.length - 1]].filter(item => !values.includes(item));
                  }
                });
              } else if (Array.isArray(target[key])) {
                target[key] = target[key].filter(item => !values.includes(item));
              }
            });
            return target;
          },
        };
      
        const operatorFunction = operators[operator];
      
        if (!operatorFunction) {
          throw new Error(`Unsupported operator: ${operator}`);
        }
      
        return operatorFunction(obj, newData);
    };

    async saveData(collectionName) {
        await this.fetchFiles(collectionName, { upsert: true });
        const collection = this.collections[collectionName];
        if (!collection) return;
    
        const filePath = collection.filePath;
        const newData = collection.data;
    
        try {
          await writeFile(filePath, JSON.stringify(newData, null, 2), 'utf-8');
    
          const cleanedData = [newData[0]];
          if (newData[0]) await writeFile(filePath, JSON.stringify(cleanedData, null, 2), 'utf-8');
        } catch (error) {
          throw new Error(`Error saving and cleaning data for collection ${collectionName}: ${error.message}`);
        }
    }

    model(name, schema, methods = {}) {
        if (!this.collections[name]) {
          const filePath = path.join(this.basePath, `${name}.json`);
          let data = [];
      
          try {
            const fileData = readFileSync(filePath, 'utf-8');
            data = JSON.parse(fileData);
          } catch (error) {}
      
          this.collections[name] = {
            name,
            schema,
            filePath,
            data,
            ...methods,
          };
        }
      
        return {
          find: async (filter, options = {}) => await this.find(name, filter, { ...options, multi: true }),
          findOne: async (filter, options = {}) => await this.find(name, filter, { ...options, multi: false }),
          updateOne: async (filter, update, options = {}) => await this.update(name, filter, update, { ...options, multi: false }),
          updateMany: async (filter, update, options = {}) => await this.update(name, filter, update, { ...options, multi: true }),
          deleteOne: async (filter) => await this.delete(name, filter, { multi: false }),
          deleteMany: async (filter) => await this.delete(name, filter, { multi: true }),
          create: async (data) => await this.create(name, data),
          ...methods,
        };
    };

    async find(collectionName, filter, options = {}) {
        if (options.multi) {
            const collection = this.collections[collectionName] || this.model(collectionName, {});
            let filteredData = collection.data.filter(item => this.matchFilter(item, filter));
      
            if (options.sort) {
                filteredData = this.sortData(filteredData, options);
            }
      
            if (options.skip) {
                filteredData = filteredData.slice(options.skip);
            }
      
            if (options.limit) {
                filteredData = filteredData.slice(0, options.limit);
            }
      
            return filteredData;
        } else {
            const collection = this.collections[collectionName] || this.model(collectionName, {});
            let filteredData = collection.data.filter(item => this.matchFilter(item, filter));

            return filteredData[0];
        }
    };

    processUpdateFields(update) {
        const updatedFields = {};
  
        for (const key in update) {
          if (update.hasOwnProperty(key)) {
            updatedFields[key] = update[key];
          }
        }
  
        return updatedFields;
    };

    processUpdateFields(update) {
        return { ...update };
    };

    async update(collectionName, filter, update, options = {}) {
        const collection = this.collections[collectionName] || this.model(collectionName, {});
        let filteredData = collection.data.filter(item => this.matchFilter(item, filter));
  
        if (filteredData.length === 0 && options.upsert) {
          const newData = this.processUpdateFields(update);
          return this.create(collectionName, newData);
        }
  
        const updateSingleItem = (item) => {
          const updatedFields = this.processUpdateFields(update);
          for (const key in updatedFields) {
            if (updatedFields.hasOwnProperty(key)) {
              this.compareWithOperator(item, key, updatedFields[key])
            }
          }
        };
  
        if (options.multi) {
          filteredData.forEach(updateSingleItem);
        } else if (filteredData.length > 0) {
          updateSingleItem(filteredData[0]);
        } else {
          return options.multi ? [] : undefined;
        }
  
        if (!options.dryRun) {
          await this.saveData(collectionName);
        }
  
        return options.multi ? filteredData : filteredData[0];
    };

    async delete(collectionName, filter, options = { multi: false }) {
      const collection = this.collections[collectionName] || this.model(collectionName, {});
      const filteredData = collection.data.filter(item => this.matchFilter(item, filter));
    
      if (filteredData.length === 0) {
        return options.multi ? [] : undefined;
      }
    
      const deletedItems = options.multi ? [...filteredData] : [filteredData[0]];
    
      // Modify the existing array in-place
      for (const item of filteredData) {
        const index = collection.data.indexOf(item);
        if (index !== -1) {
          collection.data.splice(index, 1);
        }
      }
    
      await this.saveData(collectionName);
      return deletedItems;
    }
    

    async create(collectionName, data) {
        const newId = this.generateUniqueId();
        const collection = this.collections[collectionName];
    
        if (collection && collection.schema) {
          const newData = {};
    
          for (const key in collection.schema) {
            if (collection.schema.hasOwnProperty(key)) {
              const fieldSchema = collection.schema[key];
              if (data[key] !== undefined) {
                const keys = key.split('.');
                let currentObj = newData;
              
                for (let i = 0; i < keys.length - 1; i++) {
                  const nestedKey = keys[i];
                  currentObj[nestedKey] = currentObj[nestedKey] || {};
                  currentObj = currentObj[nestedKey];
                }
              
                const lastKey = keys[keys.length - 1];
                currentObj[lastKey] = keys.length > 1 ? { ...currentObj[lastKey], ...data[key] } : data[key];
              } else {
                newData[key] = fieldSchema.default ?? this.getDefaultValueForType(fieldSchema);
              }
            }
          }
    
          if (!Array.isArray(collection.data)) {
            collection.data = [];
          }
    
          collection.data.push({ _id: newId, ...newData });
    
          await this.saveData(collectionName);
          return { _id: newId, ...newData };
        } else {
          throw new Error(`Collection ${collectionName} not found or does not have a schema.`);
        }
    };
    
    generateUniqueId() {
        return uuidv4();
    };
}

module.exports = new VanteDatabase();