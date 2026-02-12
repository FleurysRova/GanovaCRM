<?php

namespace App\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use App\Repository\CampaignFieldRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CampaignFieldRepository::class)]
#[ORM\Table(name: 'campaign_fields')]
class CampaignField
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(inversedBy: 'fields')]
    #[ORM\JoinColumn(name: "campaign_id", referencedColumnName: "id", nullable: false, onDelete: "CASCADE")]
    private ?Campaign $campaign = null;

    #[ORM\Column(length: 255)]
    private ?string $label = null;

    #[ORM\Column(length: 50)]
    private ?string $field_type = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $options = null;

    #[ORM\Column(options: ["default" => false])]
    private ?bool $is_required = false;

    #[ORM\Column(options: ["default" => 0])]
    private ?int $position = 0;

    #[ORM\OneToMany(mappedBy: 'field', targetEntity: QualificationValue::class, cascade: ['persist', 'remove'])]
    private Collection $qualificationValues;

    #[ORM\Column(options: ["default" => "CURRENT_TIMESTAMP"])]
    private ?\DateTimeImmutable $created_at = null;

    public function __construct()
    {
        $this->created_at = new \DateTimeImmutable();
        $this->qualificationValues = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCampaign(): ?Campaign
    {
        return $this->campaign;
    }

    public function setCampaign(?Campaign $campaign): static
    {
        $this->campaign = $campaign;
        return $this;
    }

    public function getLabel(): ?string
    {
        return $this->label;
    }

    public function setLabel(string $label): static
    {
        $this->label = $label;
        return $this;
    }

    public function getFieldType(): ?string
    {
        return $this->field_type;
    }

    public function setFieldType(string $field_type): static
    {
        $this->field_type = $field_type;
        return $this;
    }

    public function getOptions(): ?array
    {
        return $this->options;
    }

    public function setOptions(?array $options): static
    {
        $this->options = $options;
        return $this;
    }

    public function isIsRequired(): ?bool
    {
        return $this->is_required;
    }

    public function setIsRequired(bool $is_required): static
    {
        $this->is_required = $is_required;
        return $this;
    }

    public function getPosition(): ?int
    {
        return $this->position;
    }

    public function setPosition(int $position): static
    {
        $this->position = $position;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->created_at;
    }

    public function setCreatedAt(\DateTimeImmutable $created_at): static
    {
        $this->created_at = $created_at;
        return $this;
    }
}
