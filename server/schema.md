# MongoDB Schema: candidate_profile

Collection: `profiles`

Document shape (single document with `slug: "me"`):

{
  _id: ObjectId,
  slug: string = "me" (unique index),
  name: string,
  email: string,
  education: [
    { school, degree, field, startDate, endDate }
  ],
  skills: [string],
  projects: [
    {
      title: string,
      description: string,
      skills: [string],
      links: [ { label, url } ]
    }
  ],
  work: [
    { company, role, startDate, endDate, description }
  ],
  links: { github, linkedin, portfolio },
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- `{ slug: 1 }` unique — ensures single canonical profile document
- `{ skills: 1 }` — speeds up skill lookups
- `{ "projects.skills": 1 }` — speeds up project filtering by skill
- Text index for search:
  - `{ name: 'text', email: 'text', 'projects.title': 'text', 'projects.description': 'text', 'work.company': 'text', 'work.role': 'text', skills: 'text' }`

Notes:
- Query endpoints are implemented via Mongoose/JS filtering since this app holds a single profile document.
- For multi-user scenarios, promote `projects` to its own collection and reference profiles.

