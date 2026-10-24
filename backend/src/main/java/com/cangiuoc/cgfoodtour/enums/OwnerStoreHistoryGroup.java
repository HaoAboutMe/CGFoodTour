package com.cangiuoc.cgfoodtour.enums;

import java.util.Set;

public enum OwnerStoreHistoryGroup {
    ALL(Set.of()),
    WAITING(Set.of(
            StoreAction.SUBMIT,
            StoreAction.EDIT_PENDING,
            StoreAction.RESUBMIT_AFTER_EDIT,
            StoreAction.REQUEST_RECOVERY
    )),
    SUCCESS(Set.of(StoreAction.APPROVE, StoreAction.RECOVER)),
    ACTION_REQUIRED(Set.of(
            StoreAction.REJECT,
            StoreAction.HIDE,
            StoreAction.REJECT_RECOVERY_REQUEST
    )),
    HIDDEN(Set.of(
            StoreAction.HIDE,
            StoreAction.EDIT_HIDDEN,
            StoreAction.REQUEST_RECOVERY,
            StoreAction.REJECT_RECOVERY_REQUEST
    )),
    DELETED(Set.of(StoreAction.HARD_DELETE));

    private final Set<StoreAction> actions;

    OwnerStoreHistoryGroup(Set<StoreAction> actions) {
        this.actions = actions;
    }

    public Set<StoreAction> actions() {
        return actions;
    }
}
