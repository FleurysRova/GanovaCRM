<?php

namespace App\Entity;

use App\Repository\QualificationValueRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: QualificationValueRepository::class)]
#[ORM\Table(name: 'qualification_values')]
class QualificationValue
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Call::class, inversedBy: 'qualificationValues')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Call $call = null;

    #[ORM\ManyToOne(targetEntity: CampaignField::class, inversedBy: 'qualificationValues')]
    #[ORM\JoinColumn(nullable: false)]
    private ?CampaignField $field = null;

    #[ORM\Column(type: Types::TEXT)]
    private ?string $value = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCall(): ?Call
    {
        return $this->call;
    }

    public function setCall(?Call $call): static
    {
        $this->call = $call;
        return $this;
    }

    public function getField(): ?CampaignField
    {
        return $this->field;
    }

    public function setField(?CampaignField $field): static
    {
        $this->field = $field;
        return $this;
    }

    public function getValue(): ?string
    {
        return $this->value;
    }

    public function setValue(string $value): static
    {
        $this->value = $value;
        return $this;
    }
}
