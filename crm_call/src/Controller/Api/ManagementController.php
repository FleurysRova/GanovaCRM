<?php

namespace App\Controller\Api;

use App\Entity\Campaign;
use App\Entity\CampaignField;
use App\Entity\CampaignUser;
use App\Entity\Contact;
use App\Entity\User;
use App\Repository\CampaignRepository;
use App\Repository\ContactRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/management', name: 'api_management_')]
#[IsGranted('ROLE_RESPONSABLE')]
class ManagementController extends AbstractController
{
    // --- GESTION DES CAMPAGNES ---

    #[Route('/campaigns', name: 'campaign_list', methods: ['GET'])]
    public function listCampaigns(CampaignRepository $repository): JsonResponse
    {
        $campaigns = $repository->findAll();
        $data = [];
        foreach ($campaigns as $campaign) {
            $data[] = [
                'id' => $campaign->getId(),
                'nom' => $campaign->getNom(),
                'description' => $campaign->getDescription(),
                'date_debut' => $campaign->getDateDebut()?->format('Y-m-d'),
                'date_fin' => $campaign->getDateFin()?->format('Y-m-d'),
                'responsable' => $campaign->getResponsable()?->getEmail(),
                'contacts_count' => count($campaign->getContacts()),
            ];
        }
        return $this->json($data);
    }

    #[Route('/campaigns', name: 'campaign_create', methods: ['POST'])]
    public function createCampaign(Request $request, EntityManagerInterface $em, UserRepository $userRepo): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);
            if (!$data || !isset($data['nom'])) {
                return $this->json(['error' => 'Le titre de la campagne est obligatoire'], 400);
            }

            $campaign = new Campaign();
            $campaign->setNom($data['nom']);
            $campaign->setDescription($data['description'] ?? '');

            if (!empty($data['date_debut'])) {
                $campaign->setDateDebut(new \DateTimeImmutable($data['date_debut']));
            }
            if (!empty($data['date_fin'])) {
                $campaign->setDateFin(new \DateTimeImmutable($data['date_fin']));
            }

            $responsable = null;
            if (!empty($data['responsable_id'])) {
                $responsable = $userRepo->find($data['responsable_id']);
            }

            // Si pas de responsable spécifié, tenter d'utiliser l'utilisateur connecté
            if (!$responsable) {
                $responsable = $this->getUser();
            }

            $campaign->setResponsable($responsable);

            $em->persist($campaign);
            $em->flush();

            return $this->json(['status' => 'success', 'id' => $campaign->getId()], 201);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 500);
        }
    }

    #[Route('/campaigns/{id}', name: 'campaign_update', methods: ['PUT'])]
    public function updateCampaign(int $id, Request $request, EntityManagerInterface $em, CampaignRepository $repo, UserRepository $userRepo): JsonResponse
    {
        try {
            $campaign = $repo->find($id);
            if (!$campaign) {
                return $this->json(['error' => 'Campagne introuvable'], 404);
            }

            $data = json_decode($request->getContent(), true);
            if (!$data) {
                return $this->json(['error' => 'Données JSON invalides'], 400);
            }

            if (isset($data['nom']))
                $campaign->setNom($data['nom']);
            if (isset($data['description']))
                $campaign->setDescription($data['description']);

            if (!empty($data['date_debut'])) {
                $campaign->setDateDebut(new \DateTimeImmutable($data['date_debut']));
            } else {
                $campaign->setDateDebut(null);
            }

            if (!empty($data['date_fin'])) {
                $campaign->setDateFin(new \DateTimeImmutable($data['date_fin']));
            } else {
                $campaign->setDateFin(null);
            }

            if (isset($data['responsable_id'])) {
                $responsable = $userRepo->find($data['responsable_id']);
                if ($responsable)
                    $campaign->setResponsable($responsable);
            }

            $em->flush();
            return $this->json(['status' => 'success', 'message' => 'Campagne mise à jour']);
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 500);
        }
    }

    #[Route('/campaigns/{id}', name: 'campaign_delete', methods: ['DELETE'])]
    public function deleteCampaign(Campaign $campaign, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($campaign);
        $em->flush();
        return $this->json(['status' => 'success']);
    }

    // --- GESTION DES UTILISATEURS (AGENTS / SUPERVISEURS) ---

    #[Route('/users', name: 'user_list', methods: ['GET'])]
    public function listUsers(UserRepository $repository): JsonResponse
    {
        $users = $repository->findAll();
        $data = [];
        foreach ($users as $user) {
            $data[] = [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'nom' => $user->getNom(),
                'prenom' => $user->getPrenom(),
                'role' => $user->getRoleUsers(),
                'status' => $user->getStatus(),
            ];
        }
        return $this->json($data);
    }

    #[Route('/users', name: 'user_create', methods: ['POST'])]
    public function createUser(Request $request, EntityManagerInterface $em, UserPasswordHasherInterface $hasher): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $user = new User();
        $user->setEmail($data['email']);
        $user->setNom($data['nom']);
        $user->setPrenom($data['prenom']);
        $user->setRoleUsers($data['role'] ?? 'agent');
        $user->setStatus($data['status'] ?? 'active');

        $hashed = $hasher->hashPassword($user, $data['password'] ?? 'admin123');
        $user->setPassword($hashed);

        $em->persist($user);
        $em->flush();

        return $this->json(['status' => 'success', 'id' => $user->getId()], 201);
    }

    #[Route('/users/{id}', name: 'user_update', methods: ['PUT'])]
    public function updateUser(User $user, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (isset($data['nom']))
            $user->setNom($data['nom']);
        if (isset($data['prenom']))
            $user->setPrenom($data['prenom']);
        if (isset($data['email']))
            $user->setEmail($data['email']);
        if (isset($data['role']))
            $user->setRoleUsers($data['role']);
        if (isset($data['status']))
            $user->setStatus($data['status']);

        $em->flush();
        return $this->json(['status' => 'success']);
    }

    #[Route('/users/{id}', name: 'user_delete', methods: ['DELETE'])]
    public function deleteUser(User $user, EntityManagerInterface $em): JsonResponse
    {
        // Sécurité : ne pas supprimer l'admin principal
        if ($user->getEmail() === 'admin@zanova.com') {
            return $this->json(['error' => 'Action interdite pour ce profil'], 400);
        }
        $em->remove($user);
        $em->flush();
        return $this->json(['status' => 'success']);
    }

    // --- FORMULAIRES DYNAMIQUES (FIELDS) ---

    #[Route('/campaigns/{id}/fields', name: 'field_list', methods: ['GET'])]
    public function listFields(Campaign $campaign): JsonResponse
    {
        $fields = $campaign->getFields();
        $data = [];
        foreach ($fields as $field) {
            $data[] = [
                'id' => $field->getId(),
                'label' => $field->getLabel(),
                'type' => $field->getFieldType(),
                'options' => $field->getOptions(),
                'required' => $field->isIsRequired(),
                'position' => $field->getPosition(),
            ];
        }
        return $this->json($data);
    }

    #[Route('/campaigns/{id}/fields', name: 'field_add', methods: ['POST'])]
    public function addField(Campaign $campaign, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $field = new CampaignField();
        $field->setCampaign($campaign);
        $field->setLabel($data['label']);
        $field->setFieldType($data['type'] ?? 'text');
        $field->setOptions($data['options'] ?? null);
        $field->setIsRequired($data['required'] ?? false);
        $field->setPosition($data['position'] ?? 0);

        $em->persist($field);
        $em->flush();

        return $this->json(['status' => 'success', 'id' => $field->getId()], 201);
    }

    #[Route('/fields/{id}', name: 'field_update', methods: ['PUT'])]
    public function updateField(CampaignField $field, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (isset($data['label']))
            $field->setLabel($data['label']);
        if (isset($data['type']))
            $field->setFieldType($data['type']);
        if (isset($data['options']))
            $field->setOptions($data['options']);
        if (isset($data['required']))
            $field->setIsRequired($data['required']);
        if (isset($data['position']))
            $field->setPosition($data['position']);

        $em->flush();
        return $this->json(['status' => 'success']);
    }

    #[Route('/fields/{id}', name: 'field_delete', methods: ['DELETE'])]
    public function deleteField(CampaignField $field, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($field);
        $em->flush();
        return $this->json(['status' => 'success']);
    }

    // --- AFFECTATIONS (ASSIGNMENTS) ---

    #[Route('/campaigns/{id}/users', name: 'campaign_users_list', methods: ['GET'])]
    public function listCampaignUsers(Campaign $campaign): JsonResponse
    {
        $assignments = $campaign->getCampaignUsers();
        $data = [];
        foreach ($assignments as $ass) {
            $data[] = [
                'id' => $ass->getId(),
                'user_id' => $ass->getUser()->getId(),
                'nom' => $ass->getUser()->getNom() . ' ' . $ass->getUser()->getPrenom(),
                'role' => $ass->getRoleInCampaign(),
            ];
        }
        return $this->json($data);
    }

    #[Route('/campaigns/{id}/assign/{userId}', name: 'campaign_assign_user', methods: ['POST'])]
    public function assignUser(Campaign $campaign, int $userId, UserRepository $userRepo, EntityManagerInterface $em): JsonResponse
    {
        try {
            $user = $userRepo->find($userId);
            if (!$user)
                return $this->json(['error' => 'Utilisateur introuvable'], 404);

            // Vérifier si déjà assigné
            $existing = $em->getRepository(CampaignUser::class)->findOneBy(['campaign' => $campaign, 'user' => $user]);
            if ($existing)
                return $this->json(['error' => 'Ce membre est déjà affecté à cette campagne'], 400);

            $assignment = new CampaignUser();
            $assignment->setCampaign($campaign);
            $assignment->setUser($user);
            $assignment->setRoleInCampaign($user->getRoleUsers());

            $em->persist($assignment);
            $em->flush();

            return $this->json(['status' => 'success']);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Erreur technique: ' . $e->getMessage()], 500);
        }
    }

    #[Route('/assignments/{id}', name: 'campaign_unassign_user', methods: ['DELETE'])]
    public function unassignUser(CampaignUser $assignment, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($assignment);
        $em->flush();
        return $this->json(['status' => 'success']);
    }

    // --- CONTACTS ---

    #[Route('/campaigns/{id}/contacts', name: 'contact_list', methods: ['GET'])]
    public function listContacts(Campaign $campaign, ContactRepository $repo): JsonResponse
    {
        $contacts = $repo->findBy(['campaign' => $campaign]);
        $data = [];
        foreach ($contacts as $c) {
            $data[] = [
                'id' => $c->getId(),
                'nom' => $c->getNom(),
                'telephone' => $c->getTelephone(),
                'email' => $c->getEmail(),
                'source' => $c->getSource(),
                'status' => $c->getStatus(),
                'autre' => $c->getAutre(),
            ];
        }
        return $this->json($data);
    }

    #[Route('/campaigns/{id}/contacts', name: 'contact_create', methods: ['POST'])]
    public function createContact(Campaign $campaign, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $contact = new Contact();
        $contact->setCampaign($campaign);
        $contact->setNom($data['nom']);
        $contact->setTelephone($data['telephone']);
        $contact->setEmail($data['email'] ?? null);
        $contact->setSource($data['source'] ?? 'manuel');
        $contact->setAutre($data['autre'] ?? null);

        $em->persist($contact);
        $em->flush();

        return $this->json(['status' => 'success', 'id' => $contact->getId()], 201);
    }

    #[Route('/contacts/{id}', name: 'contact_show', methods: ['GET'])]
    public function showContact(Contact $contact): JsonResponse
    {
        return $this->json([
            'id' => $contact->getId(),
            'nom' => $contact->getNom(),
            'telephone' => $contact->getTelephone(),
            'email' => $contact->getEmail(),
            'source' => $contact->getSource(),
            'status' => $contact->getStatus(),
            'autre' => $contact->getAutre(),
            'campaign_id' => $contact->getCampaign()?->getId(),
        ]);
    }

    #[Route('/contacts/{id}', name: 'contact_update', methods: ['PUT'])]
    public function updateContact(Contact $contact, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (isset($data['nom']))
            $contact->setNom($data['nom']);
        if (isset($data['telephone']))
            $contact->setTelephone($data['telephone']);
        if (isset($data['email']))
            $contact->setEmail($data['email']);
        if (isset($data['source']))
            $contact->setSource($data['source']);
        if (isset($data['status']))
            $contact->setStatus($data['status']);
        if (isset($data['autre']))
            $contact->setAutre($data['autre']);

        $em->flush();
        return $this->json(['status' => 'success']);
    }

    #[Route('/contacts/{id}', name: 'contact_delete', methods: ['DELETE'])]
    public function deleteContact(Contact $contact, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($contact);
        $em->flush();
        return $this->json(['status' => 'success']);
    }

    // --- MONITORING ---

    #[Route('/agents/status', name: 'agents_status_monitor', methods: ['GET'])]
    public function monitorAgents(EntityManagerInterface $em): JsonResponse
    {
        $statuses = $em->getRepository(\App\Entity\AgentStatus::class)->findAll();
        $data = array_map(fn($s) => [
            'agent_id' => $s->getAgent()->getId(),
            'nom' => $s->getAgent()->getNom() . ' ' . $s->getAgent()->getPrenom(),
            'status' => $s->getStatus(),
            'updated_at' => $s->getUpdatedAt()->format('H:i:s')
        ], $statuses);

        return $this->json($data);
    }
}
