import 'package:flutter_riverpod/flutter_riverpod.dart';

enum AuthStatus {
  bootstrapping,
  anonymous,
  authenticatedAdmin,
  authenticatedNonAdmin,
  locked,
}

class AuthState {
  const AuthState(this.status);

  const AuthState.bootstrapping() : status = AuthStatus.bootstrapping;
  const AuthState.anonymous() : status = AuthStatus.anonymous;

  final AuthStatus status;

  bool get isAdmin => status == AuthStatus.authenticatedAdmin;
}

class AuthStateController extends Notifier<AuthState> {
  @override
  AuthState build() => const AuthState.anonymous();

  void setState(AuthState nextState) => state = nextState;
}

final authStateProvider = NotifierProvider<AuthStateController, AuthState>(
  AuthStateController.new,
);
