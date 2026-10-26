// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'CG FoodTour Admin';

  @override
  String get adminOnlyNotice => 'Administrators only';

  @override
  String get emailLabel => 'Email';

  @override
  String get passwordLabel => 'Password';

  @override
  String get loginAction => 'Sign in';

  @override
  String get foundationNotice => 'Secure sign-in will be implemented in F1.';

  @override
  String get dashboardLabel => 'Overview';

  @override
  String get storesLabel => 'Stores';

  @override
  String get usersLabel => 'Users';

  @override
  String get categoriesLabel => 'Categories';

  @override
  String get retryAction => 'Retry';

  @override
  String get cancelAction => 'Cancel';

  @override
  String get confirmAction => 'Confirm';

  @override
  String get loadingLabel => 'Loading';

  @override
  String get emptyTitle => 'No data yet';

  @override
  String get errorTitle => 'Unable to load data';
}
