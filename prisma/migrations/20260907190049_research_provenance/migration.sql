-- CreateTable
CREATE TABLE "ResearchSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceName" TEXT NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "retrievedAt" TEXT NOT NULL,
    "payload" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ResearchRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REVIEW_PENDING',
    "predicate" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "revision" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ResearchRecord_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ResearchSource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResearchReview" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recordId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "reviewer" TEXT NOT NULL,
    "reviewedAt" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    CONSTRAINT "ResearchReview_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "ResearchRecord" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ResearchRecord_status_predicate_idx" ON "ResearchRecord"("status", "predicate");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchReview_recordId_revision_key" ON "ResearchReview"("recordId", "revision");
