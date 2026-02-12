<?php

namespace App\Controller;

use App\Repository\ContactRepository;
use App\Repository\CampaignRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/contacts', name: 'contacts_')]
#[IsGranted('ROLE_USER')]
class ContactController extends AbstractController
{
    #[Route('/', name: 'list')]
    public function list(ContactRepository $contactRepo, CampaignRepository $campaignRepo): Response
    {
        // Récupérer tous les contacts ou par campagne
        $contacts = $contactRepo->findAll();
        $campaigns = $campaignRepo->findAll();

        return $this->render('contacts/list.html.twig', [
            'contacts' => $contacts,
            'campaigns' => $campaigns,
        ]);
    }

    #[Route('/campaign/{id}', name: 'by_campaign')]
    public function listByCampaign(int $id, ContactRepository $contactRepo, CampaignRepository $campaignRepo): Response
    {
        $campaign = $campaignRepo->find($id);
        if (!$campaign) {
            throw $this->createNotFoundException('Campagne introuvable');
        }

        $contacts = $contactRepo->findBy(['campaign' => $campaign]);

        return $this->render('contacts/list.html.twig', [
            'contacts' => $contacts,
            'campaigns' => $campaignRepo->findAll(),
            'currentCampaign' => $campaign,
        ]);
    }
}
