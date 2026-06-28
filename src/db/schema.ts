import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  integer,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  githubId: text("githubId").unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const session = pgTable("session", {
  id: uuid("id").defaultRandom().primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: uuid("id").defaultRandom().primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: uuid("id").defaultRandom().primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

export const project = pgTable("project", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  framework: text("framework").notNull().default("Other"),
  visibility: text("visibility").notNull().default("private"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const githubAccount = pgTable("githubAccount", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  githubUserId: text("githubUserId"),
  username: text("username").notNull(),
  avatar: text("avatar"),
  installationId: text("installationId").notNull().unique(),
  connectedAt: timestamp("connectedAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const projectRepository = pgTable("projectRepository", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("projectId")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" })
    .unique(),
  repositoryId: text("repositoryId").notNull(),
  repositoryName: text("repositoryName").notNull(),
  owner: text("owner").notNull(),
  defaultBranch: text("defaultBranch").notNull().default("main"),
  selectedBranch: text("selectedBranch").notNull().default("main"),
  isPrivate: boolean("isPrivate").notNull().default(false),
  cloneUrl: text("cloneUrl").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const deployment = pgTable("deployment", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("projectId")
    .notNull()
    .references(() => project.id, { onDelete: "cascade" }),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  commitSha: text("commitSha"),
  commitMessage: text("commitMessage"),
  branch: text("branch").notNull(),
  status: text("status").notNull().default("queued"), // queued, initializing, cloning, installing, building, uploading, deploying, success, failed, cancelled
  triggerType: text("triggerType").notNull().default("manual"), // manual, push
  deploymentNumber: integer("deploymentNumber").notNull(),
  buildDuration: integer("buildDuration"), // in milliseconds or seconds
  queuedAt: timestamp("queuedAt").notNull().defaultNow(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
