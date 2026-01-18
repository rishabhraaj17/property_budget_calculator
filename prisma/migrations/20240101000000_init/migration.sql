-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "inputMode" TEXT NOT NULL,
    "pricePerSqFt" DOUBLE PRECISION,
    "areaSqFt" DOUBLE PRECISION,
    "parkingCost" DOUBLE PRECISION,
    "totalDealValue" DOUBLE PRECISION NOT NULL,
    "blackComponent" DOUBLE PRECISION NOT NULL,
    "overrides" JSONB NOT NULL DEFAULT '{}',
    "calculations" JSONB NOT NULL DEFAULT '{}',
    "stateCode" TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StateCharges" (
    "id" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "stateName" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "stampDutyRate" DOUBLE PRECISION NOT NULL,
    "registrationFee" DOUBLE PRECISION NOT NULL,
    "gstRateAffordable" DOUBLE PRECISION,
    "gstRateStandard" DOUBLE PRECISION,
    "affordableLimit" DOUBLE PRECISION,
    "metroSurcharge" DOUBLE PRECISION,
    "otherCharges" DOUBLE PRECISION,
    "notes" TEXT,
    "sourceUrl" TEXT,
    "lastVerified" TIMESTAMP(3),
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StateCharges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Property_userId_idx" ON "Property"("userId");

-- CreateIndex
CREATE INDEX "Property_sessionId_idx" ON "Property"("sessionId");

-- CreateIndex
CREATE INDEX "Property_stateCode_idx" ON "Property"("stateCode");

-- CreateIndex
CREATE INDEX "StateCharges_stateCode_idx" ON "StateCharges"("stateCode");

-- CreateIndex
CREATE INDEX "StateCharges_userId_idx" ON "StateCharges"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StateCharges_stateCode_propertyType_userId_key" ON "StateCharges"("stateCode", "propertyType", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StateCharges" ADD CONSTRAINT "StateCharges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
