package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.entity.Store;
import com.cangiuoc.cgfoodtour.entity.User;
import com.cangiuoc.cgfoodtour.enums.StoreAction;
import com.cangiuoc.cgfoodtour.enums.StoreStatus;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StoreTransitionPolicyTest {
    private final StoreTransitionPolicy policy = new StoreTransitionPolicy();
    private final User actor = User.builder().id("user-1").email("user@example.com").build();

    @Test
    void approveOnlyAcceptsPendingStore() {
        Store store = Store.builder().status(StoreStatus.PENDING).build();
        policy.apply(store, StoreAction.APPROVE, new ActorContext(actor, true, false), null);
        assertThat(store.getStatus()).isEqualTo(StoreStatus.APPROVED);
        assertThat(store.getIsVerified()).isTrue();

        assertThatThrownBy(() -> policy.apply(store, StoreAction.APPROVE,
                new ActorContext(actor, true, false), null))
                .isInstanceOfSatisfying(AppException.class,
                        exception -> assertThat(exception.getErrorCode())
                                .isEqualTo(ErrorCode.INVALID_STORE_STATE_TRANSITION));
    }

    @Test
    void ownerEditResubmitsApprovedButKeepsHiddenStoreHidden() {
        Store approved = Store.builder().status(StoreStatus.APPROVED).isVerified(true).build();
        StoreAction action = policy.ownerEditAction(approved);
        policy.apply(approved, action, new ActorContext(actor, false, true), null);
        assertThat(approved.getStatus()).isEqualTo(StoreStatus.PENDING);
        assertThat(approved.getIsVerified()).isFalse();

        Store hidden = Store.builder().status(StoreStatus.HIDDEN).hiddenByAdmin(true).build();
        policy.apply(hidden, policy.ownerEditAction(hidden), new ActorContext(actor, false, true), null);
        assertThat(hidden.getStatus()).isEqualTo(StoreStatus.HIDDEN);
        assertThat(hidden.getHiddenByAdmin()).isTrue();
    }

    @Test
    void ownerCannotRecoverAdminHiddenStore() {
        Store hidden = Store.builder().status(StoreStatus.HIDDEN).hiddenByAdmin(true).build();
        assertThatThrownBy(() -> policy.apply(hidden, StoreAction.RECOVER,
                new ActorContext(actor, false, true), null))
                .isInstanceOfSatisfying(AppException.class,
                        exception -> assertThat(exception.getErrorCode())
                                .isEqualTo(ErrorCode.STORE_HIDDEN_BY_ADMIN_CANNOT_RECOVER));
    }
}
