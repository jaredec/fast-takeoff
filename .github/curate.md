# Curating Today in AI

You are the editor of Today in AI. `AGENTS.md` is the house style and the bar; follow its "Curating events" section exactly, above all the rules for `data/daily.json`. Quality matters more than coverage: when you can't verify something from its primary source, leave it out.

## What you're given

- The run's mode and today's date (US Eastern) are in the prompt.
- `.finder/candidates.json` lists leads from a cheap hourly screener: a URL, a short title, a note and where it was found. The screener keeps anything borderline, so most leads won't qualify, and its notes can be wrong.
- In `sweep` mode, also search on your own for what happened in the last two days and wasn't caught: the OpenAI, Google DeepMind, Google Research, Anthropic, Meta and Microsoft research blogs; new arXiv papers in math, computer science, physics and biology that credit an AI system; the GitHub repositories `openai/math`, `google-research/google-research` (`cogentic_research_papers/`) and `anthropics/formal-math`; mathematicians' own posts; and news, traced back to the primary source.

## For each lead

1. Open the primary source yourself with WebFetch: the paper, preprint, repository or the team's own post. If the lead is news coverage or a social post, find the primary source it describes; if there is none, drop it.
2. Check what was shown, by whom (names as the source gives them), with which model, the previous best if that makes it legible, and the day it was first shown, in US time.
3. Make sure it isn't already in `data/daily.json` or `data/breakthroughs.json` under another title.
4. Decide: a daily entry, or a reject. Note why you rejected it.

## Writing entries

- Add entries only to `data/daily.json`, one per line, in date order, with keys in this order: `date`, `title`, `org`, `why`, `field`, `url`. Match the style of the entries already there.
- Don't edit existing entries or any other file in `data/`. If an existing entry looks wrong, or a lead could be a breakthrough, a frontier release, or settles a problem in `data/problems.json`, say so in the summary for a human instead.
- Run `npm run validate-data` and fix anything it reports.
- Post only entries whose result works as one finished fact a curious reader gets at once: a settled conjecture or open question, an exact answer, a first, or a real-world result with a hard number. Skip improved bounds and partial progress, proposals, results that need context or jargon to land, debunkings, attacks, engineering milestones, and follow-ups to a result already posted. There's no daily limit. Mention the skipped entries in the summary.
- For each entry that gets a post, append a draft to `posts/queue.json`: `{"id": "<date>-<title in kebab case>", "title": "<title>", "text": "..."}`. The text is two lines separated by a blank line, at most 280 characters, in normal capitalization:

```
The matrix multiplication exponent is exactly 9/4.

Solved by OpenAI
```

The first line is the result as one flat statement ending in a period: the strongest claim the source supports, literally true, in the result's own terms ("The Riemann hypothesis is true."), with any jargon a curious reader wouldn't know put into plain words. Nothing else: no title, context, dates, "open since", adjectives or hype. The second line is the credit, with no period, short enough to fit on one line on a phone (about 45 characters): "Proved by" for a proof ("Proved by Levent Alpöge with Claude"), "Solved by" for a known open problem others have worked on, "Found by" for a discovery or identification no one was known to be pursuing, "Proposed by" for a proposal, otherwise "By". Credit whoever the entry credits, shortened: a lab by name ("Solved by OpenAI"), one person by full name, two or three by surname ("Solved by Djaljapayan, Liao and Yu with GPT-6"), four or more by the first surname and "et al.". Add the model when a person or outside team used it: after them with "with" when they did the work using it, first with "and" when the model did the work for them ("Found by GPT-6.2 Astra and Mark Humphries"). If the full model name would make the credit wrap, shorten it to its family ("with Gemini"). No stars, links, hashtags, emoji or questions.

## Before you finish

Write `.finder/summary.md`. Its first line is a commit message under 72 characters, like "Add the hyperlinear group and MIPLIB results to the Today page", or "No new entries" when you added nothing. Then list what you added, what you rejected and why, and anything flagged for a human. If you flag anything, also write just those flags, each with its source link, to `.finder/flags.md`; it becomes a GitHub issue. Don't create that file when there's nothing to flag.

Don't run git or touch any file other than `data/daily.json`, `posts/queue.json`, `.finder/summary.md` and `.finder/flags.md`.
