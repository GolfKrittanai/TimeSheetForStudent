-- AlterTable
ALTER TABLE `user` MODIFY `role` ENUM('admin', 'student', 'teacher') NOT NULL DEFAULT 'student';
