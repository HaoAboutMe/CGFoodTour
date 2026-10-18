package com.cangiuoc.cgfoodtour.service;

import com.cangiuoc.cgfoodtour.entity.User;

public record ActorContext(User user, boolean admin, boolean owner) {
    public String role() {
        return admin ? "ADMIN" : "OWNER";
    }
}
