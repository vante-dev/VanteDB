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

## Usage

```js
const VanteDatabase = require('vantedb');

// Define a schema for a collection
const userSchema = {
    username: { type: String, default: 'Kaan Karahanlı' },
    age: Number,
    email: { type: String, default: "hi@vante.dev" },
    isAdmin: Boolean,
    interests: Array,
    daily: Number,
    total: Number,
};

// Create a model for the "users" collection
const UserModel = VanteDatabase.model({
    Collection: 'Users',
    Folder: './Global/Database/',
    Cluster: true,
    Type: [],
}, userSchema);

// Create a model for the "settings" collection (this one is for the key chain dbs)
const SettingsModel = VanteDatabase.model({
    Collection: 'Settings',
    Folder: './Global/Database/',
    Cluster: false,
    Type: {},
}, userSchema);

// Example data
const userData = {
  username: 'Kaan Karahanlı',
  age: 19,
  email: 'hi@vante.dev',
  isAdmin: false,
  interests: ['coding', 'reading', 'ertus-mom'],
};

// CRUD operations
(async () => {
  try {
    // Create a User
    await UserModel.create(userData, { Cluster: "VANTE" });

    // FIND USERS
    
    // Find multiple users with conditions
    const users = await UserModel.find({
        $and: [
            { age: { $gte: 20, $lte: 30 } },
            { isAdmin: true }
        ]
    }, { Cluster: 'VANTE' });

    // Find a single user with conditions
    const user = await UserModel.findOne({
        $and: [
            { age: { $gte: 20, $lte: 30 } },
            { isAdmin: true },
        ]
    }, { Cluster: 'VANTE' });


    // UPDATE USER

    // Update or create a user with upsert true
    await UserModel.updateOne({ username: "kaanxsrd" }, { $inc: { daily: 1, total: 2 }}, { Cluster: 'VANTE', upsert: true });

    // Update multiple users
    await UserModel.updateMany({ age: 0 }, { $set: { age: 19 } }, { Cluster: 'VANTE' });

    // DELETE USER

    // Delete a single user
    await UserModel.deleteOne({ username: "vantesex" }, { Cluster: 'VANTE' });

    // Delete multiple users
    await UserModel.deleteMany({ age: 19 }, { Cluster: 'VANTE' });


    // Old key data version 
    // Set a value in the settings
    await SettingsModel.set("vante", "19");

    // Get a value from the settings
    await SettingsModel.get("vante");

    // Get all settings
    await SettingsModel.all();

    // Push a value from an array in settings
    await SettingsModel.push("interest", "sa");

    // Pull a value from an array in settings
    await SettingsModel.pull("interest", "sa");

    // Check if a setting exists
    await SettingsModel.has("vante");

    // Add a value in settings
    await SettingsModel.add("age", 35);

    // Take a value from settings
    await SettingsModel.take("age", 16);

    // Delete a value from settings
    await SettingsModel.delete("age");

  } catch (error) {
    console.error('Error performing CRUD operations:', error.message);
  }
})();
```
---

## Contributing

Contributions are welcome! If you have any bug fixes, improvements, or new features to propose, please open an issue or submit a pull request.

## License

VanteDB is licensed under the **GPL-3.0** License. See the [LICENSE](https://github.com/vante-dev/vantedb/blob/main/LICENSE) file for details.
