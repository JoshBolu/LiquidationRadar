import fs from "node:fs";
import path from "node:path";

const usersFile = path.resolve(__dirname, "..", "users.json");

type UsersPayload = {
  users: string[];
};

export function loadUsers(): Set<string> {
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify({ users: [] }, null, 2), "utf-8");
  }

  const raw = fs.readFileSync(usersFile, "utf-8");
  const parsed = JSON.parse(raw) as UsersPayload;
  return new Set((parsed.users ?? []).map((u) => u.toLowerCase()));
}

export function saveUsers(users: Set<string>): void {
  const payload: UsersPayload = {
    users: Array.from(users),
  };

  fs.writeFileSync(usersFile, JSON.stringify(payload, null, 2), "utf-8");
}
