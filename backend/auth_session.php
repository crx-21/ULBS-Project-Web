<?php

function auth_set_user_session(array $user): void
{
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['userId'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['session_id'] = session_id();
}

function auth_is_logged_in(): bool
{
    return isset($_SESSION['user_id']);
}

function auth_user_payload(): array
{
    return [
        'id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'role' => $_SESSION['role'] ?? null,
    ];
}

function auth_json_logged_in(string $message = 'Authenticated'): array
{
    return [
        'success' => true,
        'logged_in' => true,
        'message' => $message,
        'session_id' => session_id(),
        'user' => auth_user_payload(),
    ];
}

function auth_clear_session(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }
    session_destroy();
}
