import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test(
    'Android identity, display name, and minimum SDK are approved values',
    () {
      final gradle = File('android/app/build.gradle.kts').readAsStringSync();
      final manifest = File(
        'android/app/src/main/AndroidManifest.xml',
      ).readAsStringSync();
      final activity = File(
        'android/app/src/main/java/vn/cgfoodtour/admin/MainActivity.java',
      ).readAsStringSync();

      expect(gradle, contains('namespace = "vn.cgfoodtour.admin"'));
      expect(gradle, contains('applicationId = "vn.cgfoodtour.admin"'));
      expect(gradle, contains('minSdk = 24'));
      expect(manifest, contains('android:label="CG FoodTour Admin"'));
      expect(activity, contains('package vn.cgfoodtour.admin;'));
      expect(gradle, isNot(contains('com.example')));
    },
  );

  test('Android cleartext is enabled only by debug overlay', () {
    final mainManifest = File(
      'android/app/src/main/AndroidManifest.xml',
    ).readAsStringSync();
    final debugManifest = File(
      'android/app/src/debug/AndroidManifest.xml',
    ).readAsStringSync();

    expect(mainManifest, contains('android.permission.INTERNET'));
    expect(mainManifest, isNot(contains('usesCleartextTraffic="true"')));
    expect(debugManifest, contains('usesCleartextTraffic="true"'));
  });

  test('iOS cleartext exception uses a debug-only Info.plist', () {
    final releaseInfo = File('ios/Runner/Info.plist').readAsStringSync();
    final debugInfo = File('ios/Runner/Info-Debug.plist').readAsStringSync();
    final project = File(
      'ios/Runner.xcodeproj/project.pbxproj',
    ).readAsStringSync();

    expect(releaseInfo, isNot(contains('NSAllowsArbitraryLoads')));
    expect(debugInfo, contains('NSAllowsArbitraryLoads'));
    expect(project, contains('INFOPLIST_FILE = Runner/Info-Debug.plist;'));
  });

  test(
    'iOS identity, display name, and deployment target are synchronized',
    () {
      final releaseInfo = File('ios/Runner/Info.plist').readAsStringSync();
      final debugInfo = File('ios/Runner/Info-Debug.plist').readAsStringSync();
      final project = File(
        'ios/Runner.xcodeproj/project.pbxproj',
      ).readAsStringSync();
      final podfile = File('ios/Podfile').readAsStringSync();

      expect(
        project,
        contains('PRODUCT_BUNDLE_IDENTIFIER = vn.cgfoodtour.admin;'),
      );
      expect(project, isNot(contains('com.example')));
      expect(
        RegExp('IPHONEOS_DEPLOYMENT_TARGET = 15.0;').allMatches(project),
        hasLength(3),
      );
      expect(releaseInfo, contains('<string>CG FoodTour Admin</string>'));
      expect(debugInfo, contains('<string>CG FoodTour Admin</string>'));
      expect(podfile, contains("platform :ios, '15.0'"));
    },
  );
}
