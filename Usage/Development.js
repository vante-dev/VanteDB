const vanteDB = require('../Library/index');

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
      const foundUsers = await UserModel.find({ $gte: { age: 19 } }, { sort: [], limit: 3 });
      console.log('Found Users:', foundUsers);
  
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