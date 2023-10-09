<br/>
<h1 align="center">Vante Database</h1>
<h6 align="center">Developed with 💙 by Vante (@q7x)</h6>
<h4 align="center">⚡ It provides basic CRUD (Create, Read, Update, Delete) operations on JSON files.</h6>

---

VanteDB is a lightweight Node.js database library that simplifies basic CRUD (Create, Read, Update, Delete) operations on JSON files. It's designed to be easy to use and suitable for small to medium-sized projects where a full-fledged database system might be overkill

## Features

* **Simple Setup:** Get started quickly with minimal configuration.
* **JSON Storage:** Store data in JSON files for easy readability and management.
* **Asynchronous Operations:** Perform database operations asynchronously using Promises.
* **Filter and Update:** Easily filter and update records in your collections.

## Installation

You can install VanteDB via npm:
```bash
npm install vantedb
# or
yarn add vantedb
```

## Usage

Here's a quick example of how to use VanteDB:

### Initialize the Database:

Create a new instance of the Database class with the desired configuration:
```javascript
const { Database } = require("vantedb");

const db = new Database({ Folder: 'YourDBFolder', UpdateCheck: false });
```
- Folder: Specify the folder where your database files will be stored.
- UpdateCheck: Enable or disable automatic database update checks by setting this option to true or false.


### Creating a Model (Required)

VanteDB allows you to define data models for your collections. Models provide structure and validation for your data. To define a model, use the ` model ` method:
```javascript
await db.model('Users', {
    userID: { Type: 'String', Default: "" },
    name: { Type: 'String', Default: "" },
    age: { Type: 'Number', Default: 0 },
    skills: { Type: 'Array', Default: [] },
    owner: { Type: 'Boolean', Default: true },
    stats: { Type: 'Object', Default: {} }
});
```

### Creating Documents

You can create documents in your collections using the ` create ` method. For example:
```
await db.create('Cluster', 'Users', { userID: 'user1' });
```

### Finding Documents

Retrieve documents from your collections using the ` find ` method. You can perform queries, sorting, limiting, and skipping as needed:
```javascript 
await db.find('Cluster', 'Users', {}); // Retrieve all documents

await db.find('Cluster', 'Users', { userID: 'user1' }); // Retrieve documents with a specific query

await db.find('Cluster', 'Users', {}, { sort: ["stats.wins", -1], limit: 1 }); // Sort and limit results

await db.find('Cluster', 'Users', {}, { sort: ["stats.wins", -1], limit: 2, skip: 1 }); // Skip and limit results
```

### Finding a Single Document

Use the ` findOne ` method to retrieve a single document from your collections:
```javascript
await db.findOne('Cluster', 'Users', { userID: 'user1' }, { upsert: false });
```

### Updating Documents
Update documents in your collections using the ` update ` method. You can use operators like ` $push `, ` $pull `, ` $set `, and ` $inc ` to modify your data:
```javascript
await db.update('Cluster', 'Users', { owner: true }, { $push: { skills: 'ErtusMom' }, $pull: { skills: 'ErtusMom' }, $set: { rich: true }, $inc: { 'stats.kills': 1, age: 1 }});
```

### Updating a Single Document

Update documents in your collections using the ` update ` method. You can use operators like ` $push `, ` $pull `, ` $set `, and ` $inc ` to modify your data:
```javascript
await db.updateOne('Cluster', 'Users', { userID: 'user1' },{ $set: { age: 30 } }, { new: true, upsert: true });
```

- ` upsert ` (boolean, default: false): If set to true, the method will upsert the document if it doesn't exist.
- ` new ` (boolean, default: false): If set to true, the method will return the updated document.

### Deleting Documents

To delete documents, use the delete method. You can delete specific documents, entire collections, or entire clusters:
```javascript
await db.delete('Cluster', 'Users', { userID: 'user1' }); // Delete a specific document

await db.delete('Cluster', 'Users'); // Delete the entire Users collection

await db.delete('Cluster'); // Delete the entire Cluster (all collections in the cluster)
```

### Checking Database Size

You can check the size of your collections/clusters using the ` size ` method. It provides information about the size of your data and the number of documents:
```javascript
await db.size('Cluster', 'Collection1'); // Get the size of a specific collection

await db.size('Cluster'); // Get the size of the entire cluster
```

---

## Contributing

Contributions are welcome! If you have any bug fixes, improvements, or new features to propose, please open an issue or submit a pull request.

## License

VanteDB is licensed under the **GPL-3.0** License. See the [LICENSE](https://github.com/vante-dev/vantedb/blob/main/LICENSE) file for details.