const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// GET /api/database/overview
router.get('/overview', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    const summary = await Promise.all(
      collections.map(async (col) => {
        const count = await db.collection(col.name).countDocuments();
        return {
          name: col.name,
          count,
        };
      })
    );

    res.status(200).json({
      success: true,
      databaseName: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      connectionString: `mongodb://${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`,
      collections: summary,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/database/collections/:collectionName
router.get('/collections/:collectionName', async (req, res) => {
  try {
    const { collectionName } = req.params;
    const { limit = 100 } = req.query;
    const db = mongoose.connection.db;

    const data = await db
      .collection(collectionName)
      .find({})
      .limit(Number(limit))
      .toArray();

    res.status(200).json({
      success: true,
      collection: collectionName,
      totalCount: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

