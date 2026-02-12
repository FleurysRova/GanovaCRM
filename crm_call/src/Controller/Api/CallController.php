<?php

namespace App\Controller\Api;

use App\Entity\Call;
use App\Entity\CallQualification;
use App\Entity\QualificationField;
use App\Entity\QualificationValue;
use App\Entity\AgentStatus;
use App\Entity\Campaign;
use App\Entity\Contact;
use App\Entity\User;
use App\Repository\CallRepository;
use App\Repository\AgentStatusRepository;
use App\Repository\QualificationFieldRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api', name: 'api_calls_')]
class CallController extends AbstractController
{
    // --- GESTION DES APPELS ---

    #[Route('/calls', name: 'start', methods: ['POST'])]
    public function startCall(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $user = $this->getUser();

        if (!$user instanceof User) {
            return $this->json(['error' => 'Utilisateur non authentifié'], 401);
        }

        $campaign = $em->getRepository(Campaign::class)->find($data['campaign_id'] ?? 0);
        $contact = $em->getRepository(Contact::class)->find($data['contact_id'] ?? 0);

        if (!$campaign || !$contact) {
            return $this->json(['error' => 'Campagne ou Contact introuvable'], 404);
        }

        $call = new Call();
        $call->setCampaign($campaign);
        $call->setAgent($user);
        $call->setContact($contact);
        $call->setStartTime(new \DateTime());
        $call->setStatus('EN_COURS');

        $em->persist($call);
        $em->flush();

        return $this->json([
            'status' => 'success',
            'call_id' => $call->getId()
        ], 201);
    }

    #[Route('/calls/{id}/end', name: 'end', methods: ['PUT'])]
    public function endCall(Call $call, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if ($call->getStatus() !== 'EN_COURS') {
            return $this->json(['error' => 'Cet appel est déjà terminé'], 400);
        }

        $endTime = new \DateTime();
        $call->setEndTime($endTime);
        $call->setStatus('TERMINE');

        // Calculer la durée
        $duration = $endTime->getTimestamp() - $call->getStartTime()->getTimestamp();
        $call->setDuration($duration);

        if (isset($data['recording_path'])) {
            $call->setRecordingPath($data['recording_path']);
        }

        $em->flush();

        return $this->json([
            'status' => 'success',
            'duration' => $duration
        ]);
    }

    #[Route('/calls/{id}/qualify', name: 'qualify', methods: ['POST'])]
    public function qualifyCall(Call $call, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $qualification = new CallQualification();
        $qualification->setCall($call);
        $qualification->setStatus($data['status'] ?? 'QUALIFIE');
        $qualification->setQualifiedAt(new \DateTime());

        $em->persist($qualification);

        // Sauvegarder les valeurs des champs personnalisés
        if (isset($data['values']) && is_array($data['values'])) {
            foreach ($data['values'] as $fieldId => $value) {
                $field = $em->getRepository(QualificationField::class)->find($fieldId);
                if ($field) {
                    $qualValue = new QualificationValue();
                    $qualValue->setCall($call);
                    $qualValue->setField($field);
                    $qualValue->setValue((string) $value);
                    $em->persist($qualValue);
                }
            }
        }

        $em->flush();

        return $this->json(['status' => 'success']);
    }

    // --- GESTION DES CHAMPS DE QUALIFICATION (ADMIN) ---

    #[Route('/campaigns/{id}/qualif-fields', name: 'fields_list', methods: ['GET'])]
    public function listQualifFields(Campaign $campaign, QualificationFieldRepository $repo): JsonResponse
    {
        $fields = $repo->findBy(['campaign' => $campaign]);
        $data = array_map(fn($f) => [
            'id' => $f->getId(),
            'label' => $f->getLabel(),
            'type' => $f->getType(),
            'required' => $f->isRequired()
        ], $fields);

        return $this->json($data);
    }

    #[Route('/campaigns/{id}/qualif-fields', name: 'fields_add', methods: ['POST'])]
    #[IsGranted('ROLE_RESPONSABLE')]
    public function addQualifField(Campaign $campaign, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        $field = new QualificationField();
        $field->setCampaign($campaign);
        $field->setLabel($data['label']);
        $field->setType($data['type'] ?? 'text');
        $field->setRequired($data['required'] ?? false);

        $em->persist($field);
        $em->flush();

        return $this->json(['status' => 'success', 'id' => $field->getId()], 201);
    }

    #[Route('/qualif-fields/{id}', name: 'fields_update', methods: ['PUT'])]
    #[IsGranted('ROLE_RESPONSABLE')]
    public function updateQualifField(QualificationField $field, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        if (isset($data['label']))
            $field->setLabel($data['label']);
        if (isset($data['type']))
            $field->setType($data['type']);
        if (isset($data['required']))
            $field->setRequired($data['required']);

        $em->flush();
        return $this->json(['status' => 'success']);
    }

    #[Route('/qualif-fields/{id}', name: 'fields_delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_RESPONSABLE')]
    public function deleteQualifField(QualificationField $field, EntityManagerInterface $em): JsonResponse
    {
        $em->remove($field);
        $em->flush();
        return $this->json(['status' => 'success']);
    }

    // --- REPORTING / LISTES ---

    #[Route('/campaigns/{id}/calls', name: 'list_by_campaign', methods: ['GET'])]
    public function listCallsByCampaign(Campaign $campaign, CallRepository $repo): JsonResponse
    {
        $calls = $repo->findBy(['campaign' => $campaign], ['startTime' => 'DESC']);
        $data = array_map(fn($c) => [
            'id' => $c->getId(),
            'agent' => $c->getAgent()->getNom() . ' ' . $c->getAgent()->getPrenom(),
            'contact' => $c->getContact()->getNom(),
            'start' => $c->getStartTime()->format('Y-m-d H:i:s'),
            'duration' => $c->getDuration(),
            'status' => $c->getStatus(),
            'qualification' => $c->getCallQualification()?->getStatus()
        ], $calls);

        return $this->json($data);
    }

    // --- STATUT DES AGENTS ---

    #[Route('/agent/status', name: 'agent_status_get', methods: ['GET'])]
    public function getStatus(AgentStatusRepository $repo): JsonResponse
    {
        $user = $this->getUser();
        $status = $repo->findOneBy(['agent' => $user]);

        if (!$status) {
            return $this->json(['status' => 'INCONNU']);
        }

        return $this->json([
            'status' => $status->getStatus(),
            'updated_at' => $status->getUpdatedAt()->format('H:i:s')
        ]);
    }

    #[Route('/agent/status', name: 'agent_status_update', methods: ['PUT'])]
    public function updateStatus(Request $request, EntityManagerInterface $em, AgentStatusRepository $repo): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $user = $this->getUser();

        $status = $repo->findOneBy(['agent' => $user]);
        if (!$status) {
            $status = new AgentStatus();
            $status->setAgent($user);
        }

        $status->setStatus($data['status'] ?? 'DISPONIBLE');
        $status->setUpdatedAt(new \DateTime());

        $em->persist($status);
        $em->flush();

        return $this->json(['status' => 'success']);
    }
}
