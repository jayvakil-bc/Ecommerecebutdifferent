require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [{
    dateTime: { type: Date, default: Date.now },
    userAgent: String
  }]
});

let User;

module.exports.initialize = async () => {
  return new Promise((resolve, reject) => {
    mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      User = mongoose.model("User", userSchema);
      resolve();
    })
    .catch(err => {
      reject(err);
    });
  });
};

module.exports.registerUser = async (userData) => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(userData.password, 10)
      .then(hash => {
        userData.password = hash;
        const newUser = new User(userData);
        newUser.save()
          .then(() => resolve('User registered successfully'))
          .catch(err => reject(err));
      })
      .catch(err => {
        console.log(err);
        reject('There was an error encrypting the password');
      });
  });
};

module.exports.checkUser = async (userData) => {
  return new Promise((resolve, reject) => {
    User.findOne({ userName: userData.userName })
      .then(user => {
        if (!user) {
          reject('User not found');
        } else {
          bcrypt.compare(userData.password, user.password)
            .then(result => {
              if (result) {
                resolve('Password correct');
              } else {
                reject('Incorrect password for user: ' + userData.userName);
              }
            })
            .catch(err => {
              console.log(err);
              reject('Error comparing passwords');
            });
        }
      })
      .catch(err => {
        console.log(err);
        reject('Error retrieving user data');
      });
  });
};
