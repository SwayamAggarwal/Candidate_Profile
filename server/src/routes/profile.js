const express = require('express');
const router = express.Router();
const { Profile } = require('../models/Profile');

// GET /api/profile - fetch profile (slug: me)
router.get('/', async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ slug: 'me' }).lean();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// POST /api/profile - create new profile (only if not exists)
router.post('/', async (req, res, next) => {
  try {
    const exists = await Profile.findOne({ slug: 'me' });
    if (exists) return res.status(409).json({ error: 'Profile already exists' });
    const profile = await Profile.create({ slug: 'me', ...req.body });
    res.status(201).json(profile);
  } catch (err) {
    next(err);
  }
});

// PUT /api/profile - upsert entire profile
router.put('/', async (req, res, next) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { slug: 'me' },
      { slug: 'me', ...req.body },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/profile - partial update
router.patch('/', async (req, res, next) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { slug: 'me' },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/profile - delete the profile (remove any duplicates just in case)
router.delete('/', async (req, res, next) => {
  try {
    // First try deleting canonical slug
    const { deletedCount } = await Profile.deleteMany({ slug: 'me' });
    if (deletedCount > 0) return res.status(200).json({ deleted: deletedCount });

    // Fallback for legacy docs without slug (single-user app): clear all profiles
    const all = await Profile.deleteMany({});
    if (all.deletedCount > 0) return res.status(200).json({ deleted: all.deletedCount, note: 'Cleared all profiles (no slug found)' });

    return res.status(404).json({ error: 'Profile not found' });
  } catch (err) {
    const unauthorized = err && (err.code === 13 || /not authorized/i.test(err.message || ''));
    if (unauthorized) {
      // Fallback: soft delete by renaming slug so GET no longer finds it
      try {
        const docs = await Profile.find({ slug: 'me' }).select('_id slug').lean();
        if (!docs.length) return res.status(404).json({ error: 'Profile not found' });
        let count = 0;
        for (const d of docs) {
          const newSlug = `deleted_${d._id.toString()}`;
          const r = await Profile.updateOne({ _id: d._id }, { $set: { slug: newSlug } });
          if (r.modifiedCount) count += 1;
        }
        return res.status(200).json({ deleted: 0, softDeleted: count, note: 'No delete permission; renamed slug(s) instead' });
      } catch (fallbackErr) {
        fallbackErr.status = 403;
        return next(fallbackErr);
      }
    }
    return next(err);
  }
});

module.exports = router;
