const vanteDB = require('../Library/index');

// Define a schema for a collection
const userSchema = {
    username: { type: String, default: 'Kaan Karahanlı' },
    age: Number,
    email: { type: String, default: "upchh@example.com"},
    isAdmin: Boolean,
    interests: Array,
    daily: Number,
    total: Number
};

// Create a model for the "users" collection (if you are using Cluster true you need to add the Cluster in options on every operator, and if the model type is [] you can create multiple users like mongoose model but if its {} its a classic normal database with key value operators) 
const UserModel = vanteDB.model({ 
    Collection: 'Users', // Database collection name
    Folder: './Global/Database/', // where the users data will be storeed (mention folder only not a file)
    Cluster: true, // you can create custom clusters (like sharding) 
    Type: [], // json formats type (if you are making things like server settings recmoneding to use type: {} but if you are doing something like user stats use Type [])
}, userSchema);


const settingsModel = vanteDB.model({ 
    Collection: 'Settings', // Database collection name
    Folder: './Global/Database/', // where the users data will be storeed (mention folder only not a file)
    Cluster: false, // you can create custom clusters (like sharding) 
    Type: {}, // json formats type (if you are making things like server settings recmoneding to use type: {} but if you are doing something like user stats use Type [])
});

// Example data
const userData = {
    username: 'x',
    age: 19,
    email: 'hi@vante.dev',
    isAdmin: false,
    interests: ['coding', 'reading', 'ertus-mom'],
};

(async () => { 
    // Create a useer in the "users" collection
    // await UserModel.create(userData, { Cluster: "VANTE" })
    
    // Find a useer in the "users" collection (you can find multiple users you can use options, sort, limit, skip)
    await UserModel.find({ 
        $and: [
            { age: { $gte: 20, $lte: 30 } },
            { isAdmin: true }        
        ]
    }, { Cluster: 'VANTE' });

    // find a user in the "users" collection (you cant find multiple users and you can use options, sort limit skip in findone its getting the first data its finding from the database)
    await UserModel.findOne({ 
        $and: [
            { age: { $gte: 20, $lte: 30 } },
            { isAdmin: true }, 
        ]
    }, { Cluster: 'VANTE' });

    // you can create & update a user in the "users" collection by using the upsert true method
    await UserModel.updateOne({ username: "kaanxsrd" }, { $inc: { daily: 1, total: 2 }}, { Cluster: 'VANTE', upsert: true });

    // you can update multiple things inside the "users" collection by using the updatemany function
    await UserModel.updateMany({ age: 0 }, { $set: { age: 19 } }, { Cluster: 'VANTE' });

    // you can delete a user in the "users" collection by using the delete function
    await UserModel.deleteOne({ username: "vantesex" }, { Cluster: 'VANTE' });

    // you can delete multiple things inside the "users" collection by using the deleteMany function
    await UserModel.deleteMany({ age: 19 }, { Cluster: 'VANTE' });
    

    // default key value operator
   await settingsModel.set("vante", "19"); // true ~ "19"

    await settingsModel.get("vante")// "19"
    await settingsModel.all() // [ { ID: 'vante', data: '19' } ]

   await settingsModel.pull("interest", "sa") // sa
   await settingsModel.pull("interest", "sa") // sa

   await settingsModel.has("vante") // true or false

   await settingsModel.add("age", 35) // 35
   await settingsModel.take("age", 16) // 19

   await settingsModel.delete("age")

})();