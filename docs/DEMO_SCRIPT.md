# DeadlinePilot demo script (3–5 minutes)

This is a recording plan, not a recorded video. Use a browser recording tool such as OBS or your operating system's screen recorder, and record the deployed app after Atlas setup. Keep private credentials out of the recording.

## Before recording

- Configure Atlas and confirm `/api/health` says `connected`.
- Have two browser profiles ready: one for the demo account and one fresh profile for a new account / ownership check.
- Add 3–4 assignments across different courses: a past-due high-priority task, one due soon with several hours of effort, one future low-priority task, and one completed item.
- Do not expose the Atlas URI, JWT secret, or password manager.

## Run of show

**0:00–0:25 — Problem and audience**  
“College students often keep assignments in several course pages and notes. DeadlinePilot gives students one private place to see coursework, catch overdue work, and choose their next task.” Show the signed-in dashboard.

**0:25–1:10 — The overview**  
Point out total, in-progress, completed, and overdue counts, the progress percentage, and the next upcoming dates. Show that the recommendation includes a brief reason. Explain that completed work is skipped and an overdue task rises to the top.

**1:10–2:05 — Add and update coursework**  
Create an assignment with a course, due date/time, estimated hours, and priority. Open edit, adjust an estimate or priority, and save. Mark an item complete and reopen it. Mention that the app validates input and saves to MongoDB.

**2:05–2:50 — Find the next task**  
Search by a course name, filter to high priority, then sort by urgency. Clear filters. Explain the local deterministic score: deadline proximity/overdue state, remaining estimated effort, priority, and pending status; the app does not call an AI API.

**2:50–3:25 — Account and privacy**  
Sign out, sign back in, and show that assignments remain. If time allows, sign in as a second account and show that the first account's assignments do not appear. Do not show either password.

**3:25–3:45 — Close**  
Summarize the key value: a persistent course planner that makes the next action clear. End on the dashboard and show the app URL briefly.

## After recording

- Keep the video around 3–5 minutes and make sure text is readable.
- Upload it somewhere evaluators can open without requesting access.
- Add the video link to the README and final submission form.
- Open the video, deployed app, and repository in a private browser window before submitting.
