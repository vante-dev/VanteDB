const fs = require("fs").promises;
const path = require("path");

class JsonDatabase {
  constructor(basePath) {
    this.basePath = basePath;
  }

  async folderExists(folderPath) {
    try {
      await fs.access(folderPath, fs.constants.F_OK);
      return true;
    } catch (err) {
      return false;
    }
  }

  async createFolderIfNotExists(folderPath) {
    if (!(await this.folderExists(folderPath))) {
      try {
        await fs.mkdir(folderPath, { recursive: true });
      } catch (err) {
        console.error(`Error creating folder: ${folderPath}`, err);
        throw err;
      }
    }
  }

  async read(filePath, ...query) {
    try {
      await this.createFolderIfNotExists(path.dirname(filePath));
      const data = await fs.readFile(filePath, "utf8");
      const jsonData = JSON.parse(data);

      if (query.length === 1 && query[0] === undefined) {
        return jsonData;
      } else {
        let result = jsonData;
        for (const key of query) {
          if (result.hasOwnProperty(key)) {
            result = result[key];
          } else {
            return null;
          }
        }
        return result;
      }
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  async write(filePath, data) {
    try {
      await this.createFolderIfNotExists(path.dirname(filePath));
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
    }
  }

  async create(folderName, fileName, data) {
    const folderPath = path.join(this.basePath, folderName);
    const filePath = path.join(folderPath, `${fileName}.json`);

    await this.createFolderIfNotExists(folderPath);
    await this.write(filePath, data);
  }

  async set(folderName, fileName, options) {
    const folderPath = path.join(this.basePath, folderName);
    const filePath = path.join(folderPath, `${fileName}.json`);

    await this.createFolderIfNotExists(folderPath);

    const data = await this.read(filePath) || {};

    var schema = data;
    var pList = options.db.split(".");
    var len = pList.length;
    for(var i = 0; i < len-1; i++) {
        var elem = pList[`${i}`];
        if( typeof schema[`${elem}`] !== "object" ) {
          schema[`${elem}`] = {};
        }
        schema = schema[`${elem}`];
    }
    schema[pList[`${len-1}`]] = options.data;

    await this.write(filePath, data);
  }

  async get(folderName, fileName, query) {
    const folderPath = path.join(this.basePath, folderName);
    const filePath = path.join(folderPath, `${fileName}.json`);

    await this.createFolderIfNotExists(folderPath);
    
    return this.read(filePath, query);
  }

  async update(folderName, fileName, query, updatedData, options) {
    const { apply = false } = options;
    const folderPath = path.join(this.basePath, folderName);
    const filePath = path.join(folderPath, `${fileName}.json`);
  
    await this.createFolderIfNotExists(folderPath);
  
    try {
      const data = await this.read(filePath) || [];
  
      const index = data.findIndex(query);
  
      if (index !== -1) {
        const itemToUpdate = data[index];
  
        if (!apply) {
          Object.assign(itemToUpdate, updatedData);
        } else {
          for (const key in updatedData) {
            if (updatedData.hasOwnProperty(key)) {
              const updateValue = updatedData[key];
              if (typeof updateValue === 'number') {
                itemToUpdate[key] += updateValue;
              } else {
                itemToUpdate[key] = updateValue;
              }
            }
          }
        }

  
        await this.write(filePath, data);
  
        return data;
      } else {
        console.error('Element not found for update.');
        return null;
      }
    } catch (error) {
      console.error('Error updating data:', error);
      throw error;
    }
  }
  

  async delete(folderName, fileName, query) {
    const folderPath = path.join(this.basePath, folderName);
    const filePath = path.join(folderPath, `${fileName}.json`);

    await this.createFolderIfNotExists(folderPath);

    const data = await this.read(filePath) || [];
    const index = data.findIndex(query);

    if (index !== -1) {
      data.splice(index, 1);
      await this.write(filePath, data);
    }
  }

  async find(folderName, fileName, query) {
    const folderPath = path.join(this.basePath, folderName);
    const filePath = path.join(folderPath, `${fileName}.json`);

    await this.createFolderIfNotExists(folderPath);
    
    const data = await this.read(filePath) || [];
    return data.find(query);
  }

  async updateMany(folderName, fileName, query, updatedData, options) {
    const { apply = false } = options;
    const folderPath = path.join(this.basePath, folderName);
    const filePath = path.join(folderPath, `${fileName}.json`);

    await this.createFolderIfNotExists(folderPath);

    try {
      const data = await this.read(filePath) || [];

      const indicesToUpdate = data.reduce((indices, item, index) => {
        if (query(item)) {
          indices.push(index);
        }
        return indices;
      }, []);

      if (indicesToUpdate.length > 0) {
        indicesToUpdate.forEach((index) => {
          const itemToUpdate = data[index];
          if (!apply) {
            Object.assign(itemToUpdate, updatedData);
          } else {
            for (const key in updatedData) {
              if (updatedData.hasOwnProperty(key)) {
                const updateValue = updatedData[key];
                if (typeof updateValue === 'number') {
                  itemToUpdate[key] = (itemToUpdate[key] || 0) + updateValue;
                } else {
                  itemToUpdate[key] = updateValue;
                }
              }
            }
          }
        });

        await this.write(filePath, data);

        return null;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error updating data:', error);
      throw error;
    }
  }

  async deleteMany(folderName, fileName, query) {
    const folderPath = path.join(this.basePath, folderName);
    const filePath = path.join(folderPath, `${fileName}.json`);

    await this.createFolderIfNotExists(folderPath);
    const data = await this.read(filePath) || [];
    const newData = data.filter((item) => !query(item));
    await this.write(filePath, newData);
  }
}

module.exports = JsonDatabase;
