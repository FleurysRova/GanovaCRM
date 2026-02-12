<?php

namespace App\Controller\Api;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api', name: 'api_')]
final class ProfileController extends AbstractController
{
    /**
     * Route accessible par tout le monde connecté
     */
    #[Route('/profile', name: 'profile', methods: ['GET'])]
    public function index(): JsonResponse
    {
        $user = $this->getUser();
        
        return $this->json([
            'status' => 'success',
            'data' => [
                'email' => $user->getUserIdentifier(),
                'nom' => $user->getNom(),
                'prenom' => $user->getPrenom(),
                'roles' => $user->getRoles(),
                'role_crm' => $user->getRoleUsers(),
            ]
        ]);
    }

    /**
     * Route réservée aux Agents et aux Responsables (Grâce à la hiérarchie)
     */
    #[Route('/agent/dashboard', name: 'agent_dashboard', methods: ['GET'])]
    #[IsGranted('ROLE_AGENT')]
    public function agentDashboard(): JsonResponse
    {
        return $this->json([
            'status' => 'success',
            'message' => 'Contenu du dashboard agent accessible.',
            'timestamp' => time()
        ]);
    }

    /**
     * Route strictement réservée aux Responsables
     */
    #[Route('/admin/management', name: 'admin_management', methods: ['GET'])]
    #[IsGranted('ROLE_RESPONSABLE')]
    public function adminManagement(): JsonResponse
    {
        return $this->json([
            'status' => 'success',
            'message' => 'Zone Haute Sécurité : Gestion administrative.',
            'secret_key' => 'CRM_ZANOVA_2026'
        ]);
    }

    /**
     * Route réservée aux Superviseurs (et Responsables via hiérarchie)
     */
    #[Route('/supervisor/dashboard', name: 'supervisor_dashboard', methods: ['GET'])]
    #[IsGranted('ROLE_SUPERVISEUR')]
    public function supervisorDashboard(): JsonResponse
    {
        return $this->json([
            'status' => 'success',
            'message' => 'Contenu du dashboard superviseur accessible.',
            'timestamp' => time()
        ]);
    }
}
