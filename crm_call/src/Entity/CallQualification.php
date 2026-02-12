<?php

namespace App\Entity;

use App\Repository\CallQualificationRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CallQualificationRepository::class)]
#[ORM\Table(name: 'call_qualifications')]
class CallQualification
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(inversedBy: 'callQualification', targetEntity: Call::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Call $call = null;

    #[ORM\Column(length: 50)]
    private ?string $status = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $qualifiedAt = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCall(): ?Call
    {
        return $this->call;
    }

    public function setCall(Call $call): static
    {
        $this->call = $call;
        return $this;
    }

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;
        return $this;
    }

    public function getQualifiedAt(): ?\DateTimeInterface
    {
        return $this->qualifiedAt;
    }

    public function setQualifiedAt(\DateTimeInterface $qualifiedAt): static
    {
        $this->qualifiedAt = $qualifiedAt;
        return $this;
    }
}
