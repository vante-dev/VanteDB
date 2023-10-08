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

# woo

You can install VanteDB via npm:
```bash
npm install vantedb
# or
yarn add vantedb
```

## Usage

Here's a quick example of how to use VanteDB:
```js
const { Database } = require("vantedb");

// Initialize the database with the 'Json' type and a folder location
const db = new Database("Json", {
    Folder: 'Example/VanteDB'
});

const guildID = "your_guild_id";

(async () => {
   // Create data
    await db.create(guildID, "users", [
        { id: 1, name: "Vante" },
        { id: 2, name: "Kaan", nick: "q7x", level: 2, xp: 20 }
    ]);
    
    await db.create(guildID, "settings", { prefix: "." });

    // Set data
    await db.set(guildID, "settings", { db: "prefix", data: "-" });

    // Read data
    const userData = await db.read(guildID, "users");
    const prefixData = await db.read(guildID, "settings", "prefix");

    // Update data
    await db.update(guildID, "users", (user) => user.id === 1, { nick: "q7x", level: 1, xp: 10 }, { apply: false });
    // output: { id: 1, name: "Vante", nick: "q7x", level: 1, xp: 10 }

    await db.update(guildID, "users", (user) => user.id === 1, { level: 1, xp: 10 }, { apply: true });
    // output: { id: 1, name: "Vante", nick: "q7x", level: 2, xp: 20 };

    // Delete data
    await db.delete(guildID, "users", (user) => user.id === 2);

    // Find data 
    const foundUser = await db.find(guildID, "users", (user) => user.id === 1);

    // Update multiple items
    await db.updateMany(guildID, "users", (user) => user.name === "Vante", { level: 1, xp: 10 }, { apply: false });

    // Delete multiple items
    await db.deleteMany(guildID, "users", (user) => user.name === "Vante");
})();
```

---

## Contributing

Contributions are welcome! If you have any bug fixes, improvements, or new features to propose, please open an issue or submit a pull request.


## License

VanteDB is licensed under the **GPL-3.0** License. See the [LICENSE](https://github.com/vante-dev/vantedb/blob/main/LICENSE) file for details.
