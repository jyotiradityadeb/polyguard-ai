-- CreateTable
CREATE TABLE "Entity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "scientificName" TEXT,
    "category" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Alias" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    CONSTRAINT "Alias_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductIngredient" (
    "productId" TEXT NOT NULL,
    "herbId" TEXT NOT NULL,

    PRIMARY KEY ("productId", "herbId"),
    CONSTRAINT "ProductIngredient_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Entity" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductIngredient_herbId_fkey" FOREIGN KEY ("herbId") REFERENCES "Entity" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pathway" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Phytochemical" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "externalIds" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "InteractionEvidence" (
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
    "sourceTitle" TEXT,
    "publicationYear" INTEGER,
    "pmid" TEXT,
    "doi" TEXT,
    "sourceUrl" TEXT
);

-- CreateTable
CREATE TABLE "EvidenceLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    CONSTRAINT "EvidenceLink_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "InteractionEvidence" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Alias_entityId_value_key" ON "Alias"("entityId", "value");

-- CreateIndex
CREATE INDEX "InteractionEvidence_herbId_drugId_idx" ON "InteractionEvidence"("herbId", "drugId");

-- CreateIndex
CREATE INDEX "EvidenceLink_source_target_idx" ON "EvidenceLink"("source", "target");
