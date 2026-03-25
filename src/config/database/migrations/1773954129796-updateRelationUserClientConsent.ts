import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRelationUserClientConsent1773954129796 implements MigrationInterface {
  name = 'UpdateRelationUserClientConsent1773954129796';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_client_consent" ADD "user_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_client_consent" ADD "client_id" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_client_consent" ADD CONSTRAINT "FK_5085f9f5ce8f787bbf58729b92a" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_client_consent" ADD CONSTRAINT "FK_bd9e36b759c32fd8b29273ad663" FOREIGN KEY ("client_id") REFERENCES "client"("clientId") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_client_consent" DROP CONSTRAINT "FK_bd9e36b759c32fd8b29273ad663"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_client_consent" DROP CONSTRAINT "FK_5085f9f5ce8f787bbf58729b92a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_client_consent" DROP COLUMN "client_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_client_consent" DROP COLUMN "user_id"`,
    );
  }
}
