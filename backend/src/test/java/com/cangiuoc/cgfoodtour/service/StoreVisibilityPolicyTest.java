package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.entity.Role;
import com.cangiuoc.cgfoodtour.entity.Store;
import com.cangiuoc.cgfoodtour.entity.User;
import com.cangiuoc.cgfoodtour.enums.StoreStatus;
import com.cangiuoc.cgfoodtour.exception.AppException;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StoreVisibilityPolicyTest {
    private final StoreVisibilityPolicy policy = new StoreVisibilityPolicy();

    @Test
    void onlyApprovedStoresArePublic() {
        assertThat(policy.canViewPublicly(Store.builder().status(StoreStatus.APPROVED).build())).isTrue();
        assertThat(policy.canViewPublicly(Store.builder().status(StoreStatus.PENDING).build())).isFalse();
        assertThat(policy.canViewPublicly(Store.builder().status(StoreStatus.HIDDEN).build())).isFalse();
    }

    @Test
    void ownerAndAdminCanReadNonPublicStoreButUnrelatedUserSeesNotFound() {
        User owner = User.builder().id("owner").build();
        User unrelated = User.builder().id("other").build();
        User admin = User.builder().id("admin")
                .roles(Set.of(Role.builder().name("ADMIN").build()))
                .build();
        Store pending = Store.builder().owner(owner).status(StoreStatus.PENDING).build();

        assertThat(policy.canManage(pending, owner)).isTrue();
        assertThat(policy.canManage(pending, admin)).isTrue();
        assertThatThrownBy(() -> policy.requireReadable(pending, unrelated))
                .isInstanceOf(AppException.class);
    }
}
