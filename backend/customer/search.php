
<?php

// 1. الاتصال بقاعدة البيانات
require_once __DIR__ . '/../config/db.php';

// تحديد نوع الاستجابة JSON
header('Content-Type: application/json; charset=utf-8');

try {

    // 2. استقبال بيانات البحث والفلترة
    $search = isset($_GET['search'])
        ? trim($_GET['search'])
        : '';

    $category_id = isset($_GET['category_id'])
        ? (int) $_GET['category_id']
        : 0;

    $location = isset($_GET['location'])
        ? trim($_GET['location'])
        : '';

    $sort = isset($_GET['sort'])
        ? $_GET['sort']
        : 'newest';


    // 3. تحديد ترتيب النتائج
    switch ($sort) {

        case 'price_low':
            $orderBy = 'wp.starting_price ASC, wp.created_at DESC';
            break;

        case 'price_high':
            $orderBy = 'wp.starting_price DESC, wp.created_at DESC';
            break;

        default:
            $orderBy = 'wp.created_at DESC';
            break;
    }


    // 4. تجهيز استعلام العمال المعتمدين
    $sql = "
        SELECT
            wp.id,
            wp.user_id,
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

        WHERE wp.approval_status = 'approved'
    ";

    $params = [];


    // 5. البحث باسم العامل
    if ($search !== '') {

        $sql .= " AND u.full_name LIKE ?";

        $params[] = "%{$search}%";
    }


    // 6. الفلترة حسب المهنة
    if ($category_id > 0) {

        $sql .= " AND wp.category_id = ?";

        $params[] = $category_id;
    }


    // 7. الفلترة حسب المنطقة
    if ($location !== '') {

        $sql .= " AND wp.location = ?";

        $params[] = $location;
    }


    // 8. ترتيب النتائج
    $sql .= " ORDER BY " . $orderBy;


    // 9. تنفيذ الاستعلام
    $stmt = $pdo->prepare($sql);

    $stmt->execute($params);

    $workers = $stmt->fetchAll(PDO::FETCH_ASSOC);


    // 10. جلب المهن المتاحة لقائمة الفلترة
    $categoriesStmt = $pdo->query("
        SELECT id, name
        FROM categories
        WHERE is_active = 1
        ORDER BY name ASC
    ");

    $categories = $categoriesStmt->fetchAll(PDO::FETCH_ASSOC);


    // 11. جلب المناطق المتاحة للعمال المعتمدين
    $locationsStmt = $pdo->query("
        SELECT DISTINCT location
        FROM worker_profiles
        WHERE approval_status = 'approved'
          AND location IS NOT NULL
          AND location <> ''
        ORDER BY location ASC
    ");

    $locations = $locationsStmt->fetchAll(PDO::FETCH_COLUMN);


    // 12. إرجاع النتائج بصيغة JSON
    echo json_encode([

        'success' => true,

        'count' => count($workers),

        'workers' => $workers,

        'filters' => [
            'categories' => $categories,
            'locations' => $locations
        ]

    ], JSON_UNESCAPED_UNICODE);


} catch (PDOException $e) {

    // تسجيل الخطأ في السيرفر
    error_log($e->getMessage());

    // إرجاع كود خطأ HTTP
    http_response_code(500);

    // رسالة خطأ للمستخدم
    echo json_encode([

        'success' => false,

        'message' => 'حدث خطأ أثناء جلب بيانات العمال.'

    ], JSON_UNESCAPED_UNICODE);

}

?>