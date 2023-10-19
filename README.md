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
const vanteDB = require('vantedb');

// Define a schema for a collection
const userSchema = {
  username: { type: String, default: 'Kaan Karahanlı' },
  age: Number,
  email: String,
  isAdmin: Boolean,
  interests: Array,
};

// Create a model for the "users" collection
const UserModel = vanteDB.model('users', userSchema);

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
    // Create a new user
    const createdUser = await UserModel.create(userData);
    console.log('Created User:', createdUser);

    // Update many using $set operator
    const updatedUsersSet = await UserModel.updateMany({ isAdmin: false }, { $set: { isAdmin: true } });
    console.log('Updated Users with $set operator:', updatedUsersSet);

    // Find users
    const foundUsers = await UserModel.find({ age: { $gte: 19 } }, { sort: 'age', limit: 3 });
    console.log('Found Users:', foundUsers);

    // Update one user
    const updatedUser = await UserModel.updateOne(
      { username: 'Kaan Karahanlı' },
      { $set: { age: 20, interests: ['coding', 'reading', 'gaming'] } }
    );
    console.log('Updated User with $set operator:', updatedUser);

    // Update many users
    const updatedManyUsers = await UserModel.updateMany(
      { age: { $gte: 20 } },
      { $inc: { age: 1 } }
    );
    console.log('Updated Many Users with $inc operator:', updatedManyUsers);

    // Delete one user
    const deletedUser = await UserModel.deleteOne({ username: 'Kaan Karahanlı' });
    console.log('Deleted User:', deletedUser);

    // Delete many users
    const deletedUsers = await UserModel.deleteMany({ isAdmin: true });
    console.log('Deleted Users:', deletedUsers);

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
