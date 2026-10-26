// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Vietnamese (`vi`).
class AppLocalizationsVi extends AppLocalizations {
  AppLocalizationsVi([String locale = 'vi']) : super(locale);

  @override
  String get appTitle => 'CG FoodTour Admin';

  @override
  String get adminOnlyNotice => 'Chỉ dành cho quản trị viên';

  @override
  String get emailLabel => 'Email';

  @override
  String get passwordLabel => 'Mật khẩu';

  @override
  String get loginAction => 'Đăng nhập';

  @override
  String get foundationNotice => 'Đăng nhập an toàn sẽ được triển khai ở F1.';

  @override
  String get dashboardLabel => 'Tổng quan';

  @override
  String get storesLabel => 'Quán';

  @override
  String get usersLabel => 'Người dùng';

  @override
  String get categoriesLabel => 'Danh mục';

  @override
  String get retryAction => 'Thử lại';

  @override
  String get cancelAction => 'Hủy';

  @override
  String get confirmAction => 'Xác nhận';

  @override
  String get loadingLabel => 'Đang tải';

  @override
  String get emptyTitle => 'Chưa có dữ liệu';

  @override
  String get errorTitle => 'Không thể tải dữ liệu';
}
