'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;



export const protectorMiddleware = (req, res, next) => { // 로그인 시에만 next
  if(req.session.loggedIn) {
      next();
  }else {
      req.flash("error", "Log in first.");
      return res.redirect("/login");
  }
}
export const publicOnlyMiddleware = (req, res, next) => { // 로그인이 안되어있을 때 next
  if(!req.session.loggedIn) {
    return next();
  }else {
    req.flash("error", "Not authorized");
    return res.direct("/");
  }
}


