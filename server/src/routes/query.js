const express = require('express');
const router = express.Router();
const { Profile } = require('../models/Profile');

// GET /api/projects?skill=python
router.get('/projects', async (req, res, next) => {
  try {
    const { skill } = req.query;
    const profile = await Profile.findOne({ slug: 'me' }, { projects: 1 }).lean();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    let projects = profile.projects || [];
    if (skill) {
      const q = String(skill).toLowerCase();
      projects = projects.filter((p) => (p.skills || []).some((s) => String(s).toLowerCase() === q));
    }
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// GET /api/skills/top
router.get('/skills/top', async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ slug: 'me' }, { skills: 1, projects: 1 }).lean();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const counts = new Map();
    const add = (s) => {
      if (!s) return;
      const key = String(s).toLowerCase();
      counts.set(key, (counts.get(key) || 0) + 1);
    };
    (profile.skills || []).forEach(add);
    (profile.projects || []).forEach((p) => (p.skills || []).forEach(add));
    const list = Array.from(counts.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill));
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// GET /api/search?q=...
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || String(q).trim() === '') return res.status(400).json({ error: 'Missing q param' });
    const needle = String(q).toLowerCase();
    const profile = await Profile.findOne({ slug: 'me' }).lean();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const hay = (v) => (v || '').toString().toLowerCase();
    const includes = (v) => hay(v).includes(needle);

    const projects = (profile.projects || []).filter(
      (p) => includes(p.title) || includes(p.description) || (p.skills || []).some(includes)
    );
    const skills = (profile.skills || []).filter(includes);
    const work = (profile.work || []).filter((w) => includes(w.company) || includes(w.role) || includes(w.description));

    res.json({ projects, skills, work });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

