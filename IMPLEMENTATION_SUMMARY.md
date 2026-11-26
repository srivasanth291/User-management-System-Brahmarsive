# SkillHub development delivery

- Connected staff permission grants, profile editing, course mapping and progress reporting across React and the two APIs. Added a nullable profile phone column with a repeatable migration.
- Added transactional publication and course edits. Existing modules retain their identifiers and learner progress while metadata is edited. Explicitly removing a module through the editor removes its dependent records under the existing schema.
- Enforced staff permissions on the server and the 70% quiz requirement on module completion. Restored logout across all role layouts and validated expired sessions in both APIs.
- Restored module drafts, scoped progress to individual students, corrected dashboard counts and provided native playback for direct video URLs.
- Added isolated database, browser and client tests, configurable Flask CORS, environment examples and production setup instructions. Updated frontend dependencies within the existing manifest ranges.

The target SMTP relay, external media host and production infrastructure require deployment-specific verification. The user-facing evidence and test commands are in TEST_REPORT.md.
