/**
 * High-performance In-Memory Document Store Fallback
 * Provides compatible CRUD interface when an external MongoDB daemon is not running locally.
 */

const { v4: uuidv4 } = require('uuid');

class Collection {
  constructor(name) {
    this.name = name;
    this.documents = new Map();
  }

  async find(query = {}) {
    const docs = Array.from(this.documents.values());
    return docs.filter(doc => this._match(doc, query));
  }

  async findOne(query = {}) {
    const list = await this.find(query);
    return list.length > 0 ? list[0] : null;
  }

  async findById(id) {
    return this.documents.get(String(id)) || null;
  }

  async create(data) {
    const _id = data._id ? String(data._id) : uuidv4();
    const doc = {
      ...data,
      _id,
      id: _id,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date()
    };
    this.documents.set(_id, doc);
    return doc;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const existing = await this.findById(id);
    if (!existing) return null;
    
    const updated = {
      ...existing,
      ...(update.$set || update),
      updatedAt: new Date()
    };
    this.documents.set(String(id), updated);
    return options.new ? updated : existing;
  }

  async findOneAndUpdate(query, update, options = {}) {
    const existing = await this.findOne(query);
    if (!existing) return null;
    return this.findByIdAndUpdate(existing._id, update, options);
  }

  async deleteOne(query) {
    const doc = await this.findOne(query);
    if (doc) {
      this.documents.delete(String(doc._id));
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  _match(doc, query) {
    for (const [key, val] of Object.entries(query)) {
      if (val && typeof val === 'object' && val.$in) {
        if (!val.$in.includes(doc[key])) return false;
      } else if (doc[key] !== val) {
        return false;
      }
    }
    return true;
  }
}

const collections = {
  users: new Collection('users'),
  tracks: new Collection('tracks'),
  rooms: new Collection('rooms'),
  soundclashes: new Collection('soundclashes'),
  analytics: new Collection('analytics')
};

module.exports = {
  collections,
  getCollection: (name) => collections[name] || new Collection(name)
};
