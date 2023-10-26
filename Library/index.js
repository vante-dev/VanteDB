const { writeFile, access, mkdir, readFile } = require('fs').promises;
const { set, get, unset } = require("lodash");
const path = require('path');

class VanteDatabase {
  constructor() {
    this.collections = {};
  }

  async fetchFiles(Path, fileName, options = { upsert: false }) {
    const guildDirectory = path.join(Path);
    const moduleFile = path.join(guildDirectory, fileName + '.json');

    async function ensureDirectoryExists(directoryPath) {
      try {
        await mkdir(directoryPath, { recursive: true });
      } catch (error) {
        throw new Error(`Error creating directory: ${error.message}`);
      }
    }

    async function ensureFileExists(filePath, data) {
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
        await ensureDirectoryExists(Path);
        await ensureDirectoryExists(guildDirectory);
        await ensureFileExists(moduleFile, JSON.stringify(options.type, null, 2) == "[]" ? "[]" : "{}");
      } else { }
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
      $in: (value, target) => (Array.isArray(target) ? target.includes(value) : false),
      $nin: (value, target) => (Array.isArray(target) ? !target.includes(value) : true),
      $regex: (value, target) => new RegExp(target, 'i').test(value),
    };

    const applyOperator = (itemValue, operator, value) => {
      if (operator.startsWith('$')) {
        const op = operators[operator];
        return op ? op(itemValue, value) : false;
      } else {
        return itemValue === value;
      }
    };

    const applyFilter = (item, filter) => {
      return Object.entries(filter).every(([key, value]) => {
        if (key.startsWith('$')) {
          const op = operators[key];
          return op ? op(item, value) : false;
        } else {
          const keys = key.split('.');
          const itemValue = keys.reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), item);

          if (typeof value === 'object') {
            return applyFilter(itemValue, value);
          } else {
            return applyOperator(itemValue, '$eq', value);
          }
        }
      });
    };

    return applyFilter(item, filter);
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

  async saveData({ collectionName, Cluster }, data) {
    const collection = this.collections[collectionName];
    if (!collection) return;

    let filePath;
    if (Cluster) {
      filePath = path.join(this.collections[collectionName].filePath, Cluster);
    } else {
      filePath = path.join(this.collections[collectionName].filePath)
    };

    await this.fetchFiles(filePath, collectionName, { type: JSON.stringify(this.collections[collectionName].Type, null, 2) == "[]" ? "[]" : "{}", upsert: true });

    try {
      await Promise.all([
        writeFile(path.join(path.join(filePath, collectionName + '.json')), JSON.stringify(data, null, 2), 'utf-8'),
        writeFile(path.join(path.join(filePath, collectionName + '.json')), JSON.stringify(data, null, 2), 'utf-8')
      ]);

      return true
    } catch (error) {
      throw new Error(`Error saving and cleaning data for collection ${collectionName}: ${error.message}`);
    }
  }


  async readData(collectionName, cluster) {
    const collection = this.collections[collectionName]
    if (!collection) return;

    let filePath;
    if (cluster) {
      filePath = path.join(this.collections[collectionName].filePath, cluster, collectionName + '.json')
    } else {
      filePath = path.join(this.collections[collectionName].path.join(filePath, collectionName + '.json'))
    };

    try {
      const fileData = await readFile(filePath, 'utf-8');
      return JSON.parse(fileData);
    } catch (error) {
      return JSON.stringify(collection.Type, null, 2) == "[]" ? [] : {};
    }
  }

  model({ Collection, Folder, Cluster, Type }, schema = {}, methods = {}) {
    if (!this.collections[Collection]) {
      const filePath = path.join(Folder);

      this.collections[Collection] = {
        Collection,
        schema,
        filePath,
        Cluster,
        Type
      };
    }


    if (JSON.stringify(Type, null, 2) == "[]") {
      return {
        find: async (filter, options = {}) => await this.find(Collection, filter, { ...options, multi: true }),
        findOne: async (filter, options = {}) => await this.find(Collection, filter, { ...options, multi: false }),
        updateOne: async (filter, update, options = {}) => await this.update(Collection, filter, update, { ...options, multi: false }),
        updateMany: async (filter, update, options = {}) => await this.update(Collection, filter, update, { ...options, multi: true }),
        deleteOne: async (filter, options = {}) => await this.delete(Collection, filter, { ...options, multi: false }),
        deleteMany: async (filter, options = {}) => await this.delete(Collection, filter, { ...options, multi: true }),
        create: async (data, options = {}) => await this.create(Collection, data, options = { ...options }),
        ...methods,
      };
    } else if (JSON.stringify(Type, null, 2) == "{}") {
      return {
        set: async (Key, Value, Options = {}) => await this.set(Collection, Key, Value, Options),
        push: async (Key, Value, Options = {}) => await this.push(Collection, Key, Value, Options),
        pull: async (Key, Value, Options = {}) => await this.pull(Collection, Key, Value, Options),
        get: async (Key, Options = {}) => await this.get(Collection, Key, Options),
        has: async (Key, Options = {}) => await this.has(Collection, Key, Options),
        all: async (Options = {}) => await this.all(false, Collection, Options),
        add: async (Key, Value, Options = {}) => await this.add(Collection, Key, Value, Options),
        take: async (Key, Value, Options = {}) => await this.take(Collection, Key, Value, Options),
        delete: async (Key, Options = {}) => await this.dlt(Collection, Key, Options),
      }
    }
  };

  async find(collectionName, filter, options = {}) {
    const collection = this.collections[collectionName] || {};
    let data;

    if (collection.Cluster) {
      if (!options.Cluster) return new Error(`example usage: ${options.multi ? 'model.find({ username: "vante" }, { Cluster: "VANTE", sort: [\'age\', -1], limit: 2, skip: 1 })' : 'model.findOne({ username: "vante" }, { Cluster: "VANTE" })'}`);
      data = await this.readData(collectionName, options.Cluster);
    } else {
      data = await this.readData(collectionName);
    }

    if (options.multi) {
      let filteredData = data.filter(item => this.matchFilter(item, filter));

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
      let filteredData = data.filter(item => this.matchFilter(item, filter));

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
    const collection = this.collections[collectionName] || {};

    if (collection.Cluster && !options.Cluster) {
      throw new Error(`Example usage: model.update({ username: "vante" }, { $set: { age: 19 } }, { Cluster: "VANTE" })`);
    }

    const data = collection.Cluster
      ? await this.readData(collectionName, options.Cluster)
      : await this.readData(collectionName);

    let filteredData = data.filter(item => this.matchFilter(item, filter));

    if (filteredData.length === 0 && options.upsert) {
      const newItem = collection.Cluster
        ? await this.create(collectionName, filter, { Cluster: options.Cluster })
        : await this.create(collectionName, filter);

      filteredData = [newItem];
      data.push(newItem);
    }

    const updateSingleItem = (item) => {
      const updatedFields = this.processUpdateFields(update);
      for (const key in updatedFields) {
        if (updatedFields.hasOwnProperty(key)) {
          this.compareWithOperator(item, key, updatedFields[key]);
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

    await this.saveData({ collectionName, Cluster: options.Cluster }, data);

    return options.multi ? filteredData : filteredData[0];
  }




  async delete(collectionName, filter, options = { multi: false }) {
    const collection = this.collections[collectionName] || {};
    let data;

    if (collection.Cluster) {
      if (!options.Cluster) {
        throw new Error(`example usage: model.delete({ username: "vante" }, { Cluster: "VANTE" })`);
      }
      data = await this.readData(collectionName, options.Cluster);
    } else {
      data = await this.readData(collectionName);
    }

    let filteredData = data.filter(item => this.matchFilter(item, filter));

    if (filteredData.length === 0) {
      return options.multi ? [] : undefined;
    }

    const deletedItems = options.multi ? [...filteredData] : [filteredData[0]];

    for (const item of filteredData) {
      const index = data.indexOf(item);
      if (index !== -1) {
        data.splice(index, 1);
      }
    }

    await this.saveData({ collectionName, Cluster: options.Cluster }, data);
    return deletedItems;
  }



  async create(collectionName, data, options = {}) {
    const newId = this.generateDate();
    const collection = this.collections[collectionName] || {};
    let oldData;


    if (collection.Cluster) {
      if (!options.Cluster) return new Error(`example usage: model.delete({ username: "vante" }, { Cluster: "VANTE" })`);
      oldData = await this.readData(collectionName, options.Cluster);
    } else {
      oldData = await this.readData(collectionName);
    }


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

      oldData.push({ date: newId, ...newData });


      if (collection.Cluster) {
        if (!options.Cluster) return new Error(`example usage: model.create({ username: "vante" }, { Cluster: "VANTE" })`);
        await this.saveData({ collectionName: collectionName, Cluster: options.Cluster }, oldData);
      } else {
        await this.saveData({ collectionName: collectionName }, oldData);
      }

      return { date: newId, ...newData };
    } else {
      throw new Error(`Collection ${collectionName} not found or does not have a schema.`);
    }
  };

  async set(collectionName, key, value, options = {}) {
    const collection = this.collections[collectionName];
    if (!collection) throw new Error(`Collection ${collectionName} not found.`);

    let filePath;
    if (options.Cluster) {
      filePath = path.join(collection.filePath, options.Cluster);
    } else {
      filePath = path.join(collection.filePath);
    }

    await this.fetchFiles(filePath, collectionName, { type: "{}", upsert: true });

    if (key === "" || typeof key !== "string") {
      throw new Error("Argument (key) missing");
    }

    if (
      value === "" ||
      value === undefined ||
      value === null
    ) {
      throw new DatabaseError("Onaylanmamış bir değer girilmiş");
    }

    const jsonData = await this.toJSON((path.join(filePath, collectionName + ".json")));

    set(jsonData, key, value);

    await writeFile((path.join(filePath, collectionName + ".json")), JSON.stringify(jsonData, null, 2));

    return value;
  };

  async push(collectionName, key, value, options = {}) {
    const data = await this.get(collectionName, key, options);

    if (!data) {
      return await this.set(collectionName, key, [value], options);
    }

    if (Array.isArray(data)) {
      data.push(value);
      return await this.set(collectionName, key, data, options);
    } else {
      return await this.set(collectionName, key, [value], options);
    }
  };
  async pull(collectionName, key, value, options = {}) {
    const data = await this.get(collectionName, key, options);
  
    if (!Array.isArray(data)) {
      throw new Error(`Existing data for key ${key} in collection ${collectionName} is not an array.`);
    }
  
    const index = data.indexOf(value);
  
    if (index !== -1) {
      data.splice(index, 1);
      await this.set(collectionName, key, data, options);
    }
  
    return data;
  }
  

  async get(collectionName, key, options = {}) {
    const collection = this.collections[collectionName];
    if (!collection) throw new Error(`Collection ${collectionName} not found.`);

    let filePath;
    if (options.Cluster) {
      filePath = path.join(collection.filePath, options.Cluster);
    } else {
      filePath = path.join(collection.filePath);
    }

    await this.fetchFiles(filePath, collectionName, { type: "{}", upsert: true });

    if (key === "" || typeof key !== "string") {
      throw new Error("Argument (key) missing");
    }

    const jsonData = await this.toJSON((path.join(filePath, collectionName + ".json")));

    const data = get(jsonData, key);
    return data === undefined ? null : data;
  };

  async has(collectionName, key, options = {}) {
    const collection = this.collections[collectionName];
    if (!collection) throw new Error(`Collection ${collectionName} not found.`);

    let filePath;
    if (options.Cluster) {
      filePath = path.join(collection.filePath, options.Cluster);
    } else {
      filePath = path.join(collection.filePath);
    }

    await this.fetchFiles(filePath, collectionName, { type: "{}", upsert: true });
    const jsonData = await this.toJSON((path.join(filePath, collectionName + ".json")));
    return jsonData.hasOwnProperty(key);
  }


  async add(collectionName, key, value, options = {}) {
    return await this.math(collectionName, key, "+", value, false, options);
  }

  async take(collectionName, key, value, options = {}) {
    return await this.math(collectionName, key, "-", value, false, options);
  }

  async dlt(collectionName, key, options = {}) {
    if (key === "" || typeof key !== "string") {
      throw new Error("Argument (key) missing");
    }

    const collection = this.collections[collectionName];
    if (!collection) throw new Error(`Collection ${collectionName} not found.`);

    let filePath;
    if (options.Cluster) {
      filePath = path.join(collection.filePath, options.Cluster);
    } else {
      filePath = path.join(collection.filePath);
    }

    await this.fetchFiles(filePath, collectionName, { type: "{}", upsert: true });

    const jsonData = await this.toJSON((path.join(filePath, collectionName + ".json")));

    unset(jsonData, key);

    await writeFile((path.join(filePath, collectionName + ".json")), JSON.stringify(jsonData, null, 2));
    return;
  }

  async math(collectionName, key, operator, value, goToNegative = false, options = {}) {
    if (Array.isArray(value) || isNaN(value)) {
      throw new Error(`The entered value type is not a number`);
    }

    if (value <= 0) throw new Error(`Value cannot be less than 1`);
    value = Number(value);
    if (typeof goToNegative !== "boolean") throw new Error(`The goToNegative parameter must be of boolean type`);
    let data = await this.get(collectionName, key, options);
    if (!data) {
      return await this.set(collectionName, key, value, options);
    }
    if (Array.isArray(data) || isNaN(data)) throw new Error(`${key} ID data is a number type, not data`);

    data = Number(data);
    switch (operator) {
      case "+":
        data += value;
        break;
      case "-":
        data -= value;
        if (goToNegative === false && data < 1) data = 0;
        break;
      case "*":
        data *= value;
        break;
      case "/":
        data /= value;
        break;
      case "%":
        data %= value;
        break;
    }
    return await this.set(collectionName, key, data, options);
  }

  async toJSON(path) {
    const allData = await this.all(path);

    const json = {};
    for (const element of allData) {
      json[element.ID] = element.data;
    }
    return json;
  }

  async all(paths, collectionName, options) {
    if (!paths) {
      const collection = this.collections[collectionName];
      if (!collection) throw new Error(`Collection ${collectionName} not found.`);

      let filePath;
      if (options.Cluster) {
        filePath = path.join(collection.filePath, options.Cluster);
      } else {
        filePath = path.join(collection.filePath);
      }

      await this.fetchFiles(filePath, collectionName, { type: "{}", upsert: true });

      const jsonData = await this.toJSON((path.join(filePath, collectionName + ".json")));

      const array = [];
      for (const key in jsonData) {
        array.push({
          ID: key,
          data: jsonData[key]
        });
      }
  
      return array
    }

    const jsonData = JSON.parse(await readFile(paths, "utf-8"));
  
    const array = [];
    for (const key in jsonData) {
      array.push({
        ID: key,
        data: jsonData[key]
      });
    }
  
    return array
  }

  generateDate() {
    return Date.now()
  };
}

module.exports = new VanteDatabase();