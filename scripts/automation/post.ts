/**
 * Posts the oldest unposted draft from posts/queue.json to X, at most one per run, and records it on the
 * `finder` branch. Does nothing until the four X_* secrets are set.
 */
import { createHmac, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { readPosted, writePosted } from "./state";

type Draft = { id: string; title: string; text: string };

const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env;
const ENDPOINT = "https://api.x.com/2/tweets";

const enc = (s: string) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

/** OAuth 1.0a user-context header; a JSON body isn't part of the signature. */
function authHeader() {
  const oauth: Record<string, string> = {
    oauth_consumer_key: X_API_KEY!,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: X_ACCESS_TOKEN!,
    oauth_version: "1.0",
  };
  const params = Object.keys(oauth)
    .sort()
    .map((k) => `${enc(k)}=${enc(oauth[k])}`)
    .join("&");
  const base = `POST&${enc(ENDPOINT)}&${enc(params)}`;
  oauth.oauth_signature = createHmac("sha1", `${enc(X_API_SECRET!)}&${enc(X_ACCESS_SECRET!)}`).update(base).digest("base64");
  return "OAuth " + Object.keys(oauth).map((k) => `${enc(k)}="${enc(oauth[k])}"`).join(", ");
}

async function main() {
  if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
    console.log("X secrets not set: not posting.");
    return;
  }
  const queue = JSON.parse(readFileSync("posts/queue.json", "utf8")) as Draft[];
  const posted = readPosted();
  const next = queue.find((d) => !posted.includes(d.id));
  if (!next) {
    console.log("Nothing to post.");
    return;
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { authorization: authHeader(), "content-type": "application/json" },
    body: JSON.stringify({ text: next.text }),
  });
  if (!res.ok) throw new Error(`X ${res.status} ${await res.text()}`);
  const { data } = (await res.json()) as { data: { id: string } };
  writePosted([...posted, next.id]);
  console.log(`Posted "${next.title}": https://x.com/i/status/${data.id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
