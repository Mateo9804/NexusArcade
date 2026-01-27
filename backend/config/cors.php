<?php

return [
    'paths' => ['*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => explode(',', env('ALLOWED_ORIGINS', 'http://localhost:5173,https://nexusarcade-esp.vercel.app')),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
