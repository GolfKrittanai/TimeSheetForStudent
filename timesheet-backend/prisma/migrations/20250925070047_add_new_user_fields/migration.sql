/*
  Warnings:

  - You are about to drop the column `address` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `address`,
    ADD COLUMN `academicYear` VARCHAR(10) NULL,
    ADD COLUMN `companyName` VARCHAR(255) NULL,
    ADD COLUMN `course` VARCHAR(50) NULL,
    ADD COLUMN `internPosition` VARCHAR(255) NULL,
    ADD COLUMN `semester` VARCHAR(20) NULL;
