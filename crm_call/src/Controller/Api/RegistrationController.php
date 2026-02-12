<?php

namespace App\Controller\Api;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

class RegistrationController extends AbstractController
{
    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function register(Request $request, UserPasswordHasherInterface $hasher, EntityManagerInterface $em): JsonResponse
    {
        try {
            $data = json_decode($request->getContent(), true);

            if (empty($data['email']) || empty($data['password']) || empty($data['nom']) || empty($data['prenom'])) {
                return $this->json(['error' => 'Tous les champs sont obligatoires'], 400);
            }

            // Vérifier si l'utilisateur existe déjà
            $existingUser = $em->getRepository(User::class)->findOneBy(['email' => $data['email']]);
            if ($existingUser) {
                return $this->json(['error' => 'Cet email est déjà utilisé'], 400);
            }

            $user = new User();
            $user->setEmail($data['email']);
            $user->setNom($data['nom']);
            $user->setPrenom($data['prenom']);
            $user->setRoleUsers($data['role'] ?? 'agent');
            $user->setStatus('inactive'); // Toujours inactif à l'inscription

            $hashed = $hasher->hashPassword($user, $data['password']);
            $user->setPassword($hashed);

            $em->persist($user);
            $em->flush();

            return $this->json([
                'status' => 'success',
                'message' => 'Inscription réussie. Votre compte est en attente de validation par un responsable.'
            ], 201);

        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], 500);
        }
    }
}
