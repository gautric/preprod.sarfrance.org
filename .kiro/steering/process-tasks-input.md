---
inclusion: manual
description: "Reads user input, splits it into items, creates tasks in TASKS.md, modifies Hugo website content for each item, and creates individual git commits with French comments. Skipped items are explained in French."
---

Ask the user for their input. Once received, split the input into individual items. For each item:

1. Evaluate whether a modification is needed for the Hugo website content.
2. If you decide to skip an item, explain clearly in French why it is being skipped.
3. For each item you process:
   a. Add a corresponding task entry in TASKS.md describing the work.
   b. Make the appropriate modification to the Hugo website content files (under the content/ directory).
   c. Stage the changed files and create a git commit with a descriptive comment written in French.
4. Process items one by one, committing each individually before moving to the next.
5. Create an email with all your comment in french and explain why you skip the item

All commit messages and skip explanations must be written in French. Task descriptions in TASKS.md should also be in French.
