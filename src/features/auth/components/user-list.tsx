"use client";

import { useCallback, useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return (
      <div className="w-full pt-4 text-sm text-zinc-500 dark:text-zinc-400">
        Loading users...
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="w-full rounded-lg border border-dashed border-zinc-300 px-4 py-6 dark:border-zinc-700">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No users yet. Be the first to sign up!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3 text-left">
      <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        Registered users ({users.length})
      </h2>
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex items-center gap-3 px-4 py-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {user.name}
              </p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {user.email}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
