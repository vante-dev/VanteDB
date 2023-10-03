const { Database } = require("vantedb");

const db = new Database("Json", {
    Folder: 'Example/VanteDB'
});

const guildID = "1144610315376537691";

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
    //await db.deleteMany(guildID, "users", (user) => user.name === "Vante");
})();