<?php

namespace App\Entity;

use App\Repository\CampaignUserRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CampaignUserRepository::class)]
#[ORM\Table(name: 'campaign_users')]
class CampaignUser
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Campaign::class, inversedBy: 'campaignUsers')]
    #[ORM\JoinColumn(nullable: false, onDelete: "CASCADE")]
    private ?Campaign $campaign = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: "user_id", referencedColumnName: "user_id", nullable: false, onDelete: "CASCADE")]
    private ?User $user = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $role_in_campaign = null;

    #[ORM\Column(type: 'datetime_immutable', options: ["default" => "CURRENT_TIMESTAMP"])]
    private ?\DateTimeImmutable $assigned_at = null;

    public function __construct()
    {
        $this->assigned_at = new \DateTimeImmutable();
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

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function getRoleInCampaign(): ?string
    {
        return $this->role_in_campaign;
    }

    public function setRoleInCampaign(?string $role_in_campaign): static
    {
        $this->role_in_campaign = $role_in_campaign;
        return $this;
    }

    public function getAssignedAt(): ?\DateTimeImmutable
    {
        return $this->assigned_at;
    }
}
