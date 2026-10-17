package com.cangiuoc.cgfoodtour.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PageResponse<T> {

    List<T> content;
    long totalElements;
    int totalPages;
    int size;
    int page;
    boolean first;
    boolean last;

    public static <T> PageResponse<T> from(org.springframework.data.domain.Page<?> pageData, List<T> content) {
        return PageResponse.<T>builder()
                .content(content)
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .size(pageData.getSize())
                .page(pageData.getNumber())
                .first(pageData.isFirst())
                .last(pageData.isLast())
                .build();
    }
}
