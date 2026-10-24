package com.cangiuoc.cgfoodtour.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerStoreHistoryItemResponse {
    Long eventId;
    String storeId;
    String storeName;
    String action;
    String actorType;
    String statusBefore;
    String statusAfter;
    String reason;
    OffsetDateTime occurredAt;
    Boolean resourceAvailable;
    String recommendedAction;
}
