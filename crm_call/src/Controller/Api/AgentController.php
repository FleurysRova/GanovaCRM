<?php

namespace App\Controller\Api;

use App\Entity\Contact;
use App\Entity\Campaign;
use App\Entity\CampaignUser;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/agent', name: 'api_agent_')]
#[IsGranted('ROLE_USER')]
class AgentController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager
    ) {}

    #[Route('/stats', name: 'stats', methods: ['GET'])]
    public function getStats(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        if (!$user) {
            return $this->json(['error' => 'User not found'], 404);
        }

        // Real stats would come from CallLog entity which might not exist yet
        // For now we return base stats + mock dynamic ones
        
        $stats = [
            'callsToday' => 12, // Mock or real if we had CallLog
            'callsProgress' => 45, // % of objective
            'avgDuration' => 185, // seconds
            'durationStatus' => 'Optimal',
            'qualificationRate' => 88,
            'qualificationStatus' => 'Excellent',
            'score' => 1250
        ];

        return $this->json($stats);
    }

    #[Route('/campaigns', name: 'campaigns', methods: ['GET'])]
    public function getCampaigns(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        
        $assignments = $this->entityManager->getRepository(CampaignUser::class)->findBy(['user' => $user]);

        $data = [];
        foreach ($assignments as $assignment) {
            $campaign = $assignment->getCampaign();
            $contactsCount = $campaign->getContacts()->count();
            
            $data[] = [
                'id' => $campaign->getId(),
                'nom' => $campaign->getNom(),
                'description' => $campaign->getDescription(),
                'progress' => 65, // Mock progress
                'contacts_remaining' => $contactsCount // Simplified
            ];
        }

        return $this->json($data);
    }

    #[Route('/alerts', name: 'alerts', methods: ['GET'])]
    public function getAlerts(): JsonResponse
    {
        // Real alerts would come from an Alert entity
        return $this->json([
            ['id' => 1, 'type' => 'warning', 'message' => 'Rappel client: Dupont à 16:00', 'time' => '10 min'],
            ['id' => 2, 'type' => 'danger', 'message' => 'Objectif journalier non atteint (-10)', 'time' => '1h']
        ]);
    }

    #[Route('/next-contact/{campaignId}', name: 'next_contact', methods: ['GET'])]
    public function getNextContact(int $campaignId): JsonResponse
    {
        $campaign = $this->entityManager->getRepository(Campaign::class)->find($campaignId);
        if (!$campaign) return $this->json(['error' => 'Campagne introuvable'], 404);

        $contact = $this->entityManager->getRepository(Contact::class)->findOneBy([
            'campaign' => $campaign,
            'status' => 'nouveau'
        ]);

        if (!$contact) {
            return $this->json(['error' => 'Plus de contacts disponibles pour cette campagne'], 404);
        }

        return $this->json([
            'id' => $contact->getId(),
            'nom' => $contact->getNom(),
            'telephone' => $contact->getTelephone(),
            'email' => $contact->getEmail(),
            'source' => $contact->getSource()
        ]);
    }

    #[Route('/campaigns/{id}/fields', name: 'campaign_fields', methods: ['GET'])]
    public function getFields(int $id): JsonResponse
    {
        $campaign = $this->entityManager->getRepository(\App\Entity\Campaign::class)->find($id);
        if (!$campaign) return $this->json(['error' => 'Campaign not found'], 404);

        $data = [];
        foreach ($campaign->getFields() as $field) {
            $data[] = [
                'id' => $field->getId(),
                'label' => $field->getLabel(),
                'type' => $field->getFieldType(),
                'options' => $field->getOptions(),
                'required' => $field->isIsRequired()
            ];
        }

        return $this->json($data);
    }

    #[Route('/campaigns/{id}/contacts', name: 'campaign_contacts', methods: ['GET'])]
    public function getCampaignContacts(int $id): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        
        $campaign = $this->entityManager->getRepository(Campaign::class)->find($id);
        if (!$campaign) return $this->json(['error' => 'Campagne introuvable'], 404);

        // Vérifier si l'utilisateur est assigné à cette campagne
        $assignment = $this->entityManager->getRepository(CampaignUser::class)->findOneBy([
            'user' => $user,
            'campaign' => $campaign
        ]);

        if (!$assignment && !$this->isGranted('ROLE_SUPERVISEUR')) {
            return $this->json(['error' => 'Accès refusé : Vous n\'êtes pas affecté à cette campagne'], 403);
        }

        $contacts = $campaign->getContacts();
        $data = [];
        foreach ($contacts as $c) {
            $data[] = [
                'id' => $c->getId(),
                'nom' => $c->getNom(),
                'telephone' => $c->getTelephone(),
                'email' => $c->getEmail(),
                'source' => $c->getSource(),
                'status' => $c->getStatus(),
            ];
        }

        return $this->json($data);
    }
}
