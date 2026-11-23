
<?php

require_once __DIR__ . '/../config/db.php';

header('Content-Type: application/json; charset=utf-8');

try {

    // استقبال رقم الفني
    $worker_id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    if ($worker_id <= 0) {
        http_response_code(400);

        echo json_encode([
            'success' => false,
            'message' => 'رقم الفني غير صحيح.'
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    // جلب بيانات الفني المعتمد
    $sql = "
        SELECT
            wp.id,
            u.full_name,
            u.phone,
            c.name AS category_name,
            wp.location,
            wp.experience_years,
            wp.bio,
            wp.starting_price,
            wp.profile_image

        FROM worker_profiles wp

        INNER JOIN users u
            ON wp.user_id = u.id

        INNER JOIN categories c
            ON wp.category_id = c.id

        WHERE wp.id = ?
          AND wp.approval_status = 'approved'

        LIMIT 1
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$worker_id]);

    $worker = $stmt->fetch(PDO::FETCH_ASSOC);

    // لو الفني مش موجود أو مش معتمد
    if (!$worker) {
        http_response_code(404);

        echo json_encode([
            'success' => false,
            'message' => 'الفني غير موجود أو لم تتم الموافقة على حسابه.'
        ], JSON_UNESCAPED_UNICODE);

        exit;
    }

    // إرجاع البيانات
    echo json_encode([
        'success' => true,
        'worker' => $worker
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'حدث خطأ أثناء جلب بيانات الفني.'
    ], JSON_UNESCAPED_UNICODE);
}
