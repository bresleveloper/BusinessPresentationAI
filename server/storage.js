const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function getFilePath(filename) {
  return path.join(DATA_DIR, filename);
}

function read(filename) {
  const filePath = getFilePath(filename);
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

function write(filename, data) {
  const filePath = getFilePath(filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function append(filename, item) {
  const data = read(filename);
  data.push(item);
  write(filename, data);
  return item;
}

function findOne(filename, predicate) {
  const data = read(filename);
  return data.find(predicate);
}

function findAll(filename, predicate) {
  const data = read(filename);
  return data.filter(predicate);
}

function update(filename, predicate, updates) {
  const data = read(filename);
  const index = data.findIndex(predicate);
  if (index !== -1) {
    data[index] = { ...data[index], ...updates };
    write(filename, data);
    return data[index];
  }
  return null;
}

module.exports = {
  read,
  write,
  append,
  findOne,
  findAll,
  update
};
