-- CreateTable
CREATE TABLE "ScientificCompound" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "canonicalName" TEXT NOT NULL,
    "pubchemCid" TEXT,
    "chemblId" TEXT,
    "imppatId" TEXT,
    "inchiKey" TEXT,
    "smiles" TEXT,
    "synonyms" TEXT NOT NULL,
    "identityStatus" TEXT NOT NULL DEFAULT 'UNRESOLVED'
);
