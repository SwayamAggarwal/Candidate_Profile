require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connectDB } = require('../src/db');
const { Profile } = require('../src/models/Profile');

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('Missing MONGODB_URI in environment');
  const file = path.join(__dirname, '../data/profile.json');
  if (!fs.existsSync(file)) {
    throw new Error(`Seed file not found: ${file}\nCreate it from data/profile.example.json and fill your data.`);
  }
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  await connectDB(MONGODB_URI);
  await Profile.findOneAndUpdate(
    { slug: 'me' },
    { slug: 'me', ...json },
    { upsert: true, new: true, runValidators: true }
  );
  console.log('Seeded profile data successfully.');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

