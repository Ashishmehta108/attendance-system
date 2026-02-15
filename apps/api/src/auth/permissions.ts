import { createAccessControl } from "better-auth/plugins/access";

const statement = {
  classroom: ["create", "read", "update", "delete", "list"],
  session: ["create", "read", "update", "end", "list"],
  feedback: ["submit_realtime", "submit_post_class", "view_aggregate"],
  summary: ["read"],
} as const;

export const ac = createAccessControl(statement);

export const admin = ac.newRole({
  classroom: ["create", "read", "update", "delete", "list"],
  session: ["create", "read", "update", "end", "list"],
  feedback: ["submit_realtime", "submit_post_class", "view_aggregate"],
  summary: ["read"],
});

export const instructor = ac.newRole({
  classroom: ["create", "read", "update", "delete", "list"],
  session: ["create", "read", "update", "end", "list"],
  feedback: ["view_aggregate"],
  summary: ["read"],
});

export const student = ac.newRole({
  classroom: ["list", "read"],
  session: ["read", "list"],
  feedback: ["submit_realtime", "submit_post_class"],
  summary: [],
});
