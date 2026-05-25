-- CreateTable
CREATE TABLE "UserHealthProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dailyCalorieGoal" INTEGER NOT NULL DEFAULT 2000,
    "proteinGoal" INTEGER NOT NULL DEFAULT 150,
    "carbGoal" INTEGER NOT NULL DEFAULT 200,
    "fatGoal" INTEGER NOT NULL DEFAULT 65,
    "waterGoal" INTEGER NOT NULL DEFAULT 64
);

-- CreateTable
CREATE TABLE "FoodItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "calories" INTEGER NOT NULL,
    "protein" REAL NOT NULL,
    "carbs" REAL NOT NULL,
    "fat" REAL NOT NULL,
    "fiber" REAL NOT NULL DEFAULT 0,
    "sugar" REAL NOT NULL DEFAULT 0,
    "servingSize" REAL NOT NULL DEFAULT 1,
    "servingUnit" TEXT NOT NULL DEFAULT 'serving',
    "createdBy" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PresetMeal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FoodLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "foodItemId" INTEGER NOT NULL,
    "mealType" TEXT NOT NULL,
    "servings" REAL NOT NULL DEFAULT 1,
    "logDate" TEXT NOT NULL,
    "loggedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "photoUrl" TEXT,
    "note" TEXT,
    CONSTRAINT "FoodLog_foodItemId_fkey" FOREIGN KEY ("foodItemId") REFERENCES "FoodItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeightLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "loggedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "UserHealthProfile_userId_key" ON "UserHealthProfile"("userId");
