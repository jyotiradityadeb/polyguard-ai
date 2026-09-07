-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InteractionEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "herbId" TEXT NOT NULL,
    "drugId" TEXT NOT NULL,
    "pathwayId" TEXT,
    "phytochemicalId" TEXT,
    "interactionType" TEXT NOT NULL,
    "potentialConcern" TEXT NOT NULL,
    "evidenceGrade" TEXT NOT NULL,
    "studyType" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "signalType" TEXT NOT NULL DEFAULT 'DIRECT_CLINICAL',
    "linkedNodeIds" TEXT NOT NULL DEFAULT '[]',
    "sourceTitle" TEXT,
    "publicationYear" INTEGER,
    "pmid" TEXT,
    "doi" TEXT,
    "sourceUrl" TEXT
);
INSERT INTO "new_InteractionEvidence" ("doi", "drugId", "evidenceGrade", "herbId", "id", "interactionType", "isDemo", "notes", "pathwayId", "phytochemicalId", "pmid", "potentialConcern", "publicationYear", "sourceTitle", "sourceUrl", "studyType", "summary", "validated") SELECT "doi", "drugId", "evidenceGrade", "herbId", "id", "interactionType", "isDemo", "notes", "pathwayId", "phytochemicalId", "pmid", "potentialConcern", "publicationYear", "sourceTitle", "sourceUrl", "studyType", "summary", "validated" FROM "InteractionEvidence";
DROP TABLE "InteractionEvidence";
ALTER TABLE "new_InteractionEvidence" RENAME TO "InteractionEvidence";
CREATE INDEX "InteractionEvidence_herbId_drugId_idx" ON "InteractionEvidence"("herbId", "drugId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
