-- CreateTable
CREATE TABLE "api_configuration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brevoApiKey" TEXT,
    "hubspotToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brevo_deal" (
    "id" TEXT NOT NULL,
    "brevoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" TEXT,
    "dealStage" TEXT,
    "rawJson" JSONB NOT NULL,
    "hubspotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brevo_deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brevo_note" (
    "id" TEXT NOT NULL,
    "brevoId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "dealId" TEXT,
    "hubspotId" TEXT,
    "rawJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brevo_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brevo_task" (
    "id" TEXT NOT NULL,
    "brevoId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "dealId" TEXT,
    "hubspotId" TEXT,
    "rawJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brevo_task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_configuration_userId_key" ON "api_configuration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "brevo_deal_brevoId_key" ON "brevo_deal"("brevoId");

-- CreateIndex
CREATE UNIQUE INDEX "brevo_note_brevoId_key" ON "brevo_note"("brevoId");

-- CreateIndex
CREATE UNIQUE INDEX "brevo_task_brevoId_key" ON "brevo_task"("brevoId");

-- AddForeignKey
ALTER TABLE "api_configuration" ADD CONSTRAINT "api_configuration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brevo_note" ADD CONSTRAINT "brevo_note_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "brevo_deal"("brevoId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brevo_task" ADD CONSTRAINT "brevo_task_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "brevo_deal"("brevoId") ON DELETE SET NULL ON UPDATE CASCADE;
