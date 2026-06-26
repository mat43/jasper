-- CreateTable
CREATE TABLE "WaterLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "logDate" TEXT NOT NULL,
    "loggedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserHealthProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dailyCalorieGoal" INTEGER NOT NULL DEFAULT 2000,
    "proteinGoal" INTEGER NOT NULL DEFAULT 150,
    "carbGoal" INTEGER NOT NULL DEFAULT 200,
    "fatGoal" INTEGER NOT NULL DEFAULT 65,
    "fiberGoal" INTEGER NOT NULL DEFAULT 28,
    "waterGoal" INTEGER NOT NULL DEFAULT 64
);
INSERT INTO "new_UserHealthProfile" ("carbGoal", "dailyCalorieGoal", "fatGoal", "id", "proteinGoal", "userId", "waterGoal") SELECT "carbGoal", "dailyCalorieGoal", "fatGoal", "id", "proteinGoal", "userId", "waterGoal" FROM "UserHealthProfile";
DROP TABLE "UserHealthProfile";
ALTER TABLE "new_UserHealthProfile" RENAME TO "UserHealthProfile";
CREATE UNIQUE INDEX "UserHealthProfile_userId_key" ON "UserHealthProfile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "WaterLog_userId_logDate_key" ON "WaterLog"("userId", "logDate");
