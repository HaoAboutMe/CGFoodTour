package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.entity.Store;
import com.cangiuoc.cgfoodtour.enums.StoreAction;
import com.cangiuoc.cgfoodtour.enums.StoreStatus;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import org.springframework.stereotype.Component;

@Component
public class StoreTransitionPolicy {
    public void apply(Store store, StoreAction action, ActorContext actor, String reason) {
        if (actor == null || (!actor.admin() && !actor.owner())) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        switch (action) {
            case APPROVE -> {
                requireAdminPending(store, actor);
                store.setStatus(StoreStatus.APPROVED);
                store.setIsVerified(true);
                store.setRejectionReason(null);
            }
            case REJECT -> {
                requireAdminPending(store, actor);
                if (reason == null || reason.isBlank()) throw invalid();
                store.setStatus(StoreStatus.REJECTED);
                store.setIsVerified(false);
                store.setRejectionReason(reason.trim());
            }
            case EDIT_PENDING -> requireStatus(store, StoreStatus.PENDING);
            case RESUBMIT_AFTER_EDIT -> {
                if (store.getStatus() != StoreStatus.REJECTED && store.getStatus() != StoreStatus.APPROVED) {
                    throw invalid();
                }
                store.setStatus(StoreStatus.PENDING);
                store.setIsVerified(false);
                store.setRejectionReason(null);
            }
            case EDIT_HIDDEN -> requireStatus(store, StoreStatus.HIDDEN);
            case HIDE -> {
                requireStatus(store, StoreStatus.APPROVED);
                if (actor.admin() && (reason == null || reason.isBlank())) {
                    throw new AppException(ErrorCode.STORE_REASON_REQUIRED);
                }
                store.setStatus(StoreStatus.HIDDEN);
                store.setHiddenByAdmin(actor.admin());
                store.setHideReason(reason);
            }
            case RECOVER -> {
                requireStatus(store, StoreStatus.HIDDEN);
                if (Boolean.TRUE.equals(store.getHiddenByAdmin()) && !actor.admin()) {
                    throw new AppException(ErrorCode.STORE_HIDDEN_BY_ADMIN_CANNOT_RECOVER);
                }
                store.setStatus(StoreStatus.APPROVED);
                store.setHiddenByAdmin(false);
                store.setHideReason(null);
                store.setRecoveryRequested(false);
                store.setRecoveryRequestReason(null);
                store.setRecoveryDeclineReason(null);
            }
            case SUBMIT, REQUEST_RECOVERY, REJECT_RECOVERY_REQUEST, HARD_DELETE -> {
                // These actions have additional service-level data rules but are still audited centrally.
            }
        }
    }

    public StoreAction ownerEditAction(Store store) {
        return switch (store.getStatus()) {
            case PENDING -> StoreAction.EDIT_PENDING;
            case APPROVED, REJECTED -> StoreAction.RESUBMIT_AFTER_EDIT;
            case HIDDEN -> StoreAction.EDIT_HIDDEN;
        };
    }

    private void requireAdminPending(Store store, ActorContext actor) {
        if (!actor.admin()) throw new AppException(ErrorCode.UNAUTHORIZED);
        requireStatus(store, StoreStatus.PENDING);
    }

    private void requireStatus(Store store, StoreStatus status) {
        if (store.getStatus() != status) throw invalid();
    }

    private AppException invalid() {
        return new AppException(ErrorCode.INVALID_STORE_STATE_TRANSITION);
    }
}
