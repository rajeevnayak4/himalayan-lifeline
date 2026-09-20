-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "lang" TEXT NOT NULL DEFAULT 'en',
    "emergencyContact" TEXT,
    "trekRoute" TEXT,
    "lastLat" DOUBLE PRECISION,
    "lastLng" DOUBLE PRECISION,
    "lastAltitude" DOUBLE PRECISION,
    "lastPingAt" TIMESTAMP(3),
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SOSAlert" (
    "id" TEXT NOT NULL,
    "victimId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "altitude" DOUBLE PRECISION,
    "locationName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "injuryType" TEXT NOT NULL DEFAULT 'other',
    "message" TEXT,
    "audioBase64" TEXT,
    "isOfflineQueued" BOOLEAN NOT NULL DEFAULT false,
    "hopCount" INTEGER NOT NULL DEFAULT 0,
    "batteryLevel" INTEGER DEFAULT 78,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "SOSAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Response" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "responderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'acknowledged',
    "etaMinutes" INTEGER,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelayLog" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "hopDeviceId" TEXT NOT NULL,
    "hopName" TEXT NOT NULL,
    "hopType" TEXT NOT NULL,
    "rssi" INTEGER NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "altitude" DOUBLE PRECISION,
    "batteryPct" INTEGER,
    "hoppedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RelayLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Checkin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "altitude" DOUBLE PRECISION,
    "batteryPct" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Checkin_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SOSAlert" ADD CONSTRAINT "SOSAlert_victimId_fkey" FOREIGN KEY ("victimId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "SOSAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Response" ADD CONSTRAINT "Response_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelayLog" ADD CONSTRAINT "RelayLog_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "SOSAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Checkin" ADD CONSTRAINT "Checkin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
