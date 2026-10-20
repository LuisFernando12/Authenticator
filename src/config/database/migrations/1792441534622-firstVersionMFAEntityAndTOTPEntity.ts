import { MigrationInterface, QueryRunner } from "typeorm";

export class FirstVersionMFAEntityAndTOTPEntity1792441534622 implements MigrationInterface {
    name = 'FirstVersionMFAEntityAndTOTPEntity1792441534622'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mfa" DROP CONSTRAINT "FK_a627548c589148b41436001154e"`);
        await queryRunner.query(`ALTER TABLE "totp" RENAME COLUMN "createdAt" TO "created_at"`);
        await queryRunner.query(`ALTER TABLE "mfa" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "mfa" ADD "active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "mfa" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "mfa" ADD CONSTRAINT "FK_a627548c589148b41436001154e" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "mfa" DROP CONSTRAINT "FK_a627548c589148b41436001154e"`);
        await queryRunner.query(`ALTER TABLE "mfa" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "mfa" DROP COLUMN "active"`);
        await queryRunner.query(`ALTER TABLE "mfa" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "totp" RENAME COLUMN "created_at" TO "createdAt"`);
        await queryRunner.query(`ALTER TABLE "mfa" ADD CONSTRAINT "FK_a627548c589148b41436001154e" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
