package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.entity.Store;
import com.cangiuoc.cgfoodtour.entity.User;
import com.cangiuoc.cgfoodtour.enums.StoreStatus;
import com.cangiuoc.cgfoodtour.exception.AppException;
import com.cangiuoc.cgfoodtour.exception.ErrorCode;
import org.springframework.stereotype.Component;

@Component
public class StoreVisibilityPolicy {
    public boolean canViewPublicly(Store store) {
        return store != null && store.getStatus() == StoreStatus.APPROVED;
    }

    public boolean canManage(Store store, User user) {
        if (store == null || user == null) return false;
        if (user.getRoles() != null && user.getRoles().stream().anyMatch(role -> "ADMIN".equals(role.getName()))) {
            return true;
        }
        return store.getOwner() != null && user.getId().equals(store.getOwner().getId());
    }

    public void requireReadable(Store store, User user) {
        if (!canViewPublicly(store) && !canManage(store, user)) {
            throw new AppException(ErrorCode.STORE_NOT_FOUND);
        }
    }
}
