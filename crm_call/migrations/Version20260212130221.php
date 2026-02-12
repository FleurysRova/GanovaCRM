<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260212130221 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE qualification_values DROP CONSTRAINT fk_d0a1e46b443707b0');
        $this->addSql('ALTER TABLE qualification_values ADD CONSTRAINT FK_D0A1E46B443707B0 FOREIGN KEY (field_id) REFERENCES campaign_fields (id) NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE qualification_values DROP CONSTRAINT FK_D0A1E46B443707B0');
        $this->addSql('ALTER TABLE qualification_values ADD CONSTRAINT fk_d0a1e46b443707b0 FOREIGN KEY (field_id) REFERENCES qualification_fields (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }
}
