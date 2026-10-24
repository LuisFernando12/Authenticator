import { MigrationInterface, QueryRunner } from 'typeorm';

export class FirstVersionMFAEntityAndTOTPEntity1792871994325 implements MigrationInterface {
  name = 'FirstVersionMFAEntityAndTOTPEntity1792871994325';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "totp" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "secret" character varying NOT NULL, "mfa_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "REL_1c79d68e71a891c02497232bf9" UNIQUE ("mfa_id"), CONSTRAINT "PK_9b6eefc3b52bbf575eea15a6f6f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."mfa_type_enum" AS ENUM('TOTP', 'SMS', 'EMAIL')`,
    );
    await queryRunner.query(
      `CREATE TABLE "mfa" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."mfa_type_enum" NOT NULL, "user_id" uuid NOT NULL, "active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f4e180ccc1f351057978f46d458" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "token" ADD CONSTRAINT "UQ_a3a8179b544ae23dfc9449582be" UNIQUE ("jti")`,
    );
    await queryRunner.query(
      `ALTER TABLE "totp" ADD CONSTRAINT "FK_1c79d68e71a891c02497232bf92" FOREIGN KEY ("mfa_id") REFERENCES "mfa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "mfa" ADD CONSTRAINT "FK_a627548c589148b41436001154e" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "mfa" DROP CONSTRAINT "FK_a627548c589148b41436001154e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "totp" DROP CONSTRAINT "FK_1c79d68e71a891c02497232bf92"`,
    );
    await queryRunner.query(
      `ALTER TABLE "token" DROP CONSTRAINT "UQ_a3a8179b544ae23dfc9449582be"`,
    );
    await queryRunner.query(`DROP TABLE "mfa"`);
    await queryRunner.query(`DROP TYPE "public"."mfa_type_enum"`);
    await queryRunner.query(`DROP TABLE "totp"`);
  }
}
