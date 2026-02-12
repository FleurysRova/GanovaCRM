<?php
// get_hash.php
require 'vendor/autoload.php';
use App\Kernel;
use Symfony\Component\Dotenv\Dotenv;

$dotenv = new Dotenv();
$dotenv->load(__DIR__.'/.env');

$kernel = new Kernel($_SERVER['APP_ENV'] ?? 'dev', (bool) ($_SERVER['APP_DEBUG'] ?? true));
$kernel->boot();
$container = $kernel->getContainer();
$hasher = $container->get('security.user_password_hasher');

$userClass = \App\Entity\User::class;
$user = new $userClass();
$hash = $hasher->hashPassword($user, 'admin123');

echo "HASH:" . $hash . "\n";
