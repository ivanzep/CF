-- CreateEnum
CREATE TYPE "ScheduleMode" AS ENUM ('EVEN', 'CUSTOM');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client" TEXT,
    "address" TEXT,
    "description" TEXT,
    "projectDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "categoryId" TEXT,
    "code" TEXT,
    "description" TEXT NOT NULL,
    "totalBudget" DECIMAL(18,2) NOT NULL,
    "scheduleMode" "ScheduleMode" NOT NULL DEFAULT 'EVEN',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEntry" (
    "id" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "PaymentEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Draw" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "source" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Draw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapTableMember" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'LP',
    "ownershipPercent" DECIMAL(7,4),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CapTableMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "note" TEXT,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distribution" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "note" TEXT,

    CONSTRAINT "Distribution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_projectId_name_key" ON "Category"("projectId", "name");

-- CreateIndex
CREATE INDEX "LineItem_projectId_idx" ON "LineItem"("projectId");

-- CreateIndex
CREATE INDEX "PaymentEntry_lineItemId_idx" ON "PaymentEntry"("lineItemId");

-- CreateIndex
CREATE INDEX "Draw_projectId_idx" ON "Draw"("projectId");

-- CreateIndex
CREATE INDEX "CapTableMember_projectId_idx" ON "CapTableMember"("projectId");

-- CreateIndex
CREATE INDEX "Contribution_memberId_idx" ON "Contribution"("memberId");

-- CreateIndex
CREATE INDEX "Distribution_memberId_idx" ON "Distribution"("memberId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineItem" ADD CONSTRAINT "LineItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineItem" ADD CONSTRAINT "LineItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEntry" ADD CONSTRAINT "PaymentEntry_lineItemId_fkey" FOREIGN KEY ("lineItemId") REFERENCES "LineItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draw" ADD CONSTRAINT "Draw_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapTableMember" ADD CONSTRAINT "CapTableMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CapTableMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "CapTableMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
